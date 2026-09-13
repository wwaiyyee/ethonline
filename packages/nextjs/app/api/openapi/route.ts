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
    "/api/graph/snapshot-mock": {
      post: {
        summary: "Get live stablecoin pool snapshot",
        description: "Free to call. Returns real-time pool data from The Graph.",
        operationId: "getPoolSnapshot",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["poolAddress"],
                properties: {
                  poolAddress: {
                    type: "string",
                    description: "Uniswap V3 pool address on Base",
                    example: "0x88A43bbDF9D098eEC7bCEda4e2494615dfD9bB9C",
                  },
                  lookbackSeconds: {
                    type: "integer",
                    description: "Time window for price movement analysis",
                    example: 3600,
                    default: 3600,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Live pool snapshot with price and liquidity data",
          },
        },
      },
    },
    "/api/v1/depeg-evidence": {
      post: {
        summary: "Purchase depeg evidence (x402 payment required)",
        description: "Requires 0.01 HBAR payment via x402. Returns deep evidence analysis.",
        operationId: "buyEvidence",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["policyId", "claimId"],
                properties: {
                  policyId: {
                    type: "string",
                    description: "Insurance policy identifier (bytes32 hex)",
                    example: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
                  },
                  claimId: {
                    type: "string",
                    description: "Unique claim identifier",
                    example: "claim-001",
                  },
                  lookbackSeconds: {
                    type: "integer",
                    description: "Historical window for evidence gathering",
                    example: 3600,
                    default: 3600,
                  },
                },
              },
            },
          },
        },
        responses: {
          "402": {
            description: "Payment Required - x402 challenge",
          },
          "200": {
            description: "Evidence report (after successful payment)",
          },
        },
      },
    },
    "/api/v1/depeg-evidence-free": {
      post: {
        summary: "Get depeg evidence (FREE for demo)",
        description: "Free to call. Returns mock evidence data for Bazantic demo.",
        operationId: "buyEvidenceFree",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["policyId", "claimId"],
                properties: {
                  policyId: {
                    type: "string",
                    description: "Insurance policy identifier (bytes32 hex)",
                    example: "0x37fa3d9cde09def97e688634b3ba7ee1c51af6418dd24432a03555bd15968025",
                  },
                  claimId: {
                    type: "string",
                    description: "Unique claim identifier",
                    example: "claim-001",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Evidence report with mock depeg data",
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
