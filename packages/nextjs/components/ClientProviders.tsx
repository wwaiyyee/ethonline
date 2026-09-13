"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";

// Dynamically import wallet providers to prevent SSR issues with WalletConnect modal
const ScaffoldHbarAppWithProviders = dynamic(
  () =>
    import("~~/components/ScaffoldHbarAppWithProviders").then(mod => ({
      default: mod.ScaffoldHbarAppWithProviders,
    })),
  { ssr: false },
);

export function ClientProviders({ children }: { children: ReactNode }) {
  return <ScaffoldHbarAppWithProviders>{children}</ScaffoldHbarAppWithProviders>;
}
