// LOCAL TESTS ONLY: a stand-in for a hosted Supabase project, so e2e tests exercise the real
// app code (supabase-js, RPCs, RLS) without touching the real project.
//
//   TEST_DATABASE_ADMIN_URL=postgres://postgres@localhost:54329/postgres node tests/local-supabase/start.mjs
//
// 1. Creates a fresh database with Supabase's roles and our migrations.
// 2. Runs PostgREST (the engine behind Supabase's REST API).
// 3. Runs a gateway on :54321 that, like Supabase, maps the API key to a database role:
//    LOCAL_SECRET_KEY -> service_role, LOCAL_PUBLISHABLE_KEY -> anon, anything else -> 401.
import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import postgres from "postgres";
import { migrate } from "../../scripts/migrate.mjs";

export const LOCAL_SECRET_KEY = "sb_secret_local_test_only";
export const LOCAL_PUBLISHABLE_KEY = "sb_publishable_local_test_only";
const GATEWAY_PORT = 54321;
const POSTGREST_PORT = 54330;
const DB_NAME = "udhaar_e2e";
const JWT_SECRET = "local-test-jwt-secret-that-is-at-least-32-chars";

const admin = process.env.TEST_DATABASE_ADMIN_URL;
if (!admin) throw new Error("Set TEST_DATABASE_ADMIN_URL");

const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
function jwt(role) {
  const head = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ role, iat: 1700000000, exp: 4100000000 })}`;
  return `${head}.${createHmac("sha256", JWT_SECRET).update(head).digest("base64url")}`;
}
const tokens = { [LOCAL_SECRET_KEY]: jwt("service_role"), [LOCAL_PUBLISHABLE_KEY]: jwt("anon") };

// 1. Fresh database
const sql = postgres(admin, { max: 1, onnotice: () => {} });
await sql.unsafe(`drop database if exists ${DB_NAME} with (force)`);
await sql.unsafe(`create database ${DB_NAME}`);
await sql.end();
const dbUrl = new URL(admin);
dbUrl.pathname = `/${DB_NAME}`;
const db = postgres(dbUrl.toString(), { max: 1, onnotice: () => {} });
await db.unsafe(await readFile(path.join(import.meta.dirname, "../db/local-supabase-bootstrap.sql"), "utf8"));
await db.end();
await migrate(dbUrl.toString(), { log: () => {} });

// 2. PostgREST
const authUrl = new URL(dbUrl);
authUrl.username = "authenticator";
authUrl.password = "authenticator";
const postgrest = spawn("postgrest", [], {
  env: {
    ...process.env,
    PGRST_DB_URI: authUrl.toString(),
    PGRST_DB_SCHEMAS: "public",
    PGRST_DB_ANON_ROLE: "anon",
    PGRST_JWT_SECRET: JWT_SECRET,
    PGRST_SERVER_PORT: String(POSTGREST_PORT),
    PGRST_LOG_LEVEL: "error",
  },
  stdio: "inherit",
});
process.on("exit", () => postgrest.kill());
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => process.exit(0));

// 3. Gateway
http
  .createServer((req, res) => {
    const token = tokens[req.headers.apikey];
    if (!token) {
      res.writeHead(401, { "content-type": "application/json" }).end('{"message":"Invalid API key"}');
      return;
    }
    if (!req.url.startsWith("/rest/v1")) {
      res.writeHead(404).end();
      return;
    }
    const headers = { ...req.headers, authorization: `Bearer ${token}`, host: `localhost:${POSTGREST_PORT}` };
    delete headers.apikey;
    const upstream = http.request(
      { port: POSTGREST_PORT, path: req.url.slice("/rest/v1".length) || "/", method: req.method, headers },
      (up) => {
        res.writeHead(up.statusCode, up.headers);
        up.pipe(res);
      },
    );
    upstream.on("error", (err) => res.writeHead(502).end(String(err)));
    req.pipe(upstream);
  })
  .listen(GATEWAY_PORT, () => console.log(`local supabase ready on http://localhost:${GATEWAY_PORT}`));
