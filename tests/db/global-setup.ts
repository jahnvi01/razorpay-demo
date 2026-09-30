// Builds a fresh local test database before the DB tests run:
// Supabase roles and default grants (local only), then our real migrations via the real runner.
// Needs TEST_DATABASE_ADMIN_URL, e.g. postgres://postgres@localhost:54329/postgres
import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { migrate } from "../../scripts/migrate.mjs";

export const TEST_DB = "udhaar_test";

export default async function setup() {
  const admin = process.env.TEST_DATABASE_ADMIN_URL;
  if (!admin) return; // DB tests skip themselves
  const sql = postgres(admin, { max: 1, onnotice: () => {} });
  await sql.unsafe(`drop database if exists ${TEST_DB} with (force)`);
  await sql.unsafe(`create database ${TEST_DB}`);
  await sql.end();

  const url = new URL(admin);
  url.pathname = `/${TEST_DB}`;
  const db = postgres(url.toString(), { max: 1, onnotice: () => {} });
  await db.unsafe(await readFile(path.join(import.meta.dirname, "local-supabase-bootstrap.sql"), "utf8"));
  await db.end();
  await migrate(url.toString(), { log: () => {} });
}
