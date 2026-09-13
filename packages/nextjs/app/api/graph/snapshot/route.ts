import { NextResponse } from "next/server";
import { queryPoolRiskSnapshot } from "~~/services/graph/agentTool";
import { GraphConfigurationError } from "~~/services/graph/config";
import { upsertObservation } from "~~/services/observations/repository";

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

    // Only save observation if policyId was explicitly provided (not auto-generated from poolAddress)
    // This avoids FK constraint errors when the policy doesn't exist in the database
    let observation = snapshot.observation;
    if (body.policyId) {
      try {
        observation = upsertObservation(snapshot.observation);
      } catch (err) {
        console.warn(`[api/graph/snapshot] Could not persist observation for ${policyId}:`, err);
        // Continue with in-memory observation - don't crash the endpoint
      }
    }

    return NextResponse.json({ ...snapshot, observation });
  } catch (error) {
    console.error("[api/graph/snapshot] live query failed", error);

    // If Graph is not configured, return helpful error instead of crashing
    if (error instanceof GraphConfigurationError) {
      return NextResponse.json(
        {
          error:
            "The Graph configuration is missing. Use /api/graph/snapshot-mock for demo data, or set EDGRAPH_GRAPH_API_KEY and related env vars.",
          details: error.message,
          suggestion: "For Bazantic demo, use the mock endpoint: /api/graph/snapshot-mock",
        },
        { status: 503 }, // Service Unavailable (not 502 which crashes Railway)
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Live Graph query failed." },
      { status: 500 },
    );
  }
}
