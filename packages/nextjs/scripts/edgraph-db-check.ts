import { closeDb, getDb, getDbPath } from "~~/services/db/client";
import { DB_TABLES } from "~~/services/db/schema";

const database = getDb();
const tables = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as Array<{
  name: string;
}>;
const tableNames = new Set(tables.map(table => table.name));
const expectedTables = Object.values(DB_TABLES);
const missingTables = expectedTables.filter(table => !tableNames.has(table));

if (missingTables.length > 0) {
  closeDb();
  throw new Error(`EdGraph SQLite schema is incomplete. Missing: ${missingTables.join(", ")}`);
}

const journalMode = database.pragma("journal_mode", { simple: true });
const foreignKeys = database.pragma("foreign_keys", { simple: true });

console.log(`EdGraph SQLite ready: ${getDbPath()}`);
console.log(`Tables: ${tables.map(table => table.name).join(", ")}`);
console.log(`WAL mode: ${String(journalMode).toLowerCase() === "wal" ? "enabled" : String(journalMode)}`);
console.log(`Foreign keys: ${foreignKeys === 1 ? "enabled" : "disabled"}`);

closeDb();
