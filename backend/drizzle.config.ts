import "dotenv/config";
import type { Config } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Check your .env file.");
}

export default {
  schema: "./shared/schema.ts",
  out: "./migrations",
  driver: "pg", // ✅ IMPORTANT FIX
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
} satisfies Config;