import { getDb } from "../services/db/client";

const db = getDb();
const claims = db
  .prepare(
    `
  SELECT c.claim_id, c.policy_id, c.status, e.evidence_json
  FROM claims c
  LEFT JOIN evidence e ON c.claim_id = e.claim_id
  WHERE c.status = 'EVIDENCE_COLLECTED'
  LIMIT 1
`,
  )
  .get();

console.log(JSON.stringify(claims, null, 2));
