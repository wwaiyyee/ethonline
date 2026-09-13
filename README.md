# EdGraph — Autonomous Stablecoin Depeg Coverage on Hedera

EdGraph is an autonomous stablecoin depeg coverage system built for **ETHOnline 2026**. It continuously monitors DEX prices via **The Graph**, purchases cryptographic evidence through **x402** micropayments on **Hedera**, evaluates claims with a deterministic policy engine, and records the full audit trail on-chain.

Built on [Scaffold-HBAR](https://docs.hedera.com/solutions/tools/scaffold-hbar/index) with the [x402 pay-per-use](https://x402.org/) template.

## How It Works

1. **Policy Creation** — A DAO connects HashPack and creates a coverage policy on-chain via the `PolicyRegistry` smart contract. Policy terms (stablecoin, threshold, duration, payout, evidence budget) are stored immutably on Hedera testnet.

2. **Real-Time Monitoring** — The EdGraph monitor queries The Graph's Uniswap V3 USDC/WETH subgraph on Ethereum every 60 seconds, storing price observations with full provenance (source block, subgraph deployment ID, query timestamp).

3. **Autonomous Claim Detection** — A candidate detector analyzes accumulated observations using a sliding window. When price stays below the policy's threshold for the required duration with no data gaps, a claim is created automatically.

4. **AI Risk Assessment** — The AI claims agent (Gemini or Claude) reads a live Graph risk snapshot and makes a cost-benefit decision: is the evidence worth buying? The agent controls a capped HBAR budget and can only spend it on evidence purchases.

5. **x402 Evidence Purchase** — If the AI decides to investigate, it calls the evidence API which returns HTTP 402. The agent signs a partial HBAR transfer, the Blocky402 facilitator co-signs and settles on Hedera, and the API releases the cryptographic evidence report.

6. **Deterministic Evaluation** — A rule-based policy engine evaluates the evidence against on-chain terms — same inputs always produce the same output, no LLM in the loop. The agent writes the resolution on-chain, closing the audit trail.

## Architecture

The system has three trust boundaries:

- **Hedera** — settlement layer. Holds the `PolicyRegistry` and `FileRegistry` contracts, settles all HBAR payments.
- **The Graph** — observation layer. Provides verifiable Ethereum market data with provenance metadata.
- **Application server** — coordination layer. Runs the monitor, detector, AI agent, and policy engine, but cannot approve claims or move funds beyond the agent's capped budget.

The AI agent and the policy engine are deliberately separated. The agent decides *when* to spend; the engine decides *if* the claim is valid. The x402 partial-signing pattern enforces this cryptographically — neither the agent nor the facilitator can act alone.

## Prerequisites

- [Node.js](https://nodejs.org/) ≥ 20.18.3 (LTS)
- Yarn via Corepack: `corepack enable && corepack prepare yarn@stable --activate`
- [Git](https://git-scm.com/)
- [Docker](https://docs.docker.com/get-docker/) + Docker Compose (MinIO + facilitator)
- A funded **ECDSA** Hedera testnet account for contract deploy and facilitator fee-payer

## Quick Start

```bash
# 1. Install dependencies
yarn install

# 2. Copy environment files
cp .env.example .env
cp packages/nextjs/.env.example packages/nextjs/.env

# 3. Configure root .env
#    - FACILITATOR_ACCOUNT_ID + FACILITATOR_PRIVATE_KEY (funded ECDSA account)

# 4. Configure packages/nextjs/.env
#    - NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID (WalletConnect / HashPack)
#    - GEMINI_API_KEY (for AI claims agent)
#    - EDGRAPH_AGENT_ACCOUNT_ID + EDGRAPH_AGENT_PRIVATE_KEY (agent's Hedera account)

# 5. Deploy contracts to Hedera testnet
yarn hardhat:account:generate
yarn hardhat:deploy --network hederaTestnet

# 6. Start local infra + app + monitor
yarn infra:up     # MinIO :9000/:9001, facilitator :4020
yarn dev          # Next.js :3000 + EdGraph monitor (concurrent)

# 7. Connect HashPack → create policies → monitor detects and processes claims
```

## Environment Variables

### Root `.env`

| Variable | Purpose |
|----------|---------|
| `FACILITATOR_ACCOUNT_ID` | Funded ECDSA fee-payer account |
| `FACILITATOR_PRIVATE_KEY` | Fee-payer private key (facilitator only) |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | MinIO credentials |
| `S3_BUCKET` | Bucket name (default: `x402-files`) |
| `X402_NETWORK` | `hedera:testnet` |

### `packages/nextjs/.env`

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | HashPack / Reown |
| `FACILITATOR_URL` | Default `http://localhost:4020` |
| `GEMINI_API_KEY` | Google Gemini API key (AI agent) |
| `AI_PROVIDER` | `GEMINI` (default) or `CLAUDE` |
| `ANTHROPIC_API_KEY` | Anthropic key (if using Claude) |
| `EDGRAPH_AGENT_ACCOUNT_ID` | Agent's Hedera account for x402 payments |
| `EDGRAPH_AGENT_PRIVATE_KEY` | Agent's ECDSA private key |
| `EDGRAPH_AGENT_HBAR_BUDGET_TINYBAR` | Evidence budget cap (default: 1,000,000) |
| `EDGRAPH_EVIDENCE_API_URL` | Evidence API endpoint |
| `HEDERA_RPC_URL` | Hedera JSON-RPC for contract reads |
| `S3_ENDPOINT` / `S3_BUCKET` / `S3_*` | MinIO client config |

See [`.env.example`](.env.example) and [`packages/nextjs/.env.example`](packages/nextjs/.env.example) for full templates.

## Commands

| Command | Purpose |
|---------|---------|
| `yarn dev` | Start Next.js + EdGraph monitor concurrently |
| `yarn infra:up` / `yarn infra:down` | Start or stop MinIO + facilitator |
| `yarn infra:logs` | Follow Docker container logs |
| `yarn hardhat:deploy --network hederaTestnet` | Deploy contracts |
| `yarn hardhat:test` | Run contract tests |
| `yarn x402:buy` | CLI agent buyer script |
| `yarn edgraph:monitor` | Run EdGraph monitor standalone |
| `yarn edgraph:agent` | Run claims agent standalone |

## Project Layout

```
├── packages/hardhat/
│   └── contracts/
│       ├── FileRegistry.sol          # x402 file marketplace (evidence storage)
│       └── PolicyRegistry.sol        # On-chain coverage policy terms
├── packages/nextjs/
│   ├── app/
│   │   ├── page.tsx                  # Home — hero + stats
│   │   ├── policies/                 # Create & browse coverage policies
│   │   ├── claims/                   # Claims dashboard + AI recommendations
│   │   └── edgraph/                  # Live Graph monitoring dashboard
│   ├── app/api/
│   │   ├── policies/                 # Policy CRUD API
│   │   ├── claims/                   # Claims API
│   │   ├── edgraph/                  # Monitor dashboard API
│   │   └── v1/depeg-evidence/        # x402-gated evidence API
│   ├── services/
│   │   ├── ai/                       # Gemini + Claude risk assessment & evaluation
│   │   ├── claims/                   # Agent, detector, repository
│   │   ├── graph/                    # The Graph queries + monitor
│   │   ├── policy/                   # Policy engine + evidence generator
│   │   ├── db/                       # SQLite client + migrations
│   │   └── x402/                     # x402 client, server, wallet signer
│   └── scripts/
│       ├── edgraph-monitor.ts        # Continuous monitoring loop
│       ├── claims-agent-demo.ts      # 5-phase agent workflow demo
│       ├── create-depeg-scenario.ts  # Seed depeg test data
│       └── process-all-claims.ts     # Batch process all claims
├── facilitator/                      # Self-hosted x402 Hedera facilitator
└── docker-compose.yml                # MinIO + facilitator
```

## Claims Processing Pipeline

```
Policy Created (on-chain)
    ↓
Monitor queries The Graph every 60s
    ↓
Candidate Detector finds threshold breach
    ↓
POTENTIAL_CLAIM created
    ↓
AI Agent: SNAPSHOT → DECIDE
    ├── Low risk → SKIP_EVIDENCE → INVESTIGATING_COMPLETE
    └── High risk → BUY_EVIDENCE
                        ↓
                   x402 Payment (HBAR)
                        ↓
                   Evidence Report returned
                        ↓
                   Policy Engine evaluates
                        ↓
              ELIGIBLE_RECOMMENDATION
                   or INELIGIBLE
```

## Smart Contracts

### PolicyRegistry

Stores coverage policy terms on Hedera testnet. Key functions:

- `createPolicy(...)` → registers policy terms, returns `policyId`
- `getPolicy(policyId)` → read policy terms
- `getPolicies(offset, limit)` → paginated listing
- `resolvePolicy(policyId, resolutionHash)` → mark claim resolved with audit hash

### FileRegistry

x402 file marketplace for evidence storage. Inherited from the scaffold-hbar template.

- `registerFile(...)` → register evidence file metadata
- `getFiles(offset, limit)` → paginated listing

Both contracts are deployed via `yarn hardhat:deploy --network hederaTestnet`. ABIs and addresses auto-populate `packages/nextjs/contracts/deployedContracts.ts`.

## Caveats

- **HashPack only** — uses Reown AppKit with the native `hedera` WalletConnect namespace. MetaMask is not supported.
- **ECDSA accounts** — buyers, agent, and facilitator must use ECDSA keys (not ED25519).
- **Testnet** — MinIO and facilitator run locally; payments settle on Hedera testnet.
- **Hedera JSON-RPC log limits** — `eth_getLogs` capped to 7 days; the app uses `getPolicies`/`getFiles` pagination instead.
- **Experimental** — contracts and tooling are not audited. Use testnet and small amounts only.

## Links

- [x402](https://x402.org/)
- [The Graph](https://thegraph.com/)
- [Hedera Documentation](https://docs.hedera.com/)
- [HashScan](https://hashscan.io/) — block explorer
- [Hedera Portal Faucet](https://portal.hedera.com/faucet)
- [Scaffold-HBAR](https://github.com/hedera-dev/create-scaffold-hbar)
