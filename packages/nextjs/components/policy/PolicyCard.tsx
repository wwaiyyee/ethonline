import type { PolicyTerms } from "~~/services/policy/types";

interface PolicyCardProps {
  policy: PolicyTerms;
}

export function PolicyCard({ policy }: PolicyCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAmount = (amount: string, decimals = 8) => {
    const num = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const whole = num / divisor;
    return whole.toString();
  };

  const getStatusBadge = () => {
    if (policy.resolved) {
      return <div className="badge badge-neutral">Resolved</div>;
    }
    if (policy.active) {
      const now = Math.floor(Date.now() / 1000);
      if (now < policy.coverageStart) {
        return <div className="badge badge-info">Upcoming</div>;
      }
      if (now > policy.coverageEnd) {
        return <div className="badge badge-warning">Expired</div>;
      }
      return <div className="badge badge-success">Active</div>;
    }
    return <div className="badge badge-ghost">Inactive</div>;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="card bg-base-100 border border-base-300 shadow-md hover:shadow-lg transition-shadow">
      <div className="card-body p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="card-title text-lg mb-1">{policy.policyholder}</h3>
            <div className="text-sm text-base-content/70">
              {policy.stablecoinSymbol} on {policy.dataChainId}
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Policy Details */}
        <div className="space-y-3">
          {/* Threshold */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-base-content/70">Threshold:</span>
            <span className="font-mono font-semibold">
              {(policy.thresholdBps / 100).toFixed(2)}%
            </span>
          </div>

          {/* Duration */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-base-content/70">Min Duration:</span>
            <span className="font-mono">{policy.minimumDurationMinutes} min</span>
          </div>

          {/* Payout */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-base-content/70">Payout:</span>
            <span className="font-mono font-semibold">
              {formatAmount(policy.payoutAmountBaseUnits)} {policy.payoutTokenSymbol}
            </span>
          </div>

          {/* Evidence Budget */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-base-content/70">Evidence Budget:</span>
            <span className="font-mono text-sm">
              {formatAmount(policy.maxEvidenceBudgetTinybar, 8)} HBAR
            </span>
          </div>

          <div className="divider my-2"></div>

          {/* Coverage Period */}
          <div>
            <div className="text-xs text-base-content/70 mb-1">Coverage Period:</div>
            <div className="text-sm font-mono">
              {formatDate(policy.coverageStart)} → {formatDate(policy.coverageEnd)}
            </div>
          </div>

          {/* Policy ID */}
          <div>
            <div className="text-xs text-base-content/70 mb-1">Policy ID:</div>
            <div
              className="text-xs font-mono bg-base-200 px-2 py-1 rounded cursor-pointer hover:bg-base-300 transition-colors"
              onClick={() => copyToClipboard(policy.policyId)}
              title="Click to copy"
            >
              {policy.policyId.slice(0, 10)}...{policy.policyId.slice(-8)}
            </div>
          </div>

          {/* Stablecoin Address */}
          <div>
            <div className="text-xs text-base-content/70 mb-1">Stablecoin:</div>
            <div
              className="text-xs font-mono bg-base-200 px-2 py-1 rounded cursor-pointer hover:bg-base-300 transition-colors"
              onClick={() => copyToClipboard(policy.stablecoinAddress)}
              title="Click to copy"
            >
              {policy.stablecoinAddress.slice(0, 6)}...{policy.stablecoinAddress.slice(-4)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="card-actions justify-end mt-4">
          <a
            href={`https://basescan.org/address/${policy.stablecoinAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-ghost"
          >
            View Token on Base
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
          <a
            href={`https://hashscan.io/testnet/contract/0.0.10443942`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-primary"
          >
            View Policy on Hedera
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
