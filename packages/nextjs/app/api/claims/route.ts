import { NextResponse } from "next/server";
import { getDb } from "~~/services/db/client";
import type { Claim } from "~~/services/policy/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClaimRow = {
  claim_id: string;
  policy_id: string;
  policy_name: string;
  policy_stablecoin: string;
  policy_threshold: number;
  status: string;
  trigger_window_start: number;
  trigger_window_end: number;
  created_at: string;
  lowest_price_usd_micros: number | null;
  duration_minutes: number | null;
  decision_outcome: string | null;
  decision_confidence: string | null;
  decision_reasoning: string | null;
  decision_recommended_payout: string | null;
  decision_evaluated_at: number | null;
  last_agent_action: string | null;
  agent_rationale: string | null;
  policy_decision_json: string | null;
  evidence_file_ids: string | null;
  approved_at: number | null;
  rejected_at: number | null;
  resolution_transaction_id: string | null;
  notes: string | null;
  updated_at: string;
};

function rowToClaim(row: ClaimRow): Claim {
  // Convert created_at string to Unix timestamp
  const createdAtTimestamp = Math.floor(new Date(row.created_at).getTime() / 1000);

  // Parse policy_decision_json if available (NEW AI evaluation system)
  let policyDecision = null;
  if (row.policy_decision_json) {
    try {
      policyDecision = JSON.parse(row.policy_decision_json);
    } catch (e) {
      console.error("Failed to parse policy_decision_json:", e);
    }
  }

  return {
    claimId: row.claim_id,
    policyId: row.policy_id,
    policyName: row.policy_name || "Unknown Policy",
    status: row.status as Claim["status"],
    triggerWindowStart: row.trigger_window_start,
    triggerWindowEnd: row.trigger_window_end,
    createdAt: createdAtTimestamp,
    lowestPriceUsdMicros: row.lowest_price_usd_micros ?? undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    decision: policyDecision
      ? // NEW AI evaluation (from policy_decision_json)
        policyDecision
      : row.decision_outcome
        ? // OLD rule-based evaluation (from decision_outcome/reasoning)
          {
            outcome: row.decision_outcome as "ELIGIBLE" | "INELIGIBLE" | "NEEDS_REVIEW",
            confidence: row.decision_confidence as "HIGH" | "MEDIUM" | "LOW",
            reasoning: row.decision_reasoning ?? undefined,
            reasons: row.decision_reasoning ? [row.decision_reasoning] : [],
            recommendedPayoutAmountBaseUnits: row.decision_recommended_payout ?? undefined,
            evaluatedAt: row.decision_evaluated_at!,
          }
        : undefined,
    lastAgentAction: row.last_agent_action ?? undefined,
    agentRationale: row.agent_rationale ?? undefined,
    evidenceFileIds: row.evidence_file_ids ? JSON.parse(row.evidence_file_ids) : undefined,
    approvedAt: row.approved_at ?? undefined,
    rejectedAt: row.rejected_at ?? undefined,
    resolutionTransactionId: row.resolution_transaction_id ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const policyId = searchParams.get("policyId");

    const db = getDb();

    let query = `
      SELECT
        c.claim_id, c.policy_id, c.status,
        c.trigger_window_start, c.trigger_window_end,
        c.created_at,
        p.policyholder as policy_name,
        p.stablecoin_symbol as policy_stablecoin,
        p.threshold_bps as policy_threshold,
        COALESCE(e.lowest_observed_price_usd_micros, c.lowest_price_usd_micros) as lowest_price_usd_micros,
        COALESCE(e.below_threshold_duration_minutes, c.duration_minutes) as duration_minutes,
        c.decision_outcome, c.decision_confidence, c.decision_reasoning,
        c.decision_recommended_payout, c.decision_evaluated_at,
        c.last_agent_action, c.agent_rationale, c.policy_decision_json,
        CASE WHEN e.evidence_id IS NOT NULL THEN json_array(e.evidence_id) ELSE c.evidence_file_ids END as evidence_file_ids,
        c.approved_at, c.rejected_at, c.resolution_transaction_id,
        c.notes, c.updated_at
      FROM claims c
      LEFT JOIN evidence e ON c.claim_id = e.claim_id
      LEFT JOIN policies p ON c.policy_id = p.policy_id
    `;

    const params: any[] = [];

    if (policyId) {
      query += " WHERE c.policy_id = ?";
      params.push(policyId);
    }

    query += " ORDER BY c.created_at DESC";

    const rows = db.prepare(query).all(...params) as ClaimRow[];
    const claims = rows.map(rowToClaim);

    return NextResponse.json({
      claims,
      total: claims.length,
    });
  } catch (error) {
    console.error("Claims API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
