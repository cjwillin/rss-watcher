import { migrateDb } from "@/db/migrate";

async function main() {
  await migrateDb();
  console.log("db_migrate_ok");
}

main().catch((err) => {
  // Avoid printing any env vars.
  console.error("db_migrate_failed");
  console.error(String(err?.message ?? err));
  process.exit(1);
});
