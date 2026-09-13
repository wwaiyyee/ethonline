import { getDb } from "../services/db/client";

const db = getDb();

console.log("=== INVESTIGATING_COMPLETE Claims ===");
const incomplete = db
  .prepare(
    `SELECT claim_id, status, agent_action,
     SUBSTR(agent_rationale, 1, 100) as rationale_preview,
     policy_decision_json
     FROM claims
     WHERE status = 'INVESTIGATING_COMPLETE'
     LIMIT 3`,
  )
  .all();
console.log(JSON.stringify(incomplete, null, 2));

console.log("\n=== ELIGIBLE Claims ===");
const eligible = db
  .prepare(
    `SELECT claim_id, status, agent_action,
     SUBSTR(agent_rationale, 1, 100) as rationale_preview,
     policy_decision_json
     FROM claims
     WHERE status = 'ELIGIBLE'
     LIMIT 3`,
  )
  .all();
console.log(JSON.stringify(eligible, null, 2));

console.log("\n=== ALL Statuses ===");
const allStatuses = db
  .prepare(
    `SELECT status,
     COUNT(*) as count,
     SUM(CASE WHEN agent_action IS NOT NULL THEN 1 ELSE 0 END) as has_action,
     SUM(CASE WHEN agent_rationale IS NOT NULL THEN 1 ELSE 0 END) as has_rationale,
     SUM(CASE WHEN policy_decision_json IS NOT NULL THEN 1 ELSE 0 END) as has_decision
     FROM claims
     GROUP BY status`,
  )
  .all();
console.table(allStatuses);
