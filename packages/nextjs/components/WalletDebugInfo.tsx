"use client";

import { useState, useEffect } from "react";
import { useHederaWalletConnect } from "~~/services/web3/hederaWalletConnect";

export function WalletDebugInfo() {
  const walletState = useHederaWalletConnect();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Log wallet state changes
    console.log("=== Wallet State ===", {
      isConnected: walletState.isConnected,
      accountId: walletState.accountId,
      isInitializing: walletState.isInitializing,
      hasHederaSession: walletState.hasHederaSession,
      provider: walletState.provider ? "exists" : "null",
    });
  }, [walletState.isConnected, walletState.accountId, walletState.isInitializing]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        className="btn btn-sm btn-circle btn-ghost"
        onClick={() => setShow(!show)}
        title="Wallet Debug Info"
      >
        🔍
      </button>

      {show && (
        <div className="absolute bottom-12 right-0 bg-base-300 p-4 rounded-lg shadow-lg w-80 text-xs">
          <div className="font-bold mb-2">Wallet Debug Info</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>isConnected:</span>
              <span className={walletState.isConnected ? "text-success" : "text-error"}>
                {walletState.isConnected ? "✓ true" : "✗ false"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>accountId:</span>
              <span className="font-mono">{walletState.accountId || "null"}</span>
            </div>
            <div className="flex justify-between">
              <span>isInitializing:</span>
              <span>{walletState.isInitializing ? "true" : "false"}</span>
            </div>
            <div className="flex justify-between">
              <span>hasHederaSession:</span>
              <span>{walletState.hasHederaSession ? "true" : "false"}</span>
            </div>
            <div className="flex justify-between">
              <span>provider:</span>
              <span>{walletState.provider ? "exists" : "null"}</span>
            </div>
            <div className="flex justify-between">
              <span>isBusy:</span>
              <span>{walletState.isBusy ? "true" : "false"}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-base-content/20">
            <div className="text-xs text-base-content/70">
              {walletState.isConnected ? (
                <span className="text-success">✓ Wallet fully connected</span>
              ) : walletState.isInitializing ? (
                <span className="text-warning">⏳ Initializing...</span>
              ) : !walletState.accountId ? (
                <span className="text-error">✗ No account ID found</span>
              ) : (
                <span className="text-error">✗ AppKit not connected</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
