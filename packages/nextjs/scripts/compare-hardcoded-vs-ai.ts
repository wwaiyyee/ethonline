#!/usr/bin/env tsx

/**
 * Compare hardcoded rule-based decisions vs AI LLM decisions
 * Shows how the AI provides richer reasoning and better edge case handling
 */
import dotenv from "dotenv";
import { assessRiskWithAI } from "~~/services/ai/riskAssessment";
import { canSpendEvidence, getEvidencePriceTinybar } from "~~/services/claims/spendPolicy";
import { queryPoolRiskSnapshot, shouldBuyEvidence } from "~~/services/graph/agentTool";
import { getPolicy } from "~~/services/policy/repository";

dotenv.config();

async function main() {
  const policyId = process.argv[2] || "test-policy-usdc-1";

  if (!process.env.GEMINI_API_KEY) {
    console.error("\n❌ ERROR: GEMINI_API_KEY not set");
    console.error("Get FREE key: https://aistudio.google.com/app/apikey");
    console.error("Add to packages/nextjs/.env: GEMINI_API_KEY=AIzaSy...\n");
    process.exit(1);
  }

  console.log("\n" + "=".repeat(80));
  console.log("HARDCODED RULES vs AI DECISION COMPARISON");
  console.log("=".repeat(80));
  console.log(`Policy: ${policyId}\n`);

  const policy = getPolicy(policyId);
  if (!policy) {
    console.error(`❌ Policy ${policyId} not found`);
    process.exit(1);
  }

  // Get live market snapshot
  console.log("📊 Querying live market data...\n");
  const snapshot = await queryPoolRiskSnapshot(policyId);

  const priceUsd = snapshot.currentPriceUsdMicros / 1_000_000;
  const thresholdUsd = (policy.thresholdBps / 10_000) * 1.0;

  console.log("MARKET SNAPSHOT:");
  console.log("-".repeat(80));
  console.log(`Current Price: $${priceUsd.toFixed(6)}`);
  console.log(`Threshold: $${thresholdUsd.toFixed(6)}`);
  console.log(`Price Movement: ${snapshot.recentPriceMovementBps} bps`);
  console.log(`Liquidity: $${(snapshot.liquidityUsdMicros / 1_000_000).toFixed(2)}`);
  console.log(`Liquidity Change: ${snapshot.liquidityChangeBps} bps`);
  console.log(`Swap Volume: $${(snapshot.swapVolumeUsdMicros / 1_000_000).toFixed(2)}`);
  console.log(`Data Points: ${snapshot.observationTimestamps.length}`);
  console.log("");

  // Hardcoded decision
  console.log("🤖 HARDCODED RULES DECISION:");
  console.log("-".repeat(80));
  const hardcodedDecision = shouldBuyEvidence(snapshot, policy);
  console.log(`Decision: ${hardcodedDecision.buy ? "BUY EVIDENCE" : "SKIP EVIDENCE"}`);
  console.log(`Logic: Simple threshold check (price < $${thresholdUsd} OR movement < -25 bps OR liquidity < -100 bps)`);
  console.log(`Rationale: ${hardcodedDecision.rationale}`);
  console.log("");

  // AI decision
  console.log("🧠 AI LLM DECISION:");
  console.log("-".repeat(80));
  const spend = canSpendEvidence({ policy, requestedTinybar: getEvidencePriceTinybar() });
  console.log(`Querying Claude 3.5 Sonnet...`);
  const aiDecision = await assessRiskWithAI(snapshot, policy, spend.remainingTinybar);
  console.log(`Decision: ${aiDecision.buyEvidence ? "BUY EVIDENCE" : "SKIP EVIDENCE"}`);
  console.log(`Risk Level: ${aiDecision.riskLevel}`);
  console.log(`Confidence: ${aiDecision.confidence}%`);
  console.log(`Rationale: ${aiDecision.rationale}`);
  console.log(`Key Factors:`);
  aiDecision.keyFactors.forEach((factor, i) => {
    console.log(`  ${i + 1}. ${factor}`);
  });
  console.log("");

  // Comparison
  console.log("COMPARISON:");
  console.log("-".repeat(80));

  const agree = hardcodedDecision.buy === aiDecision.buyEvidence;

  if (agree) {
    console.log(`✅ AGREEMENT: Both systems recommend ${hardcodedDecision.buy ? "BUYING" : "SKIPPING"} evidence`);
  } else {
    console.log(`⚠️  DISAGREEMENT:`);
    console.log(`   Hardcoded: ${hardcodedDecision.buy ? "BUY" : "SKIP"}`);
    console.log(`   AI: ${aiDecision.buyEvidence ? "BUY" : "SKIP"}`);
    console.log(`   Why AI differs: ${aiDecision.rationale}`);
  }

  console.log("");
  console.log("KEY DIFFERENCES:");
  console.log("  • Hardcoded: Binary yes/no based on fixed thresholds");
  console.log("  • AI: Context-aware reasoning with confidence levels");
  console.log("  • Hardcoded: No explanation of decision factors");
  console.log("  • AI: Detailed rationale with enumerated key factors");
  console.log("  • Hardcoded: Same logic for all market conditions");
  console.log("  • AI: Adapts to unusual circumstances and edge cases");

  console.log("=".repeat(80) + "\n");
}

main().catch(console.error);
