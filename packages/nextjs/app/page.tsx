"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HederaPortalFaucet } from "@scaffold-hbar-ui/components";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ClipboardDocumentListIcon, DocumentTextIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { HederaAddress } from "~~/components/scaffold-hbar";
import { useTargetNetwork } from "~~/hooks/scaffold-hbar";

const Home: NextPage = () => {
  const { address: connectedAddress, status } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const [stats, setStats] = useState({ policies: 0, claims: 0 });

  const isReconnecting = status === "reconnecting" || status === "connecting";
  const isConnected = status === "connected" && connectedAddress;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [policiesRes, claimsRes] = await Promise.all([fetch("/api/policies"), fetch("/api/claims")]);
        const [policiesData, claimsData] = await Promise.all([policiesRes.json(), claimsRes.json()]);
        setStats({
          policies: policiesData.total || 0,
          claims: claimsData.total || 0,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      <div className="flex items-center flex-col grow">
        {/* Hero Section */}
        <div className="hedera-gradient dark:bg-none dark:bg-hedera-charcoal w-full py-20 px-5">
          <div className="flex flex-col items-center max-w-4xl mx-auto">
            <Image
              src="/Hedera-Icon-White.svg"
              alt="Hedera icon"
              width={100}
              height={100}
              className="mb-8 hidden dark:block"
            />
            <Image
              src="/Hedera-Icon-Dark.svg"
              alt="Hedera icon"
              width={100}
              height={100}
              className="mb-8 dark:hidden"
            />
            <div className="flex flex-col items-center gap-2 mb-6 text-center">
              <span className="block text-5xl md:text-6xl font-bold text-white mb-3">EdGraph</span>
              <span className="block text-xl md:text-2xl font-medium tracking-wide text-white/90 mb-2">
                Stablecoin Depeg Coverage on Hedera
              </span>
              <p className="text-white/80 text-base md:text-lg max-w-2xl leading-relaxed">
                Autonomous detection, cryptographic evidence, and transparent claim processing powered by EdGraph
                monitoring and x402 pay-per-use proofs
              </p>
            </div>

            {/* Stats Bar */}
            <div className="flex gap-6 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 text-center">
                <div className="text-3xl font-bold text-white">{stats.policies}</div>
                <div className="text-sm text-white/80">Active Policies</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 text-center">
                <div className="text-3xl font-bold text-white">{stats.claims}</div>
                <div className="text-sm text-white/80">Claims Detected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Status Card */}
        <div className="w-full max-w-5xl mx-auto px-5 -mt-10">
          <div className="bg-base-100 rounded-2xl shadow-xl p-8 border border-base-300">
            {isReconnecting ? (
              <div className="flex flex-col items-center gap-2">
                <p className="font-semibold text-sm text-base-content/60 uppercase tracking-wider m-0">Connecting</p>
                <div className="h-8 w-48 rounded bg-base-200 animate-pulse" aria-hidden />
              </div>
            ) : isConnected ? (
              <div className="flex flex-col items-center gap-2">
                <p className="font-semibold text-sm text-base-content/60 uppercase tracking-wider m-0">
                  Connected Address
                </p>
                <HederaAddress address={connectedAddress} chain={targetNetwork} />
                <p className="text-xs text-base-content/60 mt-2">Ready to create policies and manage claims</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <ShieldCheckIcon className="w-16 h-16 text-primary/60" />
                <p className="font-semibold text-base text-base-content/80">Connect HashPack to get started</p>
                <p className="text-sm text-base-content/60">
                  Create coverage policies and track autonomous claim processing
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Actions */}
        <div className="w-full max-w-5xl mx-auto px-5 mt-12 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Policies Card */}
            <Link
              href="/policies"
              className="group bg-base-100 rounded-2xl shadow-lg p-8 text-center flex flex-col items-center hover:shadow-2xl hover:scale-105 transition-all border-2 border-base-300 hover:border-primary"
            >
              <div className="w-20 h-20 rounded-full hedera-gradient flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <DocumentTextIcon className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-bold text-2xl mb-3">Coverage Policies</h3>
              <p className="text-base-content/70 text-base leading-relaxed mb-6">
                Register and browse stablecoin depeg coverage policies on Hedera testnet with customizable triggers and
                payouts
              </p>
              <div className="btn btn-primary btn-wide">
                View {stats.policies} Policies
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Claims Card */}
            <Link
              href="/claims"
              className="group bg-base-100 rounded-2xl shadow-lg p-8 text-center flex flex-col items-center hover:shadow-2xl hover:scale-105 transition-all border-2 border-base-300 hover:border-primary"
            >
              <div className="w-20 h-20 rounded-full hedera-gradient flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ClipboardDocumentListIcon className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-bold text-2xl mb-3">Claims Dashboard</h3>
              <p className="text-base-content/70 text-base leading-relaxed mb-6">
                Track autonomous depeg detection, evidence collection via x402, and transparent claim evaluation
              </p>
              <div className="btn btn-primary btn-wide">
                View {stats.claims} Claims
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="bg-base-100 rounded-2xl shadow-lg p-8 border border-base-300 mb-12">
            <h3 className="font-bold text-2xl mb-6 text-center">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔍</span>
                </div>
                <h4 className="font-bold mb-2">Autonomous Detection</h4>
                <p className="text-sm text-base-content/70">
                  EdGraph monitors stablecoin prices 24/7 and automatically detects depeg events matching policy terms
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📦</span>
                </div>
                <h4 className="font-bold mb-2">Cryptographic Evidence</h4>
                <p className="text-sm text-base-content/70">
                  Evidence files are purchased via x402 pay-per-use protocol and stored privately with on-chain payment
                  proofs
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">⚖️</span>
                </div>
                <h4 className="font-bold mb-2">Transparent Evaluation</h4>
                <p className="text-sm text-base-content/70">
                  Agent evaluates claims against policy terms and recommends outcomes with confidence scores and
                  reasoning
                </p>
              </div>
            </div>
          </div>

          {/* Quick Start Guide */}
          <div className="bg-base-100 rounded-2xl shadow-lg p-8 border border-base-300">
            <h3 className="font-bold text-2xl mb-6 text-center">Quick Start</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full hedera-gradient flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">1</span>
                </div>
                <div>
                  <p className="font-bold mb-1">Start local infrastructure</p>
                  <code className="text-xs bg-base-200 px-3 py-1.5 rounded block">yarn infra:up</code>
                  <p className="text-xs text-base-content/60 mt-1">MinIO storage + x402 facilitator</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full hedera-gradient flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">2</span>
                </div>
                <div>
                  <p className="font-bold mb-1">Deploy PolicyRegistry contract</p>
                  <code className="text-xs bg-base-200 px-3 py-1.5 rounded block">
                    yarn hardhat:deploy --network hederaTestnet
                  </code>
                  <p className="text-xs text-base-content/60 mt-1">Deploys to Hedera testnet</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full hedera-gradient flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">3</span>
                </div>
                <div>
                  <p className="font-bold mb-1">Get testnet HBAR</p>
                  <HederaPortalFaucet variant="link" label="portal.hedera.com/faucet" showIcon={false} />
                  <p className="text-xs text-base-content/60 mt-1">Fund your HashPack wallet</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full hedera-gradient flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">4</span>
                </div>
                <div>
                  <p className="font-bold mb-1">Launch the application</p>
                  <code className="text-xs bg-base-200 px-3 py-1.5 rounded block">yarn next:dev</code>
                  <p className="text-xs text-base-content/60 mt-1">Access at localhost:3000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
