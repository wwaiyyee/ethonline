import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-static";

const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "EdGraph API",
    description: "Stablecoin depeg insurance evidence API with live Graph data monitoring and x402 payment",
    version: "1.0.0",
  },
  servers: [
    {
      url: "https://edgraph.up.railway.app",
      description: "Production server",
    },
  ],
  paths: {
    "/api/graph/snapshot": {
      post: {
        summary: "Get live stablecoin pool snapshot",
        description: "Free to call",
        operationId: "getPoolSnapshot",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  poolAddress: { type: "string" },
                  lookbackSeconds: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/depeg-evidence": {
      post: {
        summary: "Purchase depeg evidence (x402 payment required)",
        description: "Requires 0.01 HBAR payment via x402",
        operationId: "buyEvidence",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  policyId: { type: "string" },
                  claimId: { type: "string" },
                  lookbackSeconds: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
