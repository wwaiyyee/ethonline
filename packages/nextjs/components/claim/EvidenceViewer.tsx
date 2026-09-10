"use client";

import { useEffect, useState } from "react";

interface EvidenceViewerProps {
  claimId: string;
  evidenceFileIds: string[];
}

interface EvidenceData {
  depegVerified: boolean;
  lowestObservedPriceUsdMicros: number;
  belowThresholdDurationMinutes: number;
  liquidityChangeBps: number;
  sellVolumeMultipleBps?: number;
  evidence: string[];
  provenance: {
    endpoint: string;
    fromTimestamp: number;
    toTimestamp: number;
  };
}

export function EvidenceViewer({ claimId, evidenceFileIds }: EvidenceViewerProps) {
  const [evidence, setEvidence] = useState<EvidenceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvidence = async () => {
    if (evidenceFileIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // For now, fetch from a hypothetical endpoint
      // In production, this would fetch the actual purchased evidence
      const response = await fetch(`/api/v1/depeg-evidence?claimId=${claimId}`);

      if (response.ok) {
        const data = await response.json();
        setEvidence(data.report);
      } else {
        throw new Error("Failed to fetch evidence");
      }
    } catch (err) {
      console.error("Evidence fetch failed:", err);
      setError(err instanceof Error ? err.message : "Failed to load evidence");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [claimId, evidenceFileIds]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <span className="loading loading-spinner"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-warning">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="bg-base-200 rounded-lg p-4 text-center text-sm text-base-content/70">
        Evidence purchased but not yet loaded
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
        <div className="stat">
          <div className="stat-title text-xs">Depeg Verified</div>
          <div className={`stat-value text-2xl ${evidence.depegVerified ? "text-success" : "text-error"}`}>
            {evidence.depegVerified ? "Yes" : "No"}
          </div>
        </div>

        <div className="stat">
          <div className="stat-title text-xs">Lowest Price</div>
          <div className="stat-value text-2xl">${(evidence.lowestObservedPriceUsdMicros / 1000000).toFixed(4)}</div>
        </div>

        <div className="stat">
          <div className="stat-title text-xs">Duration</div>
          <div className="stat-value text-2xl">{evidence.belowThresholdDurationMinutes} min</div>
        </div>

        <div className="stat">
          <div className="stat-title text-xs">Liquidity Change</div>
          <div className="stat-value text-2xl">{(evidence.liquidityChangeBps / 100).toFixed(2)}%</div>
        </div>
      </div>

      {/* Evidence Details */}
      <div>
        <div className="text-sm font-semibold mb-2">Evidence Points</div>
        <div className="bg-base-200 rounded-lg p-4">
          {evidence.evidence.length > 0 ? (
            <ul className="space-y-2">
              {evidence.evidence.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-base-content/70 text-center">No evidence points</div>
          )}
        </div>
      </div>

      {/* Provenance */}
      <div>
        <div className="text-sm font-semibold mb-2">Data Provenance</div>
        <div className="bg-base-200 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-base-content/70">Endpoint:</span>
            <span className="font-mono text-xs">{evidence.provenance.endpoint}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-content/70">Time Window:</span>
            <span className="font-mono text-xs">
              {new Date(evidence.provenance.fromTimestamp * 1000).toLocaleString()} →{" "}
              {new Date(evidence.provenance.toTimestamp * 1000).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* File IDs */}
      <div>
        <div className="text-sm font-semibold mb-2">Evidence Files</div>
        <div className="space-y-1">
          {evidenceFileIds.map((fileId, index) => (
            <div key={index} className="bg-base-200 rounded px-3 py-2 text-xs font-mono">
              {fileId}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
