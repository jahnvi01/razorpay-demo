// Applies supabase/migrations/*.sql in order, each once, each in its own transaction.
//
//   npm run db:migrate            uses DATABASE_URL from .env.local
//   DATABASE_URL=... npm run db:migrate
//
// Applied migrations are tracked in app_private.schema_migrations (not exposed by the API).
// A migration that was edited after being applied stops the run, so history cannot drift.
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import postgres from "postgres";

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, "../supabase/migrations");

export async function migrate(databaseUrl, { log = console.log } = {}) {
  const sql = postgres(databaseUrl, { max: 1, onnotice: () => {} });
  try {
    await sql`create schema if not exists app_private`;
    await sql`
      create table if not exists app_private.schema_migrations (
        name text primary key,
        checksum text not null,
        applied_at timestamptz not null default now()
      )`;
    await sql`revoke all on schema app_private from public`;

    const applied = new Map(
      (await sql`select name, checksum from app_private.schema_migrations`).map((r) => [r.name, r.checksum]),
    );
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();

    let count = 0;
    for (const file of files) {
      const body = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
      const checksum = createHash("sha256").update(body).digest("hex");
      if (applied.has(file)) {
        if (applied.get(file) !== checksum) {
          throw new Error(`${file} was changed after it was applied. Add a new migration instead.`);
        }
        continue;
      }
      await sql.begin(async (tx) => {
        await tx.unsafe(body);
        await tx`insert into app_private.schema_migrations (name, checksum) values (${file}, ${checksum})`;
      });
      log(`applied ${file}`);
      count++;
    }
    log(count ? `${count} migration(s) applied` : "database is up to date");
    return count;
  } finally {
    await sql.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Add it to .env.local (Supabase > Connect > Session pooler).");
    process.exit(1);
  }
  migrate(url).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
