import { getDb } from "../services/db/client";

const db = getDb();
const policies = db.prepare("SELECT policy_id, policyholder, active, coverage_start, coverage_end FROM policies").all();

console.log("Policies in database:");
console.log(JSON.stringify(policies, null, 2));

const claims = db.prepare("SELECT claim_id, policy_id, status FROM claims").all();
console.log("\nClaims in database:");
console.log(JSON.stringify(claims, null, 2));
