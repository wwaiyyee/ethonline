"use client";

import { useEffect, useState } from "react";
import { CreatePolicyButton } from "~~/components/policy/CreatePolicyButton";
import { PolicyCard } from "~~/components/policy/PolicyCard";
import { useScaffoldReadContract } from "~~/hooks/scaffold-hbar";
import type { PolicyTerms } from "~~/services/policy/types";

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyTerms[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "resolved">("all");
  const [filterChain, setFilterChain] = useState<string>("all");

  // Fetch policies from API
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/policies");
      if (!response.ok) throw new Error("Failed to fetch policies");
      const data = await response.json();
      setPolicies(data.policies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchPolicies();
  }, []);

  // Filter policies
  const filteredPolicies = policies.filter(policy => {
    if (filterStatus !== "all") {
      if (filterStatus === "active" && !policy.active) return false;
      if (filterStatus === "resolved" && !policy.resolved) return false;
    }
    if (filterChain !== "all" && policy.dataChainId !== filterChain) return false;
    return true;
  });

  // Get unique chains for filter
  const chains = Array.from(new Set(policies.map(p => p.dataChainId)));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Coverage Policies</h1>
          <p className="text-base-content/70">Stablecoin depeg coverage policies registered on Hedera testnet</p>
        </div>
        <CreatePolicyButton onCreated={fetchPolicies} />
      </div>

      {/* Filters */}
      <div className="bg-base-200 rounded-lg p-4 mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Status:</label>
          <select
            className="select select-sm select-bordered"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Chain:</label>
          <select
            className="select select-sm select-bordered"
            value={filterChain}
            onChange={e => setFilterChain(e.target.value)}
          >
            <option value="all">All Chains</option>
            {chains.map(chain => (
              <option key={chain} value={chain}>
                {chain}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button className="btn btn-sm btn-ghost" onClick={fetchPolicies}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      ) : filteredPolicies.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-2xl font-bold mb-2">No policies found</h3>
          <p className="text-base-content/70 mb-6">
            {filterStatus !== "all" || filterChain !== "all"
              ? "Try adjusting your filters"
              : "Create your first coverage policy to get started"}
          </p>
          {policies.length === 0 && <CreatePolicyButton onCreated={fetchPolicies} />}
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-base-content/70">
            Showing {filteredPolicies.length} of {policies.length} policies
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolicies.map(policy => (
              <PolicyCard key={policy.policyId} policy={policy} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
