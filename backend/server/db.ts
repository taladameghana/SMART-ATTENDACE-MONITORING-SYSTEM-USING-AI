import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import * as schema from "../shared/schema.js";

const { Pool } = pkg;

const pool = new Pool({
  host: "localhost",
  port: 5433,
  user: "postgres",
  password: "postgres123", // HARDCODE TEMP FIX
  database: "wellbeing_tracker",
});

export const db = drizzle(pool, { schema });
export { pool };