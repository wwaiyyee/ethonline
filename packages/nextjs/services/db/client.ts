import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type Migration = {
  version: number;
  name: string;
  fileName: string;
};

const migrations: Migration[] = [
  {
    version: 1,
    name: "initial",
    fileName: "001_initial.sql",
  },
  {
    version: 2,
    name: "evidence payment uniqueness",
    fileName: "002_evidence_payment_unique.sql",
  },
  {
    version: 3,
    name: "update claims schema",
    fileName: "003_update_claims_schema.sql",
  },
];

type DbGlobal = typeof globalThis & {
  __edgraphDatabase?: Database.Database;
  __edgraphDatabasePath?: string;
};

const globalDb = globalThis as DbGlobal;

function getDatabasePath(): string {
  const configuredPath = process.env.EDGRAPH_DB_PATH?.trim();
  if (configuredPath) {
    try {
      const resolved = path.resolve(configuredPath);
      const dir = path.dirname(resolved);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      return resolved;
    } catch (e) {
      console.warn(`[getDb] Could not use configured EDGRAPH_DB_PATH "${configuredPath}":`, e);
    }
  }

  // Fallback 1: local .data directory in process.cwd()
  try {
    const localDir = path.join(process.cwd(), ".data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return path.join(localDir, "edgraph.sqlite");
  } catch (e) {
    console.warn("[getDb] Could not use local .data dir:", e);
  }

  // Fallback 2: /tmp directory
  const tmpDir = path.join(os.tmpdir(), "edgraph-data");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  return path.join(tmpDir, "edgraph.sqlite");
}

function readMigration(migration: Migration): string {
  const candidates = [
    path.join(process.cwd(), "services", "db", "migrations", migration.fileName),
    path.join(process.cwd(), "packages", "nextjs", "services", "db", "migrations", migration.fileName),
  ];
  const migrationPath = candidates.find(candidate => fs.existsSync(candidate));
  if (!migrationPath) {
    throw new Error(`EdGraph database migration is missing: ${migration.fileName}`);
  }
  return fs.readFileSync(migrationPath, "utf8");
}

function applyMigrations(database: Database.Database): void {
  database.exec(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,
  );

  const applied = database.prepare("SELECT version FROM schema_migrations ORDER BY version").all() as Array<{
    version: number;
  }>;
  const appliedVersions = new Set(applied.map(row => row.version));
  const insertMigration = database.prepare("INSERT INTO schema_migrations (version, name) VALUES (?, ?)");

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) continue;

    const applyMigration = database.transaction(() => {
      database.exec(readMigration(migration));
      insertMigration.run(migration.version, migration.name);
    });
    applyMigration();
  }
}

/**
 * Return the singleton server-side SQLite connection and apply pending migrations.
 *
 * The connection is intentionally created only when a backend route/worker asks
 * for it. Client components must call the Next.js API instead of importing this
 * module, because SQLite credentials and files are server-side concerns.
 */
export function getDb(): Database.Database {
  const databasePath = getDatabasePath();
  if (globalDb.__edgraphDatabase?.open && globalDb.__edgraphDatabasePath === databasePath) {
    return globalDb.__edgraphDatabase;
  }

  const dir = path.dirname(databasePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const database = new Database(databasePath);
  try {
    database.pragma("journal_mode = WAL");
  } catch (e) {
    console.warn("[getDb] WAL mode could not be set, using default journal:", e);
  }
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  applyMigrations(database);

  globalDb.__edgraphDatabase = database;
  globalDb.__edgraphDatabasePath = databasePath;
  return database;
}

/** Close the shared connection, primarily for scripts and tests. */
export function closeDb(): void {
  if (globalDb.__edgraphDatabase?.open) {
    globalDb.__edgraphDatabase.close();
  }
  globalDb.__edgraphDatabase = undefined;
  globalDb.__edgraphDatabasePath = undefined;
}

export function getDbPath(): string {
  return getDatabasePath();
}
