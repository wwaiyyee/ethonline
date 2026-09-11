import { NextResponse } from "next/server";
import { queryPoolRiskSnapshot } from "~~/services/graph/agentTool";
import { upsertObservation } from "~~/services/observations/repository";
import { getPolicy } from "~~/services/policy/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reusable live Graph tool for the dashboard, worker, and hosted Bazantic adapter. */
export async function POST(req: Request) {
  let body: { policyId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body.policyId) return NextResponse.json({ error: "policyId is required." }, { status: 400 });
  if (!getPolicy(body.policyId)) return NextResponse.json({ error: "Policy not found." }, { status: 404 });

  try {
    const snapshot = await queryPoolRiskSnapshot(body.policyId);
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
