"use client";

import { useEffect, useState } from "react";
import { ClaimCard } from "~~/components/claim/ClaimCard";
import type { Claim } from "~~/services/policy/types";

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Fetch claims from API
  const fetchClaims = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/claims");
      if (!response.ok) throw new Error("Failed to fetch claims");
      const data = await response.json();
      setClaims(data.claims || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchClaims();
  }, []);

  // Filter claims
  const filteredClaims = claims.filter(claim => {
    if (filterStatus !== "all" && claim.status !== filterStatus) return false;
    return true;
  });

  // Get unique statuses for filter
  const statuses = Array.from(new Set(claims.map(c => c.status)));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Claims</h1>
          <p className="text-base-content/70">Track detected depegs, purchased evidence, and claim decisions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-base-200 rounded-lg p-4 mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Status:</label>
          <select
            className="select select-sm select-bordered"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="POTENTIAL_CLAIM">Potential</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="EVIDENCE_READY">Evidence Ready</option>
            <option value="ELIGIBLE_RECOMMENDATION">Eligible</option>
            <option value="INELIGIBLE_RECOMMENDATION">Ineligible</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button className="btn btn-sm btn-ghost" onClick={fetchClaims}>
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
      ) : filteredClaims.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold mb-2">No claims found</h3>
          <p className="text-base-content/70 mb-6">
            {filterStatus !== "all" ? "Try adjusting your filters" : "Claims will appear here when depegs are detected"}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-base-content/70">
            Showing {filteredClaims.length} of {claims.length} claims
          </div>
          <div className="space-y-4">
            {filteredClaims.map(claim => (
              <ClaimCard key={claim.claimId} claim={claim} onUpdate={fetchClaims} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
