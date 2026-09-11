"use client";

import { useEffect, useState } from "react";
import { ClaimCard } from "~~/components/claim/ClaimCard";
import type { Claim } from "~~/services/policy/types";

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/claims");
      if (!response.ok) throw new Error("Failed to fetch claims");
      const data = await response.json();
      setClaims(data.claims || []);
    } catch (err) {
      console.error("Failed to fetch claims:", err);
      setError(err instanceof Error ? err.message : "Failed to load claims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const filteredClaims = claims.filter(claim => {
    if (filter === "all") return true;
    if (filter === "active") return ["INVESTIGATING", "EVIDENCE_READY", "NEEDS_REVIEW"].includes(claim.status);
    if (filter === "approved") return claim.status === "APPROVED";
    if (filter === "rejected") return claim.status === "REJECTED";
    return true;
  });

  const stats = {
    total: claims.length,
    investigating: claims.filter(c => c.status === "INVESTIGATING").length,
    needsReview: claims.filter(c =>
      ["NEEDS_REVIEW", "ELIGIBLE_RECOMMENDATION", "INELIGIBLE_RECOMMENDATION"].includes(c.status),
    ).length,
    approved: claims.filter(c => c.status === "APPROVED").length,
    rejected: claims.filter(c => c.status === "REJECTED").length,
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
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
              <h1 className="text-4xl font-bold">Claims Dashboard</h1>
              <p className="text-base-content/70 mt-1">Autonomous depeg detection and transparent claim evaluation</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-base-200 rounded-lg p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-base-content/60">Total Claims</div>
            </div>
            <div className="bg-base-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-warning">{stats.investigating}</div>
              <div className="text-xs text-base-content/60">Investigating</div>
            </div>
            <div className="bg-base-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-info">{stats.needsReview}</div>
              <div className="text-xs text-base-content/60">Needs Review</div>
            </div>
            <div className="bg-base-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-success">{stats.approved}</div>
              <div className="text-xs text-base-content/60">Approved</div>
            </div>
            <div className="bg-base-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-error">{stats.rejected}</div>
              <div className="text-xs text-base-content/60">Rejected</div>
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
            All Claims
          </button>
          <button
            className={`btn btn-sm ${filter === "active" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter("active")}
          >
            Active
          </button>
          <button
            className={`btn btn-sm ${filter === "approved" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter("approved")}
          >
            Approved
          </button>
          <button
            className={`btn btn-sm ${filter === "rejected" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter("rejected")}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Claims Grid */}
      <div className="container mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <span className="loading loading-spinner loading-lg"></span>
              <p className="mt-4 text-base-content/60">Loading claims...</p>
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
            <button className="btn btn-sm" onClick={fetchClaims}>
              Retry
            </button>
          </div>
        ) : filteredClaims.length === 0 ? (
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
            <h3 className="text-xl font-bold mb-2">No Claims Found</h3>
            <p className="text-base-content/60 mb-6">
              {filter === "all"
                ? "No depeg claims have been detected yet. The monitor will automatically detect and create claims when price events match policy terms."
                : `No claims matching the "${filter}" filter.`}
            </p>
            {filter !== "all" && (
              <button className="btn btn-primary" onClick={() => setFilter("all")}>
                View All Claims
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredClaims.map(claim => (
              <ClaimCard key={claim.claimId} claim={claim} onUpdate={fetchClaims} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
