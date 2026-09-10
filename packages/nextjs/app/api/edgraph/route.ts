import { NextResponse } from "next/server";
import { getLatestObservation } from "~~/services/observations/repository";
import { listPolicies } from "~~/services/policy/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const policies = listPolicies().map(policy => ({ policy, latestObservation: getLatestObservation(policy.policyId) }));
  return NextResponse.json({ service: "edgraph-dashboard", dataMode: "live-graph-when-configured", policies });
}
