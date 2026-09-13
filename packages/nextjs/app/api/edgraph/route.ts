import { NextResponse } from "next/server";
import { PolicyRegistryNotDeployedError, listPoliciesFromHedera } from "~~/services/policy/chainReader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Fetch all active policies from Hedera (source of truth)
    const { policies } = await listPoliciesFromHedera(0, 50);

    // Best-effort: fetch latest observations from SQLite
    const policiesWithObservations = await Promise.all(
      policies.map(async policy => {
        let latestObservation = null;
        try {
          const { getDb } = await import("~~/services/db/client");
          const db = getDb();
          latestObservation =
            (db
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
              | undefined) || null;
        } catch {
          // SQLite unavailable — return policy without observation
        }

        return {
          policy: {
            policyId: policy.policyId,
            policyholder: policy.policyholder,
            stablecoinSymbol: policy.stablecoinSymbol,
            thresholdBps: policy.thresholdBps,
            minimumDurationMinutes: policy.minimumDurationMinutes,
            active: policy.active,
          },
          latestObservation,
        };
      }),
    );

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
