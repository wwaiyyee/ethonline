import { listActivePolicies } from "~~/services/policy/repository";
import { monitorPolicy } from "~~/services/graph/monitor";

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

await tick();
if (process.env.EDGRAPH_MONITOR_ONCE !== "true") {
  setInterval(() => void tick(), intervalMs);
}

