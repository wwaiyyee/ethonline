import { useState } from "react";
import type { Claim } from "~~/services/policy/types";
import { BuyEvidenceButton } from "./BuyEvidenceButton";
import { EvidenceViewer } from "./EvidenceViewer";
import { ApprovalControls } from "./ApprovalControls";

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
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "badge-success";
      case "REJECTED":
        return "badge-error";
      case "ELIGIBLE_RECOMMENDATION":
        return "badge-info";
      case "INELIGIBLE_RECOMMENDATION":
        return "badge-warning";
      case "EVIDENCE_READY":
        return "badge-primary";
      case "INVESTIGATING":
        return "badge-secondary";
      case "NEEDS_REVIEW":
        return "badge-warning";
      default:
        return "badge-ghost";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const hasEvidence = claim.evidenceFileIds && claim.evidenceFileIds.length > 0;
  const needsApproval =
    claim.status === "ELIGIBLE_RECOMMENDATION" ||
    claim.status === "INELIGIBLE_RECOMMENDATION" ||
    claim.status === "NEEDS_REVIEW";

  return (
    <div className="card bg-base-100 border border-base-300 shadow-md">
      <div className="card-body p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="card-title text-lg">Claim {claim.claimId.slice(0, 8)}...</h3>
              <div className={`badge ${getStatusColor(claim.status)}`}>{getStatusLabel(claim.status)}</div>
            </div>
            <div className="text-sm text-base-content/70">Policy: {claim.policyId.slice(0, 10)}...</div>
          </div>

          <button className="btn btn-sm btn-ghost btn-circle" onClick={() => setExpanded(!expanded)}>
            <svg
              className={`w-5 h-5 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-base-content/70 mb-1">Detected At</div>
            <div className="text-sm font-mono">{formatDate(claim.detectedAt)}</div>
          </div>

          {claim.lowestPriceUsdMicros && (
            <div>
              <div className="text-xs text-base-content/70 mb-1">Lowest Price</div>
              <div className="text-sm font-mono">${(claim.lowestPriceUsdMicros / 1000000).toFixed(4)}</div>
            </div>
          )}

          {claim.durationMinutes && (
            <div>
              <div className="text-xs text-base-content/70 mb-1">Duration</div>
              <div className="text-sm font-mono">{claim.durationMinutes} min</div>
            </div>
          )}

          {claim.lastAgentAction && (
            <div>
              <div className="text-xs text-base-content/70 mb-1">Last Action</div>
              <div className="text-sm">{claim.lastAgentAction}</div>
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-base-300 space-y-4">
            {/* Evidence Section */}
            {hasEvidence ? (
              <div>
                <h4 className="font-semibold mb-2">Evidence</h4>
                <EvidenceViewer claimId={claim.claimId} evidenceFileIds={claim.evidenceFileIds!} />
              </div>
            ) : claim.status === "POTENTIAL_CLAIM" || claim.status === "INVESTIGATING" ? (
              <div className="alert alert-info">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <div className="font-semibold">Evidence Not Yet Purchased</div>
                  <div className="text-sm">Purchase evidence to verify this depeg claim</div>
                </div>
                <BuyEvidenceButton claimId={claim.claimId} onPurchased={onUpdate} />
              </div>
            ) : null}

            {/* Decision Section */}
            {claim.decision && (
              <div>
                <h4 className="font-semibold mb-2">Decision</h4>
                <div className="bg-base-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-base-content/70">Outcome:</span>
                      <span className="ml-2 font-semibold">{claim.decision.outcome}</span>
                    </div>
                    <div>
                      <span className="text-base-content/70">Confidence:</span>
                      <span className="ml-2 font-mono">{claim.decision.confidence}</span>
                    </div>
                    {claim.decision.recommendedPayoutAmountBaseUnits && (
                      <div>
                        <span className="text-base-content/70">Recommended Payout:</span>
                        <span className="ml-2 font-mono">{claim.decision.recommendedPayoutAmountBaseUnits}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-base-content/70">Evaluated:</span>
                      <span className="ml-2 text-xs">{formatDate(claim.decision.evaluatedAt)}</span>
                    </div>
                  </div>
                  {claim.decision.reasoning && (
                    <div className="mt-3 pt-3 border-t border-base-300">
                      <div className="text-xs text-base-content/70 mb-1">Reasoning:</div>
                      <div className="text-sm">{claim.decision.reasoning}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Approval Controls */}
            {needsApproval && !claim.approvedAt && !claim.rejectedAt && (
              <div>
                <h4 className="font-semibold mb-2">Operator Review</h4>
                <ApprovalControls claimId={claim.claimId} policyId={claim.policyId} onUpdate={onUpdate} />
              </div>
            )}

            {/* Resolution Info */}
            {claim.resolutionTransactionId && (
              <div className="alert alert-success">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <div className="font-semibold">Resolved On-Chain</div>
                  <div className="text-sm font-mono">{claim.resolutionTransactionId}</div>
                </div>
              </div>
            )}

            {/* Notes */}
            {claim.notes && (
              <div>
                <div className="text-xs text-base-content/70 mb-1">Notes:</div>
                <div className="text-sm bg-base-200 rounded p-3">{claim.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
