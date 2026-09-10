import { readFileSync } from "fs";
import { join } from "path";
import { queryPoolData } from "~~/services/graph/client";
import { getGraphConfig } from "~~/services/graph/config";

// Load .env file manually
const envPath = join(process.cwd(), ".env");
try {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("---")) return;
    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  console.log("✓ Environment variables loaded from .env\n");
} catch (error: any) {
  console.error("Warning: Could not load .env file:", error.message);
}

async function testGraph() {
  try {
    console.log("=== Testing The Graph Connection ===\n");

    // Test 1: Configuration
    console.log("1. Checking configuration...");
    const config = getGraphConfig();
    console.log("   Pool address:", config.poolAddress);
    console.log("   Stablecoin:", config.stablecoinSymbol, config.stablecoinAddress);
    console.log("   Quote token:", config.quoteTokenSymbol, config.quoteTokenAddress);
    console.log("   Endpoint:", config.provenanceEndpoint);
    console.log("   ✓ Configuration loaded\n");

    // Test 2: Query live data
    console.log("2. Querying live Graph data (last 5 minutes)...");
    console.log("   Debug - Pool address being queried:", config.poolAddress);
    console.log("   Debug - Endpoint:", config.endpoint);
    const data = await queryPoolData({ lookbackSeconds: 300 });
    console.log("   ✓ Connected to The Graph");
    console.log("   ✓ Pool ID:", data.pool.id);
    console.log("   ✓ Token0:", data.pool.token0.symbol, `(${data.pool.token0.decimals} decimals)`);
    console.log("   ✓ Token1:", data.pool.token1.symbol, `(${data.pool.token1.decimals} decimals)`);
    console.log("   ✓ Samples received:", data.samples.length);

    if (data.samples.length > 0) {
      const latest = data.samples[data.samples.length - 1];
      console.log("   ✓ Latest price: $" + latest.priceUsd.toFixed(6));
      console.log("   ✓ Latest timestamp:", new Date(latest.timestamp * 1000).toISOString());
      if (latest.blockNumber) {
        console.log("   ✓ Latest block:", latest.blockNumber);
      }
    }

    // Test 3: Provenance
    console.log("\n3. Checking provenance...");
    console.log("   ✓ Endpoint:", data.provenance.endpoint);
    if (data.provenance.subgraphId) {
      console.log("   ✓ Subgraph ID:", data.provenance.subgraphId);
    }
    if (data.provenance.latestBlock) {
      console.log("   ✓ Latest block:", data.provenance.latestBlock);
    }
    console.log("   ✓ Query hash:", data.provenance.queryHash.slice(0, 16) + "...");

    // Test 4: Price range
    console.log("\n4. Price analysis...");
    const prices = data.samples.map(s => s.priceUsd);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    console.log("   Min price: $" + minPrice.toFixed(6));
    console.log("   Max price: $" + maxPrice.toFixed(6));
    console.log("   Avg price: $" + avgPrice.toFixed(6));

    // Test 5: Pool liquidity
    console.log("\n5. Pool liquidity...");
    console.log("   TVL: $" + Number(data.pool.totalValueLockedUSD).toLocaleString());
    console.log("   Liquidity:", data.pool.liquidity);

    console.log("\n=== ALL TESTS PASSED ===");
    console.log("✓ The Graph integration is working correctly");
    console.log("✓ Live USDC price data is available");
    console.log("✓ Ready to proceed to Phase 2");
  } catch (error: any) {
    console.error("\n=== TEST FAILED ===");
    console.error("Error:", error.message);
    if (error.message.includes("Missing")) {
      console.error("\nConfiguration issue detected.");
      console.error("Please check your .env file has all required EDGRAPH_* variables.");
    } else if (error.message.includes("Graph")) {
      console.error("\nThe Graph API issue detected.");
      console.error("Please verify your EDGRAPH_GRAPH_API_KEY is valid.");
    }
    process.exit(1);
  }
}

testGraph();
