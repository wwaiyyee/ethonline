"use client";

import { useState } from "react";
import { PolicyForm } from "./PolicyForm";
import { useHederaWalletConnect } from "~~/services/web3/hederaWalletConnect";

interface CreatePolicyButtonProps {
  onCreated?: () => void;
}

export function CreatePolicyButton({ onCreated }: CreatePolicyButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected, accountId } = useHederaWalletConnect();

  const handleSuccess = () => {
    setIsModalOpen(false);
    onCreated?.();
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create Policy
      </button>

      {isModalOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Create Coverage Policy</h3>
              <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            {/* Show wallet warning if not connected */}
            {!isConnected && (
              <div className="alert alert-warning mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <div className="font-semibold">Wallet Not Connected</div>
                  <div className="text-sm">Please connect your HashPack wallet to create policies</div>
                </div>
                <button className="btn btn-sm" onClick={() => setIsModalOpen(false)}>
                  Close
                </button>
              </div>
            )}

            {/* Show account info if connected */}
            {isConnected && accountId && (
              <div className="alert alert-success mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm">
                  Connected: <span className="font-mono">{accountId}</span>
                </div>
              </div>
            )}

            <PolicyForm onSuccess={handleSuccess} onCancel={() => setIsModalOpen(false)} />
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </>
  );
}
