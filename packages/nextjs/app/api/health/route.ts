import { NextResponse } from "next/server";
import { getDb } from "~~/services/db/client";
import { GraphConfigurationError, getGraphConfig } from "~~/services/graph/config";
import { FACILITATOR_URL, X402_NETWORK } from "~~/services/x402/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let graph: { configured: boolean; endpoint?: string; pool?: string; error?: string };
  try {
    const config = getGraphConfig();
    graph = { configured: true, endpoint: config.provenanceEndpoint, pool: config.poolAddress };
  } catch (error) {
    graph = {
      configured: false,
      error: error instanceof GraphConfigurationError ? error.message : "Graph configuration unavailable",
    };
  }

  try {
    getDb().prepare("SELECT 1").get();
  } catch {
    return NextResponse.json(
      { status: "degraded", graph, x402: { network: X402_NETWORK, facilitator: FACILITATOR_URL } },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      status: graph.configured ? "ok" : "degraded",
      service: "edgraph-evidence-api",
      graph,
      x402: { network: X402_NETWORK, facilitator: FACILITATOR_URL },
      timestamp: new Date().toISOString(),
    },
    { status: graph.configured ? 200 : 503 },
  );
}
