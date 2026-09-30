import postgres from "postgres";
import { TEST_DB } from "./global-setup";

export const hasDb = !!process.env.TEST_DATABASE_ADMIN_URL;

export function testDbUrl() {
  const url = new URL(process.env.TEST_DATABASE_ADMIN_URL!);
  url.pathname = `/${TEST_DB}`;
  return url.toString();
}

/** A connection that acts as the app does: the service_role (what the secret key maps to). */
export function connectAs(role: "service_role" | "anon" | "authenticated", max = 1) {
  return postgres(testDbUrl(), {
    max,
    onnotice: () => {},
    connection: { options: `-c role=${role}` },
  });
}
