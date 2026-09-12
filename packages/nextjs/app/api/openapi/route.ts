import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serve the OpenAPI specification for Bazantic Gateway registration.
 *
 * This endpoint provides the OpenAPI spec that describes all EdGraph API endpoints,
 * including the x402 payment-required Evidence API.
 */
export async function GET() {
  try {
    const specPath = path.join(process.cwd(), "..", "..", "bazantic", "edgraph-openapi.yaml");

    if (!fs.existsSync(specPath)) {
      return NextResponse.json(
        { error: "OpenAPI spec not found. Run from repository root or check bazantic/edgraph-openapi.yaml exists." },
        { status: 404 },
      );
    }

    const specContent = fs.readFileSync(specPath, "utf8");
    const spec = yaml.parse(specContent);

    // Replace placeholder server URLs with actual deployment URL
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : "http://localhost:3000";

    spec.servers = [
      {
        url: baseUrl,
        description: "EdGraph API",
      },
    ];

    return NextResponse.json(spec, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("[api/openapi] Failed to serve OpenAPI spec:", error);
    return NextResponse.json(
      {
        error: "Failed to load OpenAPI specification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
