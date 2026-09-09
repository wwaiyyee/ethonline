import { readFileSync } from "fs";
import { join } from "path";
import { monitorPolicy } from "~~/services/graph/monitor";
import { listActivePolicies } from "~~/services/policy/repository";

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

const intervalMs = Math.max(15_000, Number(process.env.EDGRAPH_MONITOR_INTERVAL_MS ?? 60_000));

async function tick() {
  const policies = listActivePolicies();
  for (const policy of policies) {
    try {
      const observation = await monitorPolicy(policy);
      console.log(
        `[edgraph-monitor] LIVE GRAPH DATA policy=${policy.policyId} price=$${(observation.priceUsdMicros / 1_000_000).toFixed(4)} liquidity=$${(observation.liquidityUsdMicros / 1_000_000).toFixed(2)} block=${observation.sourceBlock ?? "unknown"}`,
      );
    } catch (error) {
      console.error(`[edgraph-monitor] policy=${policy.policyId} failed`, error);
    }
  }
}

async function main() {
  await tick();
  if (process.env.EDGRAPH_MONITOR_ONCE !== "true") {
    setInterval(() => void tick(), intervalMs);
  }
}

main().catch(console.error);
