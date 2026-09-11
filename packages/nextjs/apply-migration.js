const { getDb, closeDb } = require("./services/db/client.ts");

console.log("Applying database migrations...");
try {
  const db = getDb();
  const migrations = db.prepare("SELECT version, name FROM schema_migrations ORDER BY version").all();
  console.log("Applied migrations:", migrations);
  closeDb();
  console.log("Migrations complete!");
} catch (error) {
  console.error("Migration error:", error);
  process.exit(1);
}
