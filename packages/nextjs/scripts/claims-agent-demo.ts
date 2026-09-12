/**
 * AI Claims Agent - Full Workflow Demo
 *
 * Demonstrates the complete autonomous claims processing pipeline:
 * 1. Snapshot: Query live Graph data
 * 2. Decide: Evaluate risk and determine if evidence purchase is justified
 * 3. Pay: Simulate HBAR payment via x402 protocol
 * 4. Evidence: Retrieve cryptographically verified depeg evidence
 * 5. Evaluate: Run policy engine to produce eligibility recommendation
 */
import { getDb } from "../services/db/client";
import type { PolicyTerms } from "../services/policy/types";
import fs from "fs";
import path from "path";

// Agent configuration
const AGENT_CONFIG = {
  budgetTinybar: BigInt(process.env.EDGRAPH_AGENT_HBAR_BUDGET_TINYBAR || "1000000"),
  evidencePriceTinybar: BigInt(100000), // 0.001 HBAR per evidence report
  riskThresholds: {
    minPriceDeviationBps: 50, // 0.5% minimum price movement
    minLiquidityChangeBps: 1000, // 10% liquidity drop triggers concern
    maxDataStalenessSec: 300, // 5 minutes max data age
  },
};

interface Snapshot {
  mode: "live" | "historical";
  priceUsd: number;
  priceDeviationBps: number;
  liquidityChangeBps: number;
  dataFreshnessSec: number;
  timestamp: number;
}

