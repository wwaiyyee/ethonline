"use client";

import { useState } from "react";
import { useHederaWalletConnect } from "~~/services/web3/hederaWalletConnect";
import { writeContractViaNativeProvider, waitForHederaTransaction } from "~~/services/web3/hederaContractWrite";
import { POLICY_REGISTRY_ABI, getPolicyRegistryAddress } from "~~/contracts/policyRegistryAbi";
import scaffoldConfig from "~~/scaffold.config";
import { notification } from "~~/utils/scaffold-hbar";

interface PolicyFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PolicyForm({ onSuccess, onCancel }: PolicyFormProps) {
  const walletContext = useHederaWalletConnect();
  const targetNetwork = scaffoldConfig.targetNetworks[0];

  // Ensure we have the latest wallet state
  const isConnected = walletContext?.isConnected ?? false;
  const accountId = walletContext?.accountId ?? null;
  const isInitializing = walletContext?.isInitializing ?? true;
  const provider = walletContext?.provider;

  console.log("PolicyForm wallet state:", { isConnected, accountId, isInitializing });

  const [formData, setFormData] = useState({
    policyholder: "",
    dataChainId: "ethereum",
    stablecoinSymbol: "USDC",
    stablecoinAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    referencePoolAddress: "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640",
    thresholdBps: "9800",
    minimumDurationMinutes: "15",
    payoutAmountBaseUnits: "1000000000",
    payoutTokenSymbol: "HBAR",
    coverageStartDays: "0",
    coverageEndDays: "30",
    maxEvidenceBudgetTinybar: "500000000",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Detailed wallet check with explicit logging
    console.log("=== SUBMIT HANDLER ===");
    console.log("isConnected:", isConnected, "type:", typeof isConnected);
    console.log("accountId:", accountId, "type:", typeof accountId);
    console.log("!isConnected:", !isConnected);
    console.log("!accountId:", !accountId);
    console.log("Check result:", !isConnected || !accountId);

    if (!isConnected || !accountId) {
      console.error("FAILED: Wallet check failed!");
      setError("Wallet connection issue detected. Please close modal and try again.");
      return;
    }

    console.log("PASSED: Wallet check passed, proceeding...");
    setLoading(true);
    setError(null);

    try {
      const now = Math.floor(Date.now() / 1000);
      const coverageStart = now + parseInt(formData.coverageStartDays) * 86400;
      const coverageEnd = now + parseInt(formData.coverageEndDays) * 86400;

      const contractAddress = getPolicyRegistryAddress(targetNetwork.id);
      if (!contractAddress) {
        throw new Error("PolicyRegistry contract not deployed on this network");
      }

      if (!provider) {
        throw new Error("Hedera provider not available");
      }

      console.log("Calling createPolicy with Hedera native provider...");
      console.log("Contract EVM address:", contractAddress);
      console.log("Network:", targetNetwork.name, targetNetwork.id);

      // PolicyRegistry Hedera ID: 0.0.10443942
      const result = await writeContractViaNativeProvider({
        provider,
        hederaAccountId: accountId,
        chainId: targetNetwork.id,
        contractAddress: contractAddress,
        hederaContractId: "0.0.10443942", // Use Hedera ID directly
        abi: POLICY_REGISTRY_ABI,
        functionName: "createPolicy",
        fnArgs: [
          formData.policyholder,
          formData.dataChainId,
          formData.stablecoinSymbol,
          formData.stablecoinAddress as `0x${string}`,
          formData.referencePoolAddress as `0x${string}`,
          BigInt(formData.thresholdBps),
          BigInt(formData.minimumDurationMinutes),
          BigInt(formData.payoutAmountBaseUnits),
          formData.payoutTokenSymbol,
          BigInt(coverageStart),
          BigInt(coverageEnd),
          BigInt(formData.maxEvidenceBudgetTinybar),
        ],
      });

      console.log("Transaction submitted:", result.transactionId);
      notification.success(`Transaction submitted: ${result.transactionId}`);

      // Wait for transaction to be processed
      console.log("Waiting for transaction confirmation...");
      await waitForHederaTransaction(result.transactionId, targetNetwork.id);

      notification.success("Policy created successfully!");
      onSuccess?.();
    } catch (err) {
      console.error("Policy creation failed:", err);
      setError(err instanceof Error ? err.message : "Transaction failed");
      notification.error(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
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
      )}

      {/* Policyholder */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Policyholder Name *</span>
        </label>
        <input
          type="text"
          name="policyholder"
          value={formData.policyholder}
          onChange={handleChange}
          placeholder="e.g., Acme DAO Treasury"
          className="input input-bordered"
          required
        />
      </div>

      {/* Data Chain (fixed) & Stablecoin */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Data Chain</span>
          </label>
          <input
            type="text"
            value="Ethereum (Uniswap V3)"
            className="input input-bordered bg-base-200"
            disabled
          />
          <input type="hidden" name="dataChainId" value="ethereum" />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Stablecoin *</span>
          </label>
          <select
            name="stablecoinSymbol"
            value={formData.stablecoinSymbol}
            onChange={handleChange}
            className="select select-bordered"
            required
          >
            <option value="USDC">USDC</option>
            <option value="USDT">USDT</option>
            <option value="DAI">DAI</option>
          </select>
        </div>
      </div>

      {/* Stablecoin Address */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Stablecoin Address *</span>
        </label>
        <input
          type="text"
          name="stablecoinAddress"
          value={formData.stablecoinAddress}
          onChange={handleChange}
          placeholder="0x..."
          className="input input-bordered font-mono text-sm"
          required
        />
      </div>

      {/* Reference Pool Address */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Uniswap V3 Pool Address *</span>
        </label>
        <input
          type="text"
          name="referencePoolAddress"
          value={formData.referencePoolAddress}
          onChange={handleChange}
          placeholder="0x..."
          className="input input-bordered font-mono text-sm"
          required
        />
        <label className="label">
          <span className="label-text-alt">Default: USDC/WETH 0.05% pool on Ethereum</span>
        </label>
      </div>

      {/* Threshold & Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Threshold (basis points) *</span>
          </label>
          <input
            type="number"
            name="thresholdBps"
            value={formData.thresholdBps}
            onChange={handleChange}
            placeholder="9800 = 98%"
            className="input input-bordered"
            min="1"
            max="10000"
            required
          />
          <label className="label">
            <span className="label-text-alt">9800 = 98%, 9900 = 99%</span>
          </label>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Min Duration (minutes) *</span>
          </label>
          <input
            type="number"
            name="minimumDurationMinutes"
            value={formData.minimumDurationMinutes}
            onChange={handleChange}
            placeholder="15"
            className="input input-bordered"
            min="1"
            required
          />
        </div>
      </div>

      {/* Payout */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Payout Amount *</span>
          </label>
          <input
            type="text"
            name="payoutAmountBaseUnits"
            value={formData.payoutAmountBaseUnits}
            onChange={handleChange}
            placeholder="1000000000"
            className="input input-bordered font-mono"
            required
          />
          <label className="label">
            <span className="label-text-alt">Base units (e.g., 1B = 10 HBAR)</span>
          </label>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Payout Token *</span>
          </label>
          <select
            name="payoutTokenSymbol"
            value={formData.payoutTokenSymbol}
            onChange={handleChange}
            className="select select-bordered"
            required
          >
            <option value="HBAR">HBAR</option>
            <option value="USDC">USDC</option>
            <option value="USDT">USDT</option>
          </select>
        </div>
      </div>

      {/* Coverage Period */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Start (days from now) *</span>
          </label>
          <input
            type="number"
            name="coverageStartDays"
            value={formData.coverageStartDays}
            onChange={handleChange}
            placeholder="0"
            className="input input-bordered"
            min="0"
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">End (days from now) *</span>
          </label>
          <input
            type="number"
            name="coverageEndDays"
            value={formData.coverageEndDays}
            onChange={handleChange}
            placeholder="30"
            className="input input-bordered"
            min="1"
            required
          />
        </div>
      </div>

      {/* Evidence Budget */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Evidence Budget (tinybars) *</span>
        </label>
        <input
          type="text"
          name="maxEvidenceBudgetTinybar"
          value={formData.maxEvidenceBudgetTinybar}
          onChange={handleChange}
          placeholder="500000000 = 5 HBAR"
          className="input input-bordered font-mono"
          required
        />
        <label className="label">
          <span className="label-text-alt">100000000 tinybars = 1 HBAR</span>
        </label>
      </div>

      {/* Actions */}
      <div className="modal-action">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading || !isConnected || isInitializing}>
          {loading ? (
            <>
              <span className="loading loading-spinner"></span>
              Creating...
            </>
          ) : isInitializing ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Initializing...
            </>
          ) : !isConnected ? (
            "Connect Wallet"
          ) : (
            "Create Policy"
          )}
        </button>
      </div>

      {/* Debug info */}
      {!isConnected && !isInitializing && (
        <div className="text-xs text-warning mt-2">
          Wallet connection: {isInitializing ? "initializing..." : isConnected ? "connected ✓" : "not connected"}
          {accountId && ` (${accountId})`}
        </div>
      )}
    </form>
  );
}
