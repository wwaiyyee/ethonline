import { NextResponse } from "next/server";
import { queryPoolRiskSnapshot } from "~~/services/graph/agentTool";
import { upsertObservation } from "~~/services/observations/repository";
import { getPolicy } from "~~/services/policy/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reusable live Graph tool for the dashboard, worker, and hosted Bazantic adapter. */
export async function POST(req: Request) {
  let body: { policyId?: string; poolAddress?: string; lookbackSeconds?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  // Support both policyId (internal) and poolAddress (Bazantic)
  let policyId = body.policyId;

  if (!policyId && body.poolAddress) {
    // Bazantic sends poolAddress, map it to a policy
    // For now, use a default test policy or create one dynamically
    policyId = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  }

  if (!policyId) {
    return NextResponse.json({ error: "policyId or poolAddress is required." }, { status: 400 });
  }

  try {
    const snapshot = await queryPoolRiskSnapshot(policyId);
    const observation = upsertObservation(snapshot.observation);
    return NextResponse.json({ ...snapshot, observation });
  } catch (error) {
    console.error("[api/graph/snapshot] live query failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Live Graph query failed." },
      { status: 502 },
    );
  }
}
