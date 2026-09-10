"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DashboardData = {
  dataMode: string;
  policies: Array<{
    policy: { policyId: string; stablecoinSymbol: string; thresholdBps: number; minimumDurationMinutes: number; active: boolean };
    latestObservation: { priceUsdMicros: number; liquidityUsdMicros: number; sourceName: string; sourceBlock?: number } | null;
  }>;
};

export default function EdGraphDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/edgraph")
      .then(response => (response.ok ? response.json() : Promise.reject(new Error("Dashboard API unavailable"))))
      .then(setData)
      .catch((reason: Error) => setError(reason.message));
  }, []);

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">EdGraph operations</p>
          <h1 className="text-4xl font-bold">Stablecoin coverage monitor</h1>
          <p className="max-w-2xl text-base-content/70">Live Base pool observations, Hedera policy terms, and paid evidence in one audit trail.</p>
        </div>
        <Link className="btn btn-primary" href="/">Back to home</Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <span className="badge badge-success gap-2 py-3">LIVE GRAPH DATA</span>
        <span className="badge badge-ghost gap-2 py-3">REPLAY DATA is never presented as live</span>
      </div>

      {error ? <div className="alert alert-warning">{error}</div> : null}
      {!data && !error ? <div className="loading loading-spinner loading-md" aria-label="Loading dashboard" /> : null}
      {data?.policies.length === 0 ? (
        <div className="rounded-lg border border-base-300 bg-base-100 p-8">Create a Hedera policy to start monitoring a pool.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {data?.policies.map(({ policy, latestObservation }) => (
            <article className="rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm" key={policy.policyId}>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{policy.stablecoinSymbol} coverage policy</h2>
                  <p className="mt-1 break-all font-mono text-xs text-base-content/60">{policy.policyId}</p>
                </div>
                <span className={policy.active ? "badge badge-success" : "badge badge-ghost"}>{policy.active ? "ACTIVE" : "RESOLVED"}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-base-content/60">Current price</span><strong className="mt-1 block text-lg">{latestObservation ? `$${(latestObservation.priceUsdMicros / 1_000_000).toFixed(4)}` : "Awaiting observation"}</strong></div>
                <div><span className="text-base-content/60">Threshold</span><strong className="mt-1 block text-lg">${(policy.thresholdBps / 10_000).toFixed(4)}</strong></div>
                <div><span className="text-base-content/60">Liquidity</span><strong className="mt-1 block">{latestObservation ? `$${(latestObservation.liquidityUsdMicros / 1_000_000).toLocaleString()}` : "-"}</strong></div>
                <div><span className="text-base-content/60">Source</span><strong className="mt-1 block">{latestObservation?.sourceName === "the-graph" ? "The Graph" : "No live sample"}</strong></div>
              </div>
              <div className="mt-5 border-t border-base-300 pt-4 text-xs text-base-content/60">Duration trigger: {policy.minimumDurationMinutes} minutes · block {latestObservation?.sourceBlock ?? "pending"}</div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

