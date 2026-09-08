/**
 * Names of the operational tables used by EdGraph.
 *
 * Policy terms are committed to Hedera, while these tables keep the audit trail
 * needed by the worker, agent, API, and dashboard. Keeping table names in one
 * module prevents spelling drift between repositories.
 */
export const DB_TABLES = {
  schemaMigrations: "schema_migrations",
  policies: "policies",
  observations: "observations",
  claims: "claims",
  evidence: "evidence",
  payments: "payments",
  approvals: "approvals",
} as const;

export type DbTableName = (typeof DB_TABLES)[keyof typeof DB_TABLES];

/** SQLite stores booleans as 0/1 integers. */
export const SQLITE_TRUE = 1 as const;
export const SQLITE_FALSE = 0 as const;

export function toSqliteBoolean(value: boolean): 0 | 1 {
  return value ? SQLITE_TRUE : SQLITE_FALSE;
}

export function fromSqliteBoolean(value: number): boolean {
  return value === SQLITE_TRUE;
}
