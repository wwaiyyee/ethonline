import { useState } from "react";
import { ApprovalControls } from "./ApprovalControls";
import { BuyEvidenceButton } from "./BuyEvidenceButton";
import { EvidenceViewer } from "./EvidenceViewer";
import type { Claim } from "~~/services/policy/types";

interface ClaimCardProps {
  claim: Claim;
  onUpdate?: () => void;
}

export function ClaimCard({ claim, onUpdate }: ClaimCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (priceMicros: number) => {
    return `$${(priceMicros / 1_000_000).toFixed(4)}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      POTENTIAL_CLAIM: "badge-info",
      INVESTIGATING: "badge-warning",
      EVIDENCE_COLLECTED: "badge-primary",
      EVIDENCE_READY: "badge-primary",
      ELIGIBLE_RECOMMENDATION: "badge-success",
      INELIGIBLE_RECOMMENDATION: "badge-error",
      NEEDS_REVIEW: "badge-warning",
      APPROVED: "badge-success",
      REJECTED: "badge-error",
    };
    return colors[status] || "badge-ghost";
  };

  const getStatusLabel = (status: string) => {
    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      POTENTIAL_CLAIM: "🔍",
      INVESTIGATING: "🔎",
      EVIDENCE_COLLECTED: "📦",
      EVIDENCE_READY: "✅",
      ELIGIBLE_RECOMMENDATION: "👍",
      INELIGIBLE_RECOMMENDATION: "👎",
      NEEDS_REVIEW: "⚠️",
      APPROVED: "✓",
      REJECTED: "✗",
    };
    return icons[status] || "•";
  };

  const hasEvidence = claim.evidenceFileIds && claim.evidenceFileIds.length > 0;
  const needsApproval =
    claim.status === "ELIGIBLE_RECOMMENDATION" ||
    claim.status === "INELIGIBLE_RECOMMENDATION" ||
    claim.status === "NEEDS_REVIEW";
  const hasDecision = claim.decision && claim.decision.outcome;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="card bg-base-100 border border-base-300 shadow-lg hover:shadow-xl transition-all">
      <div className="card-body p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{getStatusIcon(claim.status)}</span>
              <div>
                <h3 className="text-lg font-bold">Depeg Detection</h3>
                <div
                  className="text-xs text-base-content/60 font-mono cursor-pointer hover:text-base-content/80"
                  onClick={() => copyToClipboard(claim.claimId)}
                  title="Click to copy"
                >
                  {claim.claimId.slice(0, 24)}...
                </div>
              </div>
            </div>
          </div>
          <div className={`badge badge-lg ${getStatusColor(claim.status)}`}>{getStatusLabel(claim.status)}</div>
        </div>

        {/* Policy Reference */}
        <div className="mb-4 pb-4 border-b border-base-300">
          <div className="text-xs text-base-content/60 mb-1">Policy ID:</div>
          <div
            className="text-sm font-mono bg-base-200 px-3 py-1.5 rounded cursor-pointer hover:bg-base-300 transition-colors inline-block"
            onClick={() => copyToClipboard(claim.policyId)}
            title="Click to copy"
          >
            {claim.policyId.slice(0, 20)}...{claim.policyId.slice(-8)}
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-base-200 rounded-lg p-3">
            <div className="text-xs text-base-content/60 mb-1">Lowest Price</div>
            <div className="text-lg font-bold font-mono">{formatPrice(claim.lowestPriceUsdMicros)}</div>
          </div>

          <div className="bg-base-200 rounded-lg p-3">
            <div className="text-xs text-base-content/60 mb-1">Duration</div>
            <div className="text-lg font-bold">{claim.durationMinutes} min</div>
          </div>

          <div className="bg-base-200 rounded-lg p-3">
            <div className="text-xs text-base-content/60 mb-1">Detected At</div>
            <div className="text-sm font-mono">{formatDate(claim.detectedAt)}</div>
          </div>

          <div className="bg-base-200 rounded-lg p-3">
            <div className="text-xs text-base-content/60 mb-1">Window</div>
            <div className="text-xs font-mono">
              {formatDate(claim.triggerWindowStart)}
              <div className="text-xs text-base-content/60">to</div>
              {formatDate(claim.triggerWindowEnd)}
            </div>
          </div>
        </div>

        {/* Decision Summary */}
        {hasDecision && (
          <div className="mb-4">
            <div className="bg-base-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold">Agent Decision:</span>
                <span
                  className={`badge ${claim.decision?.outcome.includes("ELIGIBLE") ? "badge-success" : "badge-error"}`}
                >
                  {claim.decision?.outcome.replace(/_/g, " ")}
                </span>
                {claim.decision?.confidence && (
                  <span className="badge badge-ghost">{claim.decision.confidence} Confidence</span>
                )}
              </div>
              {claim.decision?.reasoning && (
                <p className="text-sm text-base-content/80 leading-relaxed">{claim.decision.reasoning}</p>
              )}
            </div>
          </div>
        )}

        {/* Expandable Details */}
        {(claim.notes || hasEvidence || claim.lastAgentAction) && (
          <div className="mb-4">
            <button className="btn btn-sm btn-ghost w-full justify-between" onClick={() => setExpanded(!expanded)}>
              <span>{expanded ? "Hide" : "Show"} Details</span>
              <svg
                className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expanded && (
              <div className="mt-3 space-y-3">
                {claim.lastAgentAction && (
                  <div>
                    <div className="text-xs text-base-content/60 mb-1">Last Agent Action:</div>
                    <div className="text-sm bg-base-200 px-3 py-2 rounded">
                      {claim.lastAgentAction.replace(/_/g, " ")}
                    </div>
                  </div>
                )}

                {claim.notes && (
                  <div>
                    <div className="text-xs text-base-content/60 mb-1">Notes:</div>
                    <div className="text-sm bg-base-200 px-3 py-2 rounded leading-relaxed">{claim.notes}</div>
                  </div>
                )}

                {hasEvidence && (
                  <div>
                    <div className="text-xs text-base-content/60 mb-1">Evidence Files:</div>
                    <EvidenceViewer fileIds={claim.evidenceFileIds || []} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-base-300">
          {!hasEvidence && claim.status === "INVESTIGATING" && (
            <BuyEvidenceButton claimId={claim.claimId} onPurchased={onUpdate} />
          )}

          {needsApproval && <ApprovalControls claimId={claim.claimId} onApproved={onUpdate} />}

          {!needsApproval && !hasEvidence && (
            <div className="text-sm text-base-content/60 italic">
              Waiting for evidence collection or agent evaluation...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
