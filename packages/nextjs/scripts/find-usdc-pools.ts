import { readFileSync } from "fs";
import { join } from "path";

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
} catch (error: any) {
  console.error("Warning: Could not load .env file:", error.message);
}

async function findUsdcPools() {
  const endpoint = process.env.EDGRAPH_GRAPH_ENDPOINT;

  const query = `
    query FindUSDCPools {
      pools(
        first: 10,
        orderBy: totalValueLockedUSD,
        orderDirection: desc,
        where: {
          token0_: { symbol: "USDC" }
        }
      ) {
        id
        token0 { symbol decimals }
        token1 { symbol decimals }
        totalValueLockedUSD
        volumeUSD
        feeTier
      }
    }
  `;

  console.log("Searching for USDC pools on Base...\n");

  const response = await fetch(endpoint!, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const result = await response.json();

  if (result.errors) {
    console.error("Error:", result.errors);
    return;
  }

  console.log("Top USDC pools found:\n");
  result.data.pools.forEach((pool: any, i: number) => {
    console.log(`${i + 1}. ${pool.token0.symbol}/${pool.token1.symbol}`);
    console.log(`   Address: ${pool.id}`);
    console.log(`   TVL: $${Number(pool.totalValueLockedUSD).toLocaleString()}`);
    console.log(`   Volume: $${Number(pool.volumeUSD).toLocaleString()}`);
    console.log(`   Fee: ${pool.feeTier / 10000}%`);
    console.log();
  });
}

findUsdcPools().catch(console.error);
