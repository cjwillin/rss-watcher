import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export type Db = ReturnType<typeof drizzle>;

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  return postgres(url, {
    // Neon recommends a low number of connections for serverless.
    max: 5,
    idle_timeout: 20,
    connect_timeout: 20,
  });
}

export function getDb(): Db {
  const g = globalThis as unknown as { __rssWatcherDb?: Db };
  if (g.__rssWatcherDb) return g.__rssWatcherDb;

  const client = createClient();
  const db = drizzle(client);
  g.__rssWatcherDb = db;
  return db;
}

