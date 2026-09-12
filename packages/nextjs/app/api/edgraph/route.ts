import { NextResponse } from "next/server";
import { getDb } from "~~/services/db/client";
import { PolicyRegistryNotDeployedError, listPoliciesFromHedera } from "~~/services/policy/chainReader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Fetch all active policies from Hedera
    const { policies } = await listPoliciesFromHedera(0, 50);

    // Get the database connection
    const db = getDb();

    // For each policy, fetch its latest observation
    const policiesWithObservations = policies.map(policy => {
      const latestObs = db
        .prepare(
          `SELECT
            price_usd_micros as priceUsdMicros,
            liquidity_usd_micros as liquidityUsdMicros,
            source_name as sourceName,
            source_block as sourceBlock
          FROM observations
          WHERE policy_id = ?
          ORDER BY observed_at DESC
          LIMIT 1`,
        )
        .get(policy.policyId) as
        | {
            priceUsdMicros: number;
            liquidityUsdMicros: number;
            sourceName: string;
            sourceBlock: number | null;
          }
        | undefined;

      return {
        policy: {
          policyId: policy.policyId,
          policyholder: policy.policyholder,
          stablecoinSymbol: policy.stablecoinSymbol,
          thresholdBps: policy.thresholdBps,
          minimumDurationMinutes: policy.minimumDurationMinutes,
          active: policy.active,
        },
        latestObservation: latestObs || null,
      };
    });

    return NextResponse.json({
      dataMode: "live",
      policies: policiesWithObservations,
    });
  } catch (error) {
    if (error instanceof PolicyRegistryNotDeployedError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[api/edgraph] Failed to fetch dashboard data", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
