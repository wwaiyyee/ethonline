import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import type { EvidenceReport } from "~~/services/policy/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * FREE depeg evidence endpoint for Bazantic demo (no x402 payment required).
 * Returns realistic mock evidence data for stablecoin depeg insurance claims.
 */

function generateMockEvidence(claimId: string, policyId: string): EvidenceReport {
  const now = Math.floor(Date.now() / 1000);
  const queryHash = createHash("sha256").update(`${claimId}-${policyId}-${now}`).digest("hex");

  return {
    depegVerified: true,
    lowestObservedPriceUsdMicros: 992000, // $0.992 (0.8% depeg)
    belowThresholdDurationMinutes: 45,
    liquidityChangeBps: -25, // -0.25% liquidity drop
    evidence: [
      `Evidence report generated for claim ${claimId} on policy ${policyId}`,
      "Depeg event verified: price dropped to $0.992 USD (0.8% below peg)",
      "Duration below threshold: 45 minutes",
      "Liquidity decreased by 0.25% during observation window",
      "Swap volume spiked to $78M (158% increase vs baseline)",
      "Graph observations and provenance attached for deterministic policy evaluation",
    ],
    provenance: {
      endpoint: "https://gateway.thegraph.com/api/mock-evidence",
      subgraphId: "mock-evidence-for-demo",
      queryHash,
      fromTimestamp: now - 3600,
      toTimestamp: now,
    },
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  const claimId = typeof body?.claimId === "string" && body.claimId.trim() ? body.claimId.trim() : null;
  const policyId = typeof body?.policyId === "string" && body.policyId.trim() ? body.policyId.trim() : null;

  if (!claimId) {
    return NextResponse.json({ error: "claimId is required" }, { status: 400 });
  }

  if (!policyId) {
    return NextResponse.json({ error: "policyId is required" }, { status: 400 });
  }

  const report = generateMockEvidence(claimId, policyId);

  return NextResponse.json(
    {
      service: "EdGraph Evidence API (FREE DEMO)",
      claimId,
      policyId,
      evidence: report,
      policyDecision: {
        claim_approved: true,
        confidence_score: 94,
        reasoning:
          "Depeg verified at $0.992 (0.8% below peg) for 45 minutes. Liquidity stable. Qualifies under policy terms.",
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
