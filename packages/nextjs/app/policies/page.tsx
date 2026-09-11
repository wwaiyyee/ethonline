"use client";

import { useEffect, useState } from "react";
import { CreatePolicyButton } from "~~/components/policy/CreatePolicyButton";
import { PolicyCard } from "~~/components/policy/PolicyCard";
import type { PolicyTerms } from "~~/services/policy/types";

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyTerms[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/policies");
      if (!response.ok) throw new Error("Failed to fetch policies");
      const data = await response.json();
      setPolicies(data.policies || []);
    } catch (err) {
      console.error("Failed to fetch policies:", err);
      setError(err instanceof Error ? err.message : "Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const filteredPolicies = policies.filter(policy => {
    if (filter === "all") return true;
    if (filter === "active") {
      const now = Math.floor(Date.now() / 1000);
      return policy.active && now >= policy.coverageStart && now <= policy.coverageEnd && !policy.resolved;
    }
    if (filter === "upcoming") {
      const now = Math.floor(Date.now() / 1000);
      return policy.active && now < policy.coverageStart;
    }
    if (filter === "expired") {
      const now = Math.floor(Date.now() / 1000);
      return now > policy.coverageEnd || policy.resolved;
    }
    return true;
  });

  const stats = {
    total: policies.length,
    active: policies.filter(p => {
      const now = Math.floor(Date.now() / 1000);
      return p.active && now >= p.coverageStart && now <= p.coverageEnd && !p.resolved;
    }).length,
    upcoming: policies.filter(p => {
      const now = Math.floor(Date.now() / 1000);
      return p.active && now < p.coverageStart;
    }).length,
    expired: policies.filter(p => {
      const now = Math.floor(Date.now() / 1000);
      return now > p.coverageEnd || p.resolved;
    }).length,
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full hedera-gradient flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold">Coverage Policies</h1>
                <p className="text-base-content/70 mt-1">Register and manage stablecoin depeg protection on Hedera</p>
              </div>
            </div>
            <CreatePolicyButton onCreated={fetchPolicies} />
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-base-200 rounded-lg p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-base-content/60">Total Policies</div>
            </div>
            <div className="bg-base-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-success">{stats.active}</div>
              <div className="text-xs text-base-content/60">Active</div>
            </div>
            <div className="bg-base-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-info">{stats.upcoming}</div>
              <div className="text-xs text-base-content/60">Upcoming</div>
            </div>
            <div className="bg-base-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-base-content/40">{stats.expired}</div>
              <div className="text-xs text-base-content/60">Expired</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 flex-wrap">
          <button
            className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter("all")}
          >
            All Policies
          </button>
          <button
            className={`btn btn-sm ${filter === "active" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter("active")}
          >
            Active
          </button>
          <button
            className={`btn btn-sm ${filter === "upcoming" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={`btn btn-sm ${filter === "expired" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter("expired")}
          >
            Expired
          </button>
        </div>
      </div>

      {/* Policies Grid */}
      <div className="container mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <span className="loading loading-spinner loading-lg"></span>
              <p className="mt-4 text-base-content/60">Loading policies...</p>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-error max-w-2xl mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
            <button className="btn btn-sm" onClick={fetchPolicies}>
              Retry
            </button>
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">No Policies Found</h3>
            <p className="text-base-content/60 mb-6">
              {filter === "all"
                ? "No coverage policies have been registered yet. Create your first policy to protect against stablecoin depegs."
                : `No policies matching the "${filter}" filter.`}
            </p>
            <div className="flex gap-3 justify-center">
              {filter !== "all" && (
                <button className="btn btn-ghost" onClick={() => setFilter("all")}>
                  View All Policies
                </button>
              )}
              <CreatePolicyButton onCreated={fetchPolicies} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolicies.map(policy => (
              <PolicyCard key={policy.policyId} policy={policy} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