interface Decision {
  shouldBuyEvidence: boolean;
  rationale: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

interface Evidence {
  claimId: string;
  depegVerified: boolean;
  lowestPriceUsd: number;
  durationMinutes: number;
  observationCount: number;
  verdict: "PASS" | "FAIL";
}

interface Evaluation {
  decision: "ELIGIBLE_RECOMMENDATION" | "INELIGIBLE" | "NEEDS_HUMAN_REVIEW";
  rationale: string;
  recommendedPayoutAmount?: string;
}

async function main() {
  console.log("=".repeat(70));
  console.log("AI CLAIMS AGENT - AUTONOMOUS WORKFLOW DEMO");
  console.log("=".repeat(70));
  console.log();

  // Get claim from database
  const claimId = process.env.CLAIM_ID || "claim-test-policy-usdc-1-1788976831";
  const claim = getClaimById(claimId);

  if (!claim) {
    console.error(`[ERROR] Claim ${claimId} not found`);
    process.exit(1);
  }

  console.log(`[Agent] Processing claim: ${claimId}`);
  console.log(`[Agent] Policy: ${claim.policy_id}`);
  console.log();

  // PHASE 1: SNAPSHOT
  console.log("PHASE 1: SNAPSHOT - Query live market data");
  console.log("-".repeat(70));
  const snapshot = await takeSnapshot(claim);
  console.log(`[Snapshot] Price: $${snapshot.priceUsd}`);
  console.log(`[Snapshot] Price deviation: ${snapshot.priceDeviationBps} bps`);
  console.log(`[Snapshot] Liquidity change: ${snapshot.liquidityChangeBps} bps`);
  console.log(`[Snapshot] Data freshness: ${snapshot.dataFreshnessSec}s`);
  console.log();

  // PHASE 2: DECIDE
  console.log("PHASE 2: DECIDE - Risk assessment & spending decision");
  console.log("-".repeat(70));
  const decision = makeSpendingDecision(snapshot);
  console.log(`[Decision] Risk level: ${decision.riskLevel}`);
  console.log(`[Decision] Buy evidence: ${decision.shouldBuyEvidence ? "YES" : "NO"}`);
  console.log(`[Decision] Rationale: ${decision.rationale}`);
  console.log();

  if (!decision.shouldBuyEvidence) {
    console.log("[Agent] Workflow complete - no evidence purchase needed");
    return;
  }

  // PHASE 3: PAY
  console.log("PHASE 3: PAY - Simulate x402 HBAR payment");
  console.log("-".repeat(70));
  const paymentTx = await simulatePayment(claimId);
  console.log(`[Payment] Amount: ${AGENT_CONFIG.evidencePriceTinybar} tinybars`);
  console.log(`[Payment] Transaction: ${paymentTx}`);
  console.log(`[Payment] Status: SETTLED`);
  console.log();

  // PHASE 4: EVIDENCE
  console.log("PHASE 4: EVIDENCE - Retrieve verified depeg report");
  console.log("-".repeat(70));
  const evidence = await retrieveEvidence(claimId);
  console.log(`[Evidence] Depeg verified: ${evidence.depegVerified ? "YES" : "NO"}`);
  console.log(`[Evidence] Lowest price: $${evidence.lowestPriceUsd}`);
  console.log(`[Evidence] Duration: ${evidence.durationMinutes} minutes`);
  console.log(`[Evidence] Observations: ${evidence.observationCount}`);
  console.log(`[Evidence] Verdict: ${evidence.verdict}`);
  console.log();

  // PHASE 5: EVALUATE
  console.log("PHASE 5: EVALUATE - Policy engine recommendation");
  console.log("-".repeat(70));
  const evaluation = evaluateClaim(evidence, claim);
  console.log(`[Evaluation] Decision: ${evaluation.decision}`);
  console.log(`[Evaluation] Rationale: ${evaluation.rationale}`);
  if (evaluation.recommendedPayoutAmount) {
    console.log(`[Evaluation] Recommended payout: ${evaluation.recommendedPayoutAmount}`);
  }
  console.log();

  // Save workflow result
  saveWorkflowResult(claimId, { snapshot, decision, paymentTx, evidence, evaluation });

  console.log("=".repeat(70));
  console.log("WORKFLOW COMPLETE");
  console.log("=".repeat(70));
}

function getClaimById(claimId: string) {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT c.*, p.*
    FROM claims c
    JOIN policies p ON c.policy_id = p.policy_id
    WHERE c.claim_id = ?
  `,
    )
    .get(claimId) as any;
}

async function takeSnapshot(claim: any): Promise<Snapshot> {
  // Simulate live snapshot (in production, this would query The Graph)
  const now = Math.floor(Date.now() / 1000);
  const priceUsd = 0.985; // Simulated current price
  const targetPrice = 1.0;
  const priceDeviationBps = Math.abs(((priceUsd - targetPrice) / targetPrice) * 10000);

  return {
    mode: "live",
    priceUsd,
    priceDeviationBps: Math.floor(priceDeviationBps),
    liquidityChangeBps: -800, // 8% drop
    dataFreshnessSec: 45,
    timestamp: now,
  };
}

function makeSpendingDecision(snapshot: Snapshot): Decision {
  const { riskThresholds } = AGENT_CONFIG;

  // Check data quality
  if (snapshot.dataFreshnessSec > riskThresholds.maxDataStalenessSec) {
    return {
      shouldBuyEvidence: false,
      rationale: "Data too stale for reliable decision",
      riskLevel: "LOW",
    };
  }

  // Check budget
  if (AGENT_CONFIG.budgetTinybar < AGENT_CONFIG.evidencePriceTinybar) {
    return {
      shouldBuyEvidence: false,
      rationale: "Insufficient budget remaining",
      riskLevel: "LOW",
    };
  }

  // Assess risk level
  const hasPriceRisk = snapshot.priceDeviationBps >= riskThresholds.minPriceDeviationBps;
  const hasLiquidityRisk = Math.abs(snapshot.liquidityChangeBps) >= riskThresholds.minLiquidityChangeBps;

  if (hasPriceRisk && hasLiquidityRisk) {
    return {
      shouldBuyEvidence: true,
      rationale: "High risk: significant price deviation + liquidity drop detected",
      riskLevel: "HIGH",
    };
  }

  if (hasPriceRisk) {
    return {
      shouldBuyEvidence: true,
      rationale: "Medium risk: price deviation warrants investigation",
      riskLevel: "MEDIUM",
    };
  }

  return {
    shouldBuyEvidence: false,
    rationale: "Low risk: price and liquidity within normal ranges",
    riskLevel: "LOW",
  };
}

async function simulatePayment(claimId: string): Promise<string> {
  // Simulate x402 payment flow
  // In production: sign transfer with HashPack, send to facilitator, get tx ID
  return `0.0.4895376@${Date.now() / 1000}.123456789`;
}

async function retrieveEvidence(claimId: string): Promise<Evidence> {
  // Read evidence from file (generated in Phase 4 of project)
  const evidencePath = path.join(process.cwd(), ".data", `evidence-${claimId}.json`);

  if (!fs.existsSync(evidencePath)) {
    throw new Error(`Evidence file not found: ${evidencePath}`);
  }

  const evidenceData = JSON.parse(fs.readFileSync(evidencePath, "utf-8"));

  // Evidence format: { verdict: { meetsThreshold, meetsDuration, isValid }, statistics: { minPrice }, ... }
  const depegVerified =
    evidenceData.verdict.isValid && evidenceData.verdict.meetsThreshold && evidenceData.verdict.meetsDuration;

  return {
    claimId: evidenceData.claimId,
    depegVerified,
    lowestPriceUsd: evidenceData.statistics.minPrice,
    durationMinutes: evidenceData.triggerWindow.durationMinutes,
    observationCount: evidenceData.observations.length,
    verdict: depegVerified ? "PASS" : "FAIL",
  };
}

function evaluateClaim(evidence: Evidence, claim: any): Evaluation {
  // Simple policy engine logic
  if (!evidence.depegVerified) {
    return {
      decision: "INELIGIBLE",
      rationale: "Depeg not verified in evidence report",
    };
  }

  if (evidence.durationMinutes < claim.minimum_duration_minutes) {
    return {
      decision: "INELIGIBLE",
      rationale: `Duration ${evidence.durationMinutes}min below policy minimum ${claim.minimum_duration_minutes}min`,
    };
  }

  // Check if liquidity drop warrants human review
  // (In production, this would use the full policy engine from services/policy/engine.ts)

  return {
    decision: "ELIGIBLE_RECOMMENDATION",
    rationale: `Depeg verified: ${evidence.durationMinutes}min at $${evidence.lowestPriceUsd}, meets policy terms`,
    recommendedPayoutAmount: claim.payout_amount_base_units,
  };
}

function saveWorkflowResult(claimId: string, result: any) {
  const outputPath = path.join(process.cwd(), ".data", `agent-workflow-${claimId}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`[Agent] Workflow result saved: ${outputPath}`);
}

main().catch(console.error);
