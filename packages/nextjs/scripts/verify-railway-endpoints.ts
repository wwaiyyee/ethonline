/**
 * Comprehensive Railway endpoint verification script.
 * Tests all critical endpoints to ensure the production deployment is working.
 */

const RAILWAY_URL = "https://edgraph.up.railway.app";

interface TestResult {
  endpoint: string;
  status: "PASS" | "FAIL" | "SKIP";
  message: string;
  responseTime?: number;
}

const results: TestResult[] = [];

async function testEndpoint(name: string, path: string, expectedStatus: number): Promise<TestResult> {
  const start = Date.now();
  try {
    const response = await fetch(`${RAILWAY_URL}${path}`);
    const elapsed = Date.now() - start;

    if (response.status === expectedStatus) {
      return {
        endpoint: name,
        status: "PASS",
        message: `Returned ${response.status} as expected`,
        responseTime: elapsed,
      };
    } else {
      const body = await response.text().catch(() => "Could not read body");
      return {
        endpoint: name,
        status: "FAIL",
        message: `Expected ${expectedStatus}, got ${response.status}. Body: ${body.slice(0, 200)}`,
        responseTime: elapsed,
      };
    }
  } catch (error) {
    return {
      endpoint: name,
      status: "FAIL",
      message: `Request failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function testGraphSnapshot(): Promise<TestResult> {
  const start = Date.now();
  try {
    const response = await fetch(`${RAILWAY_URL}/api/graph/snapshot`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        poolAddress: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
        lookbackSeconds: 3600,
      }),
    });
    const elapsed = Date.now() - start;
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        endpoint: "Graph Snapshot (live)",
        status: "FAIL",
        message: `${response.status}: ${JSON.stringify(data)}`,
        responseTime: elapsed,
      };
    }

    if (!data || typeof data.currentPriceUsdMicros !== "number") {
      return {
        endpoint: "Graph Snapshot (live)",
        status: "FAIL",
        message: `Missing expected fields in response: ${JSON.stringify(data).slice(0, 200)}`,
        responseTime: elapsed,
      };
    }

    return {
      endpoint: "Graph Snapshot (live)",
      status: "PASS",
      message: `Price: $${(data.currentPriceUsdMicros / 1_000_000).toFixed(4)}, Liquidity: $${(data.liquidityUsdMicros / 1_000_000).toFixed(0)}`,
      responseTime: elapsed,
    };
  } catch (error) {
    return {
      endpoint: "Graph Snapshot (live)",
      status: "FAIL",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testPoliciesEndpoint(): Promise<TestResult> {
  const start = Date.now();
  try {
    const response = await fetch(`${RAILWAY_URL}/api/policies`);
    const elapsed = Date.now() - start;
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        endpoint: "Policies API",
        status: "FAIL",
        message: `${response.status}: ${JSON.stringify(data)}`,
        responseTime: elapsed,
      };
    }

    const count = data?.policies?.length || 0;
    if (count === 0) {
      return {
        endpoint: "Policies API",
        status: "FAIL",
        message: "Database is empty - run: railway run yarn db:init",
        responseTime: elapsed,
      };
    }

    return {
      endpoint: "Policies API",
      status: "PASS",
      message: `Found ${count} policies in database`,
      responseTime: elapsed,
    };
  } catch (error) {
    return {
      endpoint: "Policies API",
      status: "FAIL",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log("\n=== Railway Endpoint Verification ===");
  console.log(`Target: ${RAILWAY_URL}\n`);

  // Health check
  results.push(await testEndpoint("Health Check", "/api/health", 200));

  // OpenAPI spec
  results.push(await testEndpoint("OpenAPI Spec", "/api/openapi", 200));

  // Policies API
  results.push(await testPoliciesEndpoint());

  // Graph snapshot (live)
  results.push(await testGraphSnapshot());

  // Evidence API (should return 402 without payment)
  results.push(await testEndpoint("Evidence API (402 challenge)", "/api/v1/depeg-evidence", 402));

  // Print results
  console.log("\n=== Test Results ===\n");
  let passCount = 0;
  let failCount = 0;

  for (const result of results) {
    const icon = result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⏭️ ";
    const timeStr = result.responseTime ? ` (${result.responseTime}ms)` : "";
    console.log(`${icon} ${result.endpoint}${timeStr}`);
    console.log(`   ${result.message}\n`);

    if (result.status === "PASS") passCount++;
    if (result.status === "FAIL") failCount++;
  }

  console.log("======================");
  console.log(`PASS: ${passCount}, FAIL: ${failCount}`);
  console.log("======================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error("Verification script failed:", error);
  process.exit(1);
});
