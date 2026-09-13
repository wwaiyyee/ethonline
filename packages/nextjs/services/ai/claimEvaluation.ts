import Anthropic from "@anthropic-ai/sdk";
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
 * AI-powered claim evaluation
 * Provider selection: AI_PROVIDER env var (GEMINI or CLAUDE)
 * Default: GEMINI
 */
export async function evaluateClaimWithAI(policy: PolicyTerms, evidence: EvidenceReport): Promise<PolicyDecision> {
  const provider = process.env.AI_PROVIDER?.toUpperCase() || "GEMINI";
  console.log(`[AI] Using provider: ${provider}`);

  if (provider === "CLAUDE") {
    return await evaluateWithClaude(policy, evidence);
  } else {
    return await evaluateWithGemini(policy, evidence);
  }
}

/**
 * Claim evaluation using Claude API
 */
async function evaluateWithClaude(policy: PolicyTerms, evidence: EvidenceReport): Promise<PolicyDecision> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set in environment");
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = buildClaimEvaluationPrompt(policy, evidence);

  console.log(`[AI] Querying Claude for claim evaluation...`);
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

  let aiResult: AIEvaluationResult;
  try {
    aiResult = JSON.parse(text);
  } catch (error) {
    throw new Error(`Claude did not return valid JSON: ${text}`);
  }

  console.log(`[AI Claim Evaluation - Claude] Outcome: ${aiResult.outcome}`);
  console.log(`[AI Claim Evaluation - Claude] Confidence: ${aiResult.confidence}%`);
  console.log(`[AI Claim Evaluation - Claude] Reasoning: ${aiResult.reasoning}`);

  const policyDecision: PolicyDecision = {
    outcome: aiResult.outcome,
    reasons: aiResult.reasons,
    confidence: aiResult.confidence, // Store numeric confidence (0-100)
    reasoning: aiResult.reasoning,
    evaluatedAt: Math.floor(Date.now() / 1000),
  };

  if (aiResult.outcome === "ELIGIBLE_RECOMMENDATION") {
    policyDecision.recommendedPayoutAmountBaseUnits =
      aiResult.recommendedPayoutAmountBaseUnits || policy.payoutAmountBaseUnits;
  }

  return policyDecision;
}

/**
 * Claim evaluation using Gemini API
 */
async function evaluateWithGemini(policy: PolicyTerms, evidence: EvidenceReport): Promise<PolicyDecision> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set in environment");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
  });

  const prompt = buildClaimEvaluationPrompt(policy, evidence);

  console.log(`[AI] Querying Gemini 2.0 Flash for claim evaluation...`);
  const result = await model.generateContent(prompt);
  const response = result.response;
  let text = response.text();

  // Strip markdown code blocks if present
  text = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let aiResult: AIEvaluationResult;
  try {
    aiResult = JSON.parse(text);
  } catch (error) {
    throw new Error(`Gemini did not return valid JSON: ${text}`);
  }

  console.log(`[AI Claim Evaluation - Gemini] Outcome: ${aiResult.outcome}`);
  console.log(`[AI Claim Evaluation - Gemini] Confidence: ${aiResult.confidence}%`);
  console.log(`[AI Claim Evaluation - Gemini] Reasoning: ${aiResult.reasoning}`);
  console.log(`[AI Claim Evaluation - Gemini] Reasons: ${aiResult.reasons.join("; ")}`);
  if (aiResult.flagsForReview && aiResult.flagsForReview.length > 0) {
    console.log(`[AI Claim Evaluation - Gemini] Flags: ${aiResult.flagsForReview.join("; ")}`);
  }

  const policyDecision: PolicyDecision = {
    outcome: aiResult.outcome,
    reasons: aiResult.reasons,
    confidence: aiResult.confidence, // Store numeric confidence (0-100)
    reasoning: aiResult.reasoning,
    evaluatedAt: Math.floor(Date.now() / 1000),
  };

  if (aiResult.outcome === "ELIGIBLE_RECOMMENDATION") {
    policyDecision.recommendedPayoutAmountBaseUnits =
      aiResult.recommendedPayoutAmountBaseUnits || policy.payoutAmountBaseUnits;
  }

  return policyDecision;
}

/**
 * Build the claim evaluation prompt (shared by both providers)
 */
function buildClaimEvaluationPrompt(policy: PolicyTerms, evidence: EvidenceReport): string {
  const priceUsd = evidence.lowestObservedPriceUsdMicros / 1_000_000;
  const thresholdUsd = (policy.thresholdBps / 10_000) * 1.0;
  const durationMinutes = Math.floor(evidence.depegDurationSeconds / 60);

  return `You are an AI claims evaluator for a decentralized depeg insurance protocol on Hedera. Evaluate this claim against the policy terms.

POLICY TERMS:
- Stablecoin: ${policy.stablecoinSymbol}
- Depeg Threshold: $${thresholdUsd.toFixed(4)} (${policy.thresholdBps} bps below $1.00)
- Minimum Duration: ${policy.durationMinutes} minutes
- Coverage Period: ${new Date(policy.coverageStart * 1000).toISOString()} to ${new Date(policy.coverageEnd * 1000).toISOString()}
- Max Payout: ${policy.payoutAmountBaseUnits} ${policy.payoutTokenSymbol}

EVIDENCE REPORT:
- Lowest Price: $${priceUsd.toFixed(6)}
- Depeg Duration: ${durationMinutes} minutes (${evidence.depegDurationSeconds} seconds)
- Observations: ${evidence.observationCount}
- Time Range: ${new Date(evidence.firstObservationTimestamp * 1000).toISOString()} to ${new Date(evidence.lastObservationTimestamp * 1000).toISOString()}
- Source: ${evidence.sourceName}
- Content Hash: ${evidence.contentHash}

EVALUATION CRITERIA:
1. Does the lowest observed price ($${priceUsd.toFixed(6)}) meet or fall below the threshold ($${thresholdUsd.toFixed(4)})?
2. Did the depeg last for at least ${policy.durationMinutes} minutes? (Evidence shows ${durationMinutes} minutes)
3. Did this happen within the coverage period?
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
}
