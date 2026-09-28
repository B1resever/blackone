import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";

let pool: Pool | null = null;

export function getDbPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  if (!pool) {
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 5 });
    attachDatabasePool(pool);
  }
  return pool;
}
