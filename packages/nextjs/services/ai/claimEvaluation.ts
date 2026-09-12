import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EvidenceReport, PolicyDecision, PolicyTerms } from "~~/services/policy/types";

type AIEvaluationResult = {
  outcome: "ELIGIBLE_RECOMMENDATION" | "INELIGIBLE" | "NEEDS_HUMAN_REVIEW";
  confidence: number;
  reasoning: string;
  reasons: string[];
  recommendedPayoutAmountBaseUnits?: string;
  flagsForReview?: string[];
};

/**
 * AI-powered claim evaluation using Google Gemini
 * Replaces hardcoded if/else logic with LLM reasoning
 */
export async function evaluateClaimWithAI(policy: PolicyTerms, evidence: EvidenceReport): Promise<PolicyDecision> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set in environment");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const priceUsd = evidence.lowestObservedPriceUsdMicros / 1_000_000;
  const thresholdUsd = (policy.thresholdBps / 10_000) * 1.0;

  const prompt = `You are an AI claims adjudicator for a decentralized depeg insurance protocol. Evaluate whether this claim is eligible for payout based on the policy terms and cryptographic evidence.

POLICY TERMS:
- Stablecoin: ${policy.stablecoinSymbol}
- Depeg Threshold: $${thresholdUsd.toFixed(4)} (must drop below this)
- Minimum Duration: ${policy.durationMinutes} minutes (must stay below threshold this long)
- Coverage Period: ${new Date(policy.coverageStart * 1000).toISOString()} to ${new Date(policy.coverageEnd * 1000).toISOString()}
- Max Payout: ${policy.payoutAmountBaseUnits} ${policy.payoutTokenSymbol}

EVIDENCE REPORT:
- Depeg Verified: ${evidence.depegVerified ? "YES" : "NO"}
- Lowest Price Observed: $${priceUsd.toFixed(6)}
- Duration Below Threshold: ${evidence.belowThresholdDurationMinutes} minutes
- Total Observations: ${evidence.observationCount}
- Liquidity Change: ${evidence.liquidityChangeBps} bps
- Trigger Window: ${new Date(evidence.triggerWindowStart * 1000).toISOString()} to ${new Date(evidence.triggerWindowEnd * 1000).toISOString()}

DATA PROVENANCE:
- Source: ${evidence.provenance.sourceName}
- Endpoint: ${evidence.provenance.endpoint}
- Latest Block: ${evidence.provenance.latestBlock}
- Query Time: ${new Date(evidence.provenance.queryTimestamp * 1000).toISOString()}

EVALUATION CRITERIA:
1. ELIGIBLE_RECOMMENDATION: All policy conditions met, recommend payout
2. INELIGIBLE: Conditions not met, deny claim
3. NEEDS_HUMAN_REVIEW: Edge case or unusual circumstances requiring manual review

Consider:
- Does the evidence prove a depeg occurred?
- Was the price below the threshold for the minimum duration?
- Did this happen within the coverage period?
- Is the data provenance complete and trustworthy?
- Are there any red flags (extreme liquidity crash, data gaps, etc.)?

Respond with JSON in this exact format:
{
  "outcome": "ELIGIBLE_RECOMMENDATION" or "INELIGIBLE" or "NEEDS_HUMAN_REVIEW",
  "confidence": 0-100,
  "reasoning": "detailed explanation of the evaluation logic",
  "reasons": ["reason 1", "reason 2", "reason 3"],
  "recommendedPayoutAmountBaseUnits": "${policy.payoutAmountBaseUnits}",
  "flagsForReview": ["flag 1", "flag 2"]
}`;

  console.log(`[AI] Querying Gemini 1.5 Flash for claim evaluation...`);
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  let aiResult: AIEvaluationResult;
  try {
    aiResult = JSON.parse(text);
  } catch (error) {
    throw new Error(`Gemini did not return valid JSON: ${text}`);
  }

  console.log(`[AI Claim Evaluation] Outcome: ${aiResult.outcome}`);
  console.log(`[AI Claim Evaluation] Confidence: ${aiResult.confidence}%`);
  console.log(`[AI Claim Evaluation] Reasoning: ${aiResult.reasoning}`);
  console.log(`[AI Claim Evaluation] Reasons: ${aiResult.reasons.join("; ")}`);
  if (aiResult.flagsForReview && aiResult.flagsForReview.length > 0) {
    console.log(`[AI Claim Evaluation] Flags: ${aiResult.flagsForReview.join("; ")}`);
  }

  const policyDecision: PolicyDecision = {
    outcome: aiResult.outcome,
    reasons: aiResult.reasons,
    evaluatedAt: Math.floor(Date.now() / 1000),
  };

  if (aiResult.outcome === "ELIGIBLE_RECOMMENDATION") {
    policyDecision.recommendedPayoutAmountBaseUnits =
      aiResult.recommendedPayoutAmountBaseUnits || policy.payoutAmountBaseUnits;
  }

  return policyDecision;
}
