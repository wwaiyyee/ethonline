import { NextResponse } from "next/server";
import { PolicyRegistryNotDeployedError, listPoliciesFromHedera } from "~~/services/policy/chainReader";
import { upsertPolicy } from "~~/services/policy/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePageParam(value: string | null, fallback: number, max: number): number | null {
  if (value === null || value === "") return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= max ? parsed : null;
}

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
  try {
    const result = await listPoliciesFromHedera(offset, limit);
    result.policies.forEach(upsertPolicy);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PolicyRegistryNotDeployedError)
      return NextResponse.json({ error: error.message }, { status: 503 });
    console.error("[api/policies] read failed", error);
    return NextResponse.json({ error: "Failed to read policies" }, { status: 502 });
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
