import { getPolicyRegistryHederaContractId } from "~~/contracts/policyRegistryAbi";
import scaffoldConfig from "~~/scaffold.config";
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
      return <div className="badge badge-neutral badge-lg">Resolved</div>;
    }
    if (policy.active) {
      const now = Math.floor(Date.now() / 1000);
      if (now < policy.coverageStart) {
        return <div className="badge badge-info badge-lg">Upcoming</div>;
      }
      if (now > policy.coverageEnd) {
        return <div className="badge badge-warning badge-lg">Expired</div>;
      }
      return <div className="badge badge-success badge-lg">Active</div>;
    }
    return <div className="badge badge-ghost badge-lg">Inactive</div>;
  };

  const getStatusIcon = () => {
    if (policy.resolved) return "🏁";
    if (policy.active) {
      const now = Math.floor(Date.now() / 1000);
      if (now < policy.coverageStart) return "⏳";
      if (now > policy.coverageEnd) return "⏰";
      return "✅";
    }
    return "⏸️";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getExplorerUrl = (address: string) => {
    const chain = policy.dataChainId.toLowerCase();
    const explorers: Record<string, string> = {
      base: "https://basescan.org",
      ethereum: "https://etherscan.io",
      eth: "https://etherscan.io",
      mainnet: "https://etherscan.io",
      arbitrum: "https://arbiscan.io",
      optimism: "https://optimistic.etherscan.io",
      polygon: "https://polygonscan.com",
    };
    const explorerBase = explorers[chain] || "https://basescan.org";
    return `${explorerBase}/address/${address}`;
  };

  const getChainDisplayName = () => {
    const chain = policy.dataChainId.toLowerCase();
    const names: Record<string, string> = {
      base: "Base",
      ethereum: "Ethereum",
      eth: "Ethereum",
      mainnet: "Ethereum",
      arbitrum: "Arbitrum",
      optimism: "Optimism",
      polygon: "Polygon",
    };
    return names[chain] || policy.dataChainId;
  };

  const getChainIcon = () => {
    const chain = policy.dataChainId.toLowerCase();
    const icons: Record<string, string> = {
      base: "🔵",
      ethereum: "♦️",
      eth: "♦️",
      mainnet: "♦️",
      arbitrum: "🔷",
      optimism: "🔴",
      polygon: "🟣",
    };
    return icons[chain] || "⛓️";
  };

  return (
    <div className="card bg-base-100 border border-base-300 shadow-lg hover:shadow-xl transition-all h-full">
      <div className="card-body p-6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getStatusIcon()}</span>
            <div>
              <h3 className="text-xl font-bold">{policy.policyholder}</h3>
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <span>{getChainIcon()}</span>
                <span>{getChainDisplayName()}</span>
              </div>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Stablecoin Info */}
        <div className="bg-base-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-base-content/70">Protected Asset:</span>
            <span className="text-lg font-bold">{policy.stablecoinSymbol}</span>
          </div>
          <div
            className="text-xs font-mono bg-base-300 px-2 py-1 rounded cursor-pointer hover:bg-base-content/10 transition-colors"
            onClick={() => copyToClipboard(policy.stablecoinAddress)}
            title="Click to copy address"
          >
            {policy.stablecoinAddress.slice(0, 10)}...{policy.stablecoinAddress.slice(-8)}
          </div>
        </div>

        {/* Policy Terms Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-base-200 rounded-lg p-3">
            <div className="text-xs text-base-content/60 mb-1">Threshold</div>
            <div className="text-lg font-bold font-mono">{(policy.thresholdBps / 100).toFixed(2)}%</div>
          </div>

          <div className="bg-base-200 rounded-lg p-3">
            <div className="text-xs text-base-content/60 mb-1">Min Duration</div>
            <div className="text-lg font-bold">{policy.minimumDurationMinutes} min</div>
          </div>

          <div className="bg-base-200 rounded-lg p-3 col-span-2">
            <div className="text-xs text-base-content/60 mb-1">Payout Amount</div>
            <div className="text-xl font-bold font-mono">
              {formatAmount(policy.payoutAmountBaseUnits)} {policy.payoutTokenSymbol}
            </div>
          </div>

          <div className="bg-base-200 rounded-lg p-3 col-span-2">
            <div className="text-xs text-base-content/60 mb-1">Evidence Budget</div>
            <div className="text-sm font-mono">{formatAmount(policy.maxEvidenceBudgetTinybar, 8)} HBAR</div>
          </div>
        </div>

        {/* Coverage Period */}
        <div className="mb-4 pb-4 border-b border-base-300">
          <div className="text-xs text-base-content/60 mb-2">Coverage Period:</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-mono bg-base-200 px-2 py-1 rounded">{formatDate(policy.coverageStart)}</span>
            <span className="text-base-content/40">→</span>
            <span className="font-mono bg-base-200 px-2 py-1 rounded">{formatDate(policy.coverageEnd)}</span>
          </div>
        </div>

        {/* Policy ID */}
        <div className="mb-4">
          <div className="text-xs text-base-content/60 mb-1">Policy ID:</div>
          <div
            className="text-xs font-mono bg-base-200 px-3 py-2 rounded cursor-pointer hover:bg-base-300 transition-colors break-all"
            onClick={() => copyToClipboard(policy.policyId)}
            title="Click to copy"
          >
            {policy.policyId}
          </div>
        </div>

        {/* Actions - pushed to bottom */}
        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-base-300">
          <a
            href={getExplorerUrl(policy.stablecoinAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-ghost flex-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Token
          </a>
          <a
            href={`https://hashscan.io/testnet/contract/${getPolicyRegistryHederaContractId(scaffoldConfig.targetNetworks[0].id)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-primary flex-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Contract
          </a>
        </div>
      </div>
    </div>
  );
}
