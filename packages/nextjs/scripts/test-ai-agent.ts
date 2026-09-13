#!/usr/bin/env tsx

/**
 * Test AI Claims Agent with real LLM decision-making
 *
 * Usage:
 *   npx tsx scripts/test-ai-agent.ts [policyId]
 *
 * Example:
 *   npx tsx scripts/test-ai-agent.ts test-policy-usdc-1
 */
import dotenv from "dotenv";
import { runClaimsAgent } from "~~/services/claims/agent";
import { listActivePolicies } from "~~/services/policy/repository";

dotenv.config();

async function main() {
  const policyId = process.argv[2];

  if (!process.env.GEMINI_API_KEY) {
    console.error("\n❌ ERROR: GEMINI_API_KEY not set");
    console.error("Get your FREE API key from: https://aistudio.google.com/app/apikey");
    console.error("Add it to packages/nextjs/.env:\n");
    console.error("GEMINI_API_KEY=AIzaSy...\n");
    process.exit(1);
  }

  if (policyId) {
    console.log(`\n🤖 Running AI Claims Agent for policy: ${policyId}\n`);
    await testSinglePolicy(policyId);
  } else {
    console.log("\n🤖 Running AI Claims Agent on all active policies\n");
    await testAllPolicies();
  }
}

async function testSinglePolicy(policyId: string) {
  try {
    const result = await runClaimsAgent({ policyId });

    console.log("\n" + "=".repeat(70));
    console.log("AI AGENT RESULT");
    console.log("=".repeat(70));
    console.log(`Claim ID: ${result.claimId}`);
    console.log(`Action: ${result.action}`);
    console.log(`Rationale: ${result.rationale}`);

    if (result.policyDecision) {
      console.log(`\nPolicy Decision: ${result.policyDecision.outcome}`);
      console.log(`Reasons: ${result.policyDecision.reasons.join("; ")}`);
      if (result.policyDecision.recommendedPayoutAmountBaseUnits) {
        console.log(`Recommended Payout: ${result.policyDecision.recommendedPayoutAmountBaseUnits}`);
      }
    }

    console.log("=".repeat(70) + "\n");
  } catch (error) {
    console.error("\n❌ Error running AI agent:", error);
    process.exit(1);
  }
}

async function testAllPolicies() {
  const policies = listActivePolicies();
  console.log(`Found ${policies.length} active policies\n`);

  let processed = 0;
  let skipped = 0;
  let bought = 0;

  for (const policy of policies) {
    // Test all active policies
    console.log(`\n${"=".repeat(70)}`);
    console.log(`Testing Policy: ${policy.policyId}`);
    console.log(`Stablecoin: ${policy.stablecoinSymbol}`);
    console.log(`Threshold: ${policy.thresholdBps} bps`);
    console.log("=".repeat(70) + "\n");

    try {
      const result = await runClaimsAgent({ policyId: policy.policyId });
      processed++;

      if (result.action === "BUY_EVIDENCE") {
        bought++;
      } else {
        skipped++;
      }

      console.log(`\n✅ Result: ${result.action}`);
      console.log(`Rationale: ${result.rationale}\n`);
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : error}\n`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));
  console.log(`Processed: ${processed} policies`);
  console.log(`Evidence Bought: ${bought}`);
  console.log(`Evidence Skipped: ${skipped}`);
  console.log("=".repeat(70) + "\n");
}

main().catch(console.error);
