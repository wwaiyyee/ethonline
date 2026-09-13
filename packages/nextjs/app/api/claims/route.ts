import { NextResponse } from "next/server";
import { getDb } from "~~/services/db/client";
import type { Claim } from "~~/services/policy/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClaimRow = {
  claim_id: string;
  policy_id: string;
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

  return {
    claimId: row.claim_id,
    policyId: row.policy_id,
    status: row.status as Claim["status"],
    triggerWindowStart: row.trigger_window_start,
    triggerWindowEnd: row.trigger_window_end,
    createdAt: createdAtTimestamp,
    lowestPriceUsdMicros: row.lowest_price_usd_micros ?? undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    decision: row.decision_outcome
      ? {
          outcome: row.decision_outcome as "ELIGIBLE" | "INELIGIBLE" | "NEEDS_REVIEW",
          confidence: row.decision_confidence as "HIGH" | "MEDIUM" | "LOW",
          reasoning: row.decision_reasoning ?? undefined,
          reasons: row.decision_reasoning ? [row.decision_reasoning] : [],
          recommendedPayoutAmountBaseUnits: row.decision_recommended_payout ?? undefined,
          evaluatedAt: row.decision_evaluated_at!,
        }
      : undefined,
    lastAgentAction: row.last_agent_action ?? undefined,
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
        claim_id, policy_id, status,
        trigger_window_start, trigger_window_end,
        created_at, lowest_price_usd_micros, duration_minutes,
        decision_outcome, decision_confidence, decision_reasoning,
        decision_recommended_payout, decision_evaluated_at,
        last_agent_action, evidence_file_ids,
        approved_at, rejected_at, resolution_transaction_id,
        notes, updated_at
      FROM claims
    `;

    const params: any[] = [];

    if (policyId) {
      query += " WHERE policy_id = ?";
      params.push(policyId);
    }

    query += " ORDER BY created_at DESC";

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
