/**
 * Verify Railway deployment is working correctly.
 *
 * Usage:
 *   RAILWAY_URL=https://edgraph.up.railway.app tsx scripts/verify-railway-deployment.ts
 */

const RAILWAY_URL = process.env.RAILWAY_URL || "https://edgraph.up.railway.app";

interface HealthResponse {
  status: string;
  service: string;
  version: string;
  endpoints: Record<string, string>;
}

interface PolicyResponse {
  policies: any[];
  total: number;
}

async function verifyEndpoint(path: string, expectedStatus: number = 200): Promise<boolean> {
  const url = `${RAILWAY_URL}${path}`;
  console.log(`\nChecking ${url}`);

  try {
    const response = await fetch(url);
    const status = response.status;

    if (status === expectedStatus) {
      console.log(`✅ ${path} - Status ${status}`);

      if (response.headers.get("content-type")?.includes("application/json")) {
        const data = await response.json();
        console.log(`   Response:`, JSON.stringify(data, null, 2).slice(0, 200) + "...");
      }
      return true;
    } else {
      console.log(`❌ ${path} - Expected ${expectedStatus}, got ${status}`);
      const text = await response.text();
      console.log(`   Error:`, text.slice(0, 200));
      return false;
    }
  } catch (error) {
    console.log(`❌ ${path} - Failed to fetch`);
    console.log(`   Error:`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function verifyDatabase(): Promise<boolean> {
  console.log(`\n📊 Verifying database...`);

  try {
    const response = await fetch(`${RAILWAY_URL}/api/policies`);
    if (!response.ok) {
      console.log(`❌ Database verification failed - /api/policies returned ${response.status}`);
      return false;
    }

    const data = (await response.json()) as PolicyResponse;
    const count = data.policies?.length || 0;

    if (count === 0) {
      console.log(`⚠️  Database is empty - needs seeding`);
      console.log(`   Run: railway run yarn db:init`);
      return false;
    } else {
      console.log(`✅ Database has ${count} policies`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Database verification failed`);
    console.log(`   Error:`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function main() {
  console.log(`🚀 Verifying Railway deployment at ${RAILWAY_URL}\n`);
  console.log(`${"=".repeat(60)}`);

  const results = {
    health: await verifyEndpoint("/api/health"),
    openapi: await verifyEndpoint("/api/openapi"),
    policies: await verifyEndpoint("/api/policies"),
    claims: await verifyEndpoint("/api/claims"),
    snapshotMock: await verifyEndpoint("/api/graph/snapshot-mock"),
    database: false,
  };

  // Only check database if policies endpoint works
  if (results.policies) {
    results.database = await verifyDatabase();
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`\n📋 Summary:`);
  console.log(`   Health Check:     ${results.health ? "✅" : "❌"}`);
  console.log(`   OpenAPI Spec:     ${results.openapi ? "✅" : "❌"}`);
  console.log(`   Policies API:     ${results.policies ? "✅" : "❌"}`);
  console.log(`   Claims API:       ${results.claims ? "✅" : "❌"}`);
  console.log(`   Mock Snapshot:    ${results.snapshotMock ? "✅" : "❌"}`);
  console.log(`   Database Seeded:  ${results.database ? "✅" : "⚠️  Empty"}`);

  const allGood = Object.values(results).every(v => v === true);

  if (allGood) {
    console.log(`\n✅ All checks passed! Deployment is healthy.`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  Some checks failed. Review the output above.`);

    if (!results.database && results.policies) {
      console.log(`\n💡 Next step: Seed the database`);
      console.log(`   railway run yarn db:init`);
    }

    process.exit(1);
  }
}

main().catch(error => {
  console.error("Verification script failed:", error);
  process.exit(1);
});
