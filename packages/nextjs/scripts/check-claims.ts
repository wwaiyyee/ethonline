import Database from "better-sqlite3";

const db = new Database(".data/edgraph.sqlite", { readonly: true });

const claims = db
  .prepare(
    `SELECT
      claim_id,
      status,
      decision_outcome,
      decision_confidence,
      decision_reasoning,
      decision_recommended_payout
    FROM claims
    ORDER BY created_at DESC
    LIMIT 5`,
  )
  .all();

console.log(JSON.stringify(claims, null, 2));

db.close();
