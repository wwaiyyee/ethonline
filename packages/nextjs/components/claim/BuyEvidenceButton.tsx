"use client";

import { useState } from "react";

interface BuyEvidenceButtonProps {
  claimId: string;
  onPurchased?: () => void;
}

export function BuyEvidenceButton({ claimId, onPurchased }: BuyEvidenceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuyEvidence = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Request evidence (will return 402)
      const response = await fetch(`/api/v1/depeg-evidence?claimId=${claimId}`);

      if (response.status === 402) {
        // Parse payment requirements
        const paymentRequired = await response.json();

        // For now, show payment requirements to user
        // In production, this would trigger HashPack payment flow
        alert(
          `Payment Required:\n\n` +
            `Amount: ${paymentRequired.requirements[0].amount} tinybars\n` +
            `Pay To: ${paymentRequired.requirements[0].payTo}\n\n` +
            `Implementation needed: Integrate HashPack wallet to sign payment`,
        );

        setError("x402 payment flow needs HashPack integration");
        return;
      }

      if (response.ok) {
        // Evidence purchased successfully
        const data = await response.json();
        alert(`Evidence purchased successfully!\n\nTransaction: ${data.payment.transaction}`);
        onPurchased?.();
        return;
      }

      throw new Error(`Unexpected response: ${response.status}`);
    } catch (err) {
      console.error("Evidence purchase failed:", err);
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button className="btn btn-primary btn-sm" onClick={handleBuyEvidence} disabled={loading}>
        {loading ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            Processing...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Buy Evidence
          </>
        )}
      </button>

      {error && (
        <div className="text-xs text-error">
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
