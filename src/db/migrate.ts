import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

export async function migrateDb(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  // Separate migration client; keep connections low for Neon.
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);
  try {
    await migrate(db, { migrationsFolder: "src/db/migrations" });
  } finally {
    await client.end({ timeout: 5 });
  }
}

