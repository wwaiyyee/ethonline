import { NextResponse } from "next/server";
import { PolicyRegistryNotDeployedError, listPoliciesFromHedera } from "~~/services/policy/chainReader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePageParam(value: string | null, fallback: number, max: number): number | null {
  if (value === null || value === "") return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= max ? parsed : null;
}

/**
 * GET /api/policies — reads policies from the on-chain PolicyRegistry (source of truth),
 * then caches them in SQLite for the monitor/agent. Falls back to SQLite cache if chain
 * read fails.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const offset = parsePageParam(searchParams.get("offset"), 0, Number.MAX_SAFE_INTEGER);
  const limit = parsePageParam(searchParams.get("limit"), 50, 50);
  if (offset === null || limit === null || limit === 0) {
    return NextResponse.json(
      { error: "offset must be a non-negative integer and limit must be 1-50" },
      { status: 400 },
    );
  }

  // Primary path: read from chain (source of truth)
  try {
    console.log("[api/policies] Reading from on-chain PolicyRegistry...");
    const { policies: chainPolicies, total } = await listPoliciesFromHedera(offset, limit);
    console.log("[api/policies] Got", chainPolicies.length, "policies from chain, total", total);

    // Best-effort: cache policies in SQLite for monitor/agent use
    try {
      const { upsertPolicy } = await import("~~/services/policy/repository");
      for (const policy of chainPolicies) {
        try {
          upsertPolicy(policy);
        } catch {
          // Ignore individual upsert failures
        }
      }
    } catch {
      // SQLite unavailable — that's fine, chain data is primary
    }

    return NextResponse.json({ policies: chainPolicies, total });
  } catch (chainError) {
    if (chainError instanceof PolicyRegistryNotDeployedError) {
      return NextResponse.json({ error: chainError.message }, { status: 503 });
    }
    console.warn("[api/policies] Chain read failed, trying SQLite cache...", chainError);

    // Fallback: read from SQLite cache
    try {
      const { listPolicies } = await import("~~/services/policy/repository");
      const allPolicies = listPolicies();
      const total = allPolicies.length;
      const policies = allPolicies.slice(offset!, offset! + limit!);
      console.log("[api/policies] SQLite fallback:", policies.length, "policies, total", total);
      return NextResponse.json({ policies, total });
    } catch (dbError) {
      console.error("[api/policies] Both chain and SQLite failed", { chainError, dbError });
      return NextResponse.json({ error: "Failed to read policies from both chain and database" }, { status: 500 });
    }
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const required = [
    "policyholder",
    "dataChainId",
    "stablecoinSymbol",
    "stablecoinAddress",
    "referencePoolAddress",
    "payoutTokenSymbol",
  ];
  if (!body || required.some(field => typeof body[field] !== "string" || !(body[field] as string).trim())) {
    return NextResponse.json({ error: "Missing policy terms" }, { status: 400 });
  }
  const numeric = [
    "thresholdBps",
    "minimumDurationMinutes",
    "payoutAmountBaseUnits",
    "coverageStart",
    "coverageEnd",
    "maxEvidenceBudgetTinybar",
  ];
  if (numeric.some(field => body[field] === undefined || body[field] === null || !/^\d+$/.test(String(body[field])))) {
    return NextResponse.json({ error: "Numeric policy terms must be non-negative integers" }, { status: 400 });
  }
  const args = [
    body.policyholder,
    body.dataChainId,
    body.stablecoinSymbol,
    body.stablecoinAddress,
    body.referencePoolAddress,
    body.thresholdBps,
    body.minimumDurationMinutes,
    body.payoutAmountBaseUnits,
    body.payoutTokenSymbol,
    body.coverageStart,
    body.coverageEnd,
    body.maxEvidenceBudgetTinybar,
  ];
  return NextResponse.json(
    {
      status: "ready_for_wallet",
      functionName: "createPolicy",
      args,
      message: "Submit these arguments through HashPack native ContractExecuteTransaction.",
    },
    { status: 202 },
  );
}
