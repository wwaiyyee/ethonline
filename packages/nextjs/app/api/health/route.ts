import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "EdGraph API",
      version: "1.0.0",
      endpoints: {
        graphMonitor: "/api/graph/snapshot",
        evidenceAPI: "/api/v1/depeg-evidence",
        openapi: "/api/openapi",
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
