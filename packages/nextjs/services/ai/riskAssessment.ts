import { GoogleGenerativeAI } from "@google/generative-ai";
import type { PoolRiskSnapshot } from "~~/services/graph/agentTool";
import type { PolicyTerms } from "~~/services/policy/types";

type RiskAssessmentDecision = {
  buyEvidence: boolean;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  rationale: string;
  keyFactors: string[];
};

/**
 * AI-powered risk assessment using Google Gemini
 * Replaces hardcoded thresholds with LLM reasoning
 */
export async function assessRiskWithAI(
  snapshot: PoolRiskSnapshot,
  policy: PolicyTerms,
  budgetRemaining: bigint,
): Promise<RiskAssessmentDecision> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set in environment");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const evidenceCost = 100_000n; // 0.001 HBAR in tinybars
  const priceUsd = snapshot.currentPriceUsdMicros / 1_000_000;
  const thresholdUsd = (policy.thresholdBps / 10_000) * 1.0;

  const prompt = `You are an AI risk analyst for a decentralized depeg insurance protocol on Hedera. Analyze this market snapshot and decide whether to purchase paid evidence (costs ${evidenceCost} tinybars = 0.001 HBAR).

POLICY TERMS:
- Stablecoin: ${policy.stablecoinSymbol}
- Depeg Threshold: $${thresholdUsd.toFixed(4)} (${policy.thresholdBps} bps below $1.00)
- Minimum Duration: ${policy.durationMinutes} minutes
- Coverage Period: ${new Date(policy.coverageStart * 1000).toISOString()} to ${new Date(policy.coverageEnd * 1000).toISOString()}
- Max Payout: ${policy.payoutAmountBaseUnits} ${policy.payoutTokenSymbol}

LIVE MARKET SNAPSHOT:
- Current Price: $${priceUsd.toFixed(6)}
- Price Movement: ${snapshot.recentPriceMovementBps} bps (negative = dropping)
- Liquidity: $${(snapshot.liquidityUsdMicros / 1_000_000).toFixed(2)}
- Liquidity Change: ${snapshot.liquidityChangeBps} bps (negative = draining)
- Swap Volume: $${(snapshot.swapVolumeUsdMicros / 1_000_000).toFixed(2)}
- Data Freshness: ${snapshot.observationTimestamps.length} observations

BUDGET CONTEXT:
- Evidence Cost: ${evidenceCost} tinybars
- Budget Remaining: ${budgetRemaining} tinybars
- Can Afford: ${budgetRemaining >= evidenceCost ? "YES" : "NO"}

DECISION FRAMEWORK:
Consider:
1. Is the current price close to or below the threshold?
2. Are price movements and liquidity changes suggesting a deepening depeg?
3. Is there enough volatility/risk to justify spending 0.001 HBAR on evidence?
4. Could this be noise vs. a real depeg event?
5. Is the budget being used efficiently?

Respond with JSON in this exact format:
{
  "buyEvidence": true or false,
  "riskLevel": "LOW" or "MEDIUM" or "HIGH" or "CRITICAL",
  "confidence": 0-100,
  "rationale": "detailed explanation of decision",
  "keyFactors": ["factor 1", "factor 2", "factor 3", "factor 4"]
}`;

  console.log(`[AI] Querying Gemini 2.5 Flash for risk assessment...`);
  const result = await model.generateContent(prompt);
  const response = result.response;
  let text = response.text();

  // Strip markdown code blocks if present
  text = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let decision: RiskAssessmentDecision;
  try {
    decision = JSON.parse(text);
  } catch (error) {
    throw new Error(`Gemini did not return valid JSON: ${text}`);
  }

  // Safety check: don't buy if budget insufficient
  if (decision.buyEvidence && budgetRemaining < evidenceCost) {
    decision.buyEvidence = false;
    decision.rationale += " [OVERRIDE: Insufficient budget]";
  }

  console.log(`[AI Risk Assessment] Risk Level: ${decision.riskLevel}`);
  console.log(`[AI Risk Assessment] Buy Evidence: ${decision.buyEvidence ? "YES" : "NO"}`);
  console.log(`[AI Risk Assessment] Confidence: ${decision.confidence}%`);
  console.log(`[AI Risk Assessment] Rationale: ${decision.rationale}`);
  console.log(`[AI Risk Assessment] Key Factors: ${decision.keyFactors.join(", ")}`);

  return decision;
}
