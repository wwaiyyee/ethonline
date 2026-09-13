import Anthropic from "@anthropic-ai/sdk";
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
 * AI-powered risk assessment
 * Provider selection: AI_PROVIDER env var (GEMINI or CLAUDE)
 * Default: GEMINI
 */
export async function assessRiskWithAI(
  snapshot: PoolRiskSnapshot,
  policy: PolicyTerms,
  budgetRemaining: bigint,
): Promise<RiskAssessmentDecision> {
  const evidenceCost = 100_000n; // 0.001 HBAR in tinybars
  const priceUsd = snapshot.currentPriceUsdMicros / 1_000_000;
  const thresholdUsd = (policy.thresholdBps / 10_000) * 1.0;

  const provider = process.env.AI_PROVIDER?.toUpperCase() || "GEMINI";
  console.log(`[AI] Using provider: ${provider}`);

  if (provider === "CLAUDE") {
    return await assessWithClaude(snapshot, policy, budgetRemaining, priceUsd, thresholdUsd, evidenceCost);
  } else {
    return await assessWithGemini(snapshot, policy, budgetRemaining, priceUsd, thresholdUsd, evidenceCost);
  }
}

/**
 * Risk assessment using Claude API
 */
async function assessWithClaude(
  snapshot: PoolRiskSnapshot,
  policy: PolicyTerms,
  budgetRemaining: bigint,
  priceUsd: number,
  thresholdUsd: number,
  evidenceCost: bigint,
): Promise<RiskAssessmentDecision> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set in environment");
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = buildRiskAssessmentPrompt(snapshot, policy, budgetRemaining, priceUsd, thresholdUsd, evidenceCost);

  console.log(`[AI] Querying Claude for risk assessment...`);
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const textContent = message.content.find(block => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Claude did not return text content");
  }

  let text = textContent.text.trim();

  // Strip markdown code blocks if present
  text = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let decision: RiskAssessmentDecision;
  try {
    decision = JSON.parse(text);
  } catch (error) {
    throw new Error(`Claude did not return valid JSON: ${text}`);
  }

  // Safety check: don't buy if budget insufficient
  if (decision.buyEvidence && budgetRemaining < evidenceCost) {
    decision.buyEvidence = false;
    decision.rationale += " [OVERRIDE: Insufficient budget]";
  }

  console.log(`[AI Risk Assessment - Claude] Risk Level: ${decision.riskLevel}`);
  console.log(`[AI Risk Assessment - Claude] Buy Evidence: ${decision.buyEvidence ? "YES" : "NO"}`);
  console.log(`[AI Risk Assessment - Claude] Confidence: ${decision.confidence}%`);
  console.log(`[AI Risk Assessment - Claude] Rationale: ${decision.rationale}`);

  return decision;
}

/**
 * Risk assessment using Gemini API
 */
async function assessWithGemini(
  snapshot: PoolRiskSnapshot,
  policy: PolicyTerms,
  budgetRemaining: bigint,
  priceUsd: number,
  thresholdUsd: number,
  evidenceCost: bigint,
): Promise<RiskAssessmentDecision> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set in environment");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
  });

  const prompt = buildRiskAssessmentPrompt(snapshot, policy, budgetRemaining, priceUsd, thresholdUsd, evidenceCost);

  console.log(`[AI] Querying Gemini 3.6 Flash for risk assessment...`);
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

  console.log(`[AI Risk Assessment - Gemini] Risk Level: ${decision.riskLevel}`);
  console.log(`[AI Risk Assessment - Gemini] Buy Evidence: ${decision.buyEvidence ? "YES" : "NO"}`);
  console.log(`[AI Risk Assessment - Gemini] Confidence: ${decision.confidence}%`);
  console.log(`[AI Risk Assessment - Gemini] Rationale: ${decision.rationale}`);

  return decision;
}

/**
 * Build the risk assessment prompt (shared by both providers)
 */
function buildRiskAssessmentPrompt(
  snapshot: PoolRiskSnapshot,
  policy: PolicyTerms,
  budgetRemaining: bigint,
  priceUsd: number,
  thresholdUsd: number,
  evidenceCost: bigint,
): string {
  return `You are an AI risk analyst for a decentralized depeg insurance protocol on Hedera. Analyze this market snapshot and decide whether to purchase paid evidence (costs ${evidenceCost} tinybars = 0.001 HBAR).

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
**IMPORTANT: This is an insurance protocol - err on the side of buying evidence when in doubt.**

Consider:
1. Is the current price close to or below the threshold? If YES -> buy evidence immediately
2. Are price movements and liquidity changes suggesting a deepening depeg? If trending negative -> buy evidence
3. Is there enough volatility/risk to justify spending 0.001 HBAR on evidence? (Cost is minimal - only 0.001 HBAR)
4. Could this be noise vs. a real depeg event? **When uncertain, buy evidence to verify**
5. Is the budget being used efficiently? (Evidence cost is negligible compared to potential payout)

**BIAS TOWARD BUYING**: The evidence cost (0.001 HBAR) is extremely low compared to the potential payout. Any price movement toward the threshold warrants investigation. Missing a real depeg event is far more costly than buying unnecessary evidence.

Respond with JSON in this exact format:
{
  "buyEvidence": true or false,
  "riskLevel": "LOW" or "MEDIUM" or "HIGH" or "CRITICAL",
  "confidence": 0-100,
  "rationale": "detailed explanation of decision",
  "keyFactors": ["factor 1", "factor 2", "factor 3", "factor 4"]
}`;
}
