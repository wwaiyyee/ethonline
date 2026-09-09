import { runClaimsAgent } from "~~/services/claims/agent";

const policyId = process.env.EDGRAPH_POLICY_ID?.trim();
if (!policyId) {
  console.error("[edgraph-agent] Missing EDGRAPH_POLICY_ID");
  process.exit(1);
}

runClaimsAgent({ policyId })
  .then(result => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error("[edgraph-agent]", error instanceof Error ? error.message : error);
    process.exit(1);
  });
