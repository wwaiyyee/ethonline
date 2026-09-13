import { getDb } from "../services/db/client";

const db = getDb();

const result = db
  .prepare(
    `UPDATE claims
     SET status = 'INVESTIGATING_COMPLETE'
     WHERE status = 'INVESTIGATING'
     AND agent_action = 'SKIP_EVIDENCE'`,
  )
  .run();

console.log(`Updated ${result.changes} claims from INVESTIGATING to INVESTIGATING_COMPLETE`);

// Show summary
const summary = db
  .prepare(
    `SELECT status, COUNT(*) as count
     FROM claims
     GROUP BY status`,
  )
  .all();

console.log("\nClaims by status:");
console.table(summary);
