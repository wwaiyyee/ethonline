"use client";

import { useState } from "react";
import {
  POLICY_REGISTRY_ABI,
  getPolicyRegistryAddress,
  getPolicyRegistryHederaContractId,
} from "~~/contracts/policyRegistryAbi";
import scaffoldConfig from "~~/scaffold.config";
import { waitForHederaTransaction, writeContractViaNativeProvider } from "~~/services/web3/hederaContractWrite";
import { useHederaWalletConnect } from "~~/services/web3/hederaWalletConnect";
import { notification } from "~~/utils/scaffold-hbar";

interface ApprovalControlsProps {
  claimId: string;
  policyId: string;
  onUpdate?: () => void;
}

export function ApprovalControls({ claimId, policyId, onUpdate }: ApprovalControlsProps) {
  const { accountId, isConnected, provider } = useHederaWalletConnect();
  const targetNetwork = scaffoldConfig.targetNetworks[0];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const handleApprove = async () => {
    if (!isConnected || !accountId) {
      setError("Please connect your wallet");
      return;
    }

    if (!confirm("Are you sure you want to approve this claim?")) return;

    setLoading(true);
    setError(null);

    try {
      // Generate resolution hash (in production, this would include full resolution data)
      const resolutionData = {
        claimId,
        decision: "APPROVED",
        notes,
        timestamp: Date.now(),
      };
      const resolutionHash = `0x${Buffer.from(JSON.stringify(resolutionData)).toString("hex").slice(0, 64).padEnd(64, "0")}`;

      const contractAddress = getPolicyRegistryAddress(targetNetwork.id);
      if (!contractAddress || !provider) {
        throw new Error("Contract or provider not available");
      }

      const hederaContractId = getPolicyRegistryHederaContractId(targetNetwork.id);
      if (!hederaContractId) {
        throw new Error("PolicyRegistry Hedera contract ID not found");
      }

      const result = await writeContractViaNativeProvider({
        provider,
        hederaAccountId: accountId,
        chainId: targetNetwork.id,
        contractAddress: contractAddress,
        hederaContractId: hederaContractId,
        abi: POLICY_REGISTRY_ABI,
        functionName: "resolvePolicy",
        fnArgs: [policyId as `0x${string}`, resolutionHash as `0x${string}`],
      });

      notification.success(`Transaction submitted: ${result.transactionId}`);
      await waitForHederaTransaction(result.transactionId, targetNetwork.id);
      notification.success("Claim approved successfully!");
      onUpdate?.();
    } catch (err) {
      console.error("Approval failed:", err);
      setError(err instanceof Error ? err.message : "Approval failed");
      notification.error(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!isConnected || !accountId) {
      setError("Please connect your wallet");
      return;
    }

    if (!confirm("Are you sure you want to reject this claim?")) return;

    setLoading(true);
    setError(null);

    try {
      // Generate resolution hash for rejection
      const resolutionData = {
        claimId,
        decision: "REJECTED",
        notes,
        timestamp: Date.now(),
      };
      const resolutionHash = `0x${Buffer.from(JSON.stringify(resolutionData)).toString("hex").slice(0, 64).padEnd(64, "0")}`;

      const contractAddress = getPolicyRegistryAddress(targetNetwork.id);
      if (!contractAddress || !provider) {
        throw new Error("Contract or provider not available");
      }

      const hederaContractId = getPolicyRegistryHederaContractId(targetNetwork.id);
      if (!hederaContractId) {
        throw new Error("PolicyRegistry Hedera contract ID not found");
      }

      const result = await writeContractViaNativeProvider({
        provider,
        hederaAccountId: accountId,
        chainId: targetNetwork.id,
        contractAddress: contractAddress,
        hederaContractId: hederaContractId,
        abi: POLICY_REGISTRY_ABI,
        functionName: "resolvePolicy",
        fnArgs: [policyId as `0x${string}`, resolutionHash as `0x${string}`],
      });

      notification.success(`Transaction submitted: ${result.transactionId}`);
      await waitForHederaTransaction(result.transactionId, targetNetwork.id);
      notification.success("Claim rejected successfully!");
      onUpdate?.();
    } catch (err) {
      console.error("Rejection failed:", err);
      setError(err instanceof Error ? err.message : "Rejection failed");
      notification.error(err instanceof Error ? err.message : "Rejection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="alert alert-error">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Notes Section */}
      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={showNotes}
            onChange={e => setShowNotes(e.target.checked)}
          />
          <span className="label-text">Add notes (optional)</span>
        </label>

        {showNotes && (
          <textarea
            className="textarea textarea-bordered mt-2"
            placeholder="Add notes about this decision..."
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button className="btn btn-success flex-1" onClick={handleApprove} disabled={loading || !isConnected}>
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve Claim
            </>
          )}
        </button>

        <button className="btn btn-error flex-1" onClick={handleReject} disabled={loading || !isConnected}>
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject Claim
            </>
          )}
        </button>
      </div>

      {!isConnected && (
        <div className="text-center text-sm text-base-content/70">Connect your wallet to approve or reject claims</div>
      )}
    </div>
  );
}
