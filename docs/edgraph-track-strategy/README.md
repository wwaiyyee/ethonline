# EdGraph Track Strategy

> Yes. This PDF is now the authoritative standard for EdGraph. It changes several requirements from the earlier plan, especially for live Graph data, hosted Bazantic integration, public x402 deployment, and demo length.

Source document: `screencapture-ethglobal-events-ethonline2026-prizes-2026-09-08-23_56_42.pdf`

## Final Track Strategy

### 1. The Graph

**Target:**

> Best AI Tooling or AI Use Case with The Graph (From Scratch)

EdGraph qualifies because it is a new project and uses The Graph as a load-bearing source of live blockchain data.

**Mandatory requirements:**

- Use live Subgraph data from a Graph provider.
- Do not rely only on mocked, local, or static data.
- Use Graph data for meaningful reasoning, decisions, and automation.
- Make the Graph integration reusable through the Evidence API and Graph service layer.
- Publish the code in a public GitHub repository.
- Include a clear README.
- Provide a 2-to-4-minute demo video.

### 2. Hedera

**Target:**

> AI & Agentic Payments on Hedera

**Mandatory requirements:**

- Host a live x402-gated service.
- Use Hedera testnet or mainnet.
- Settle payments through the Blocky402 facilitator.
- Complete at least one real paid request from start to finish.
- Provide a public repository and README.
- Show the payment flow in a video of five minutes or less.

EdGraph's paid Evidence API satisfies this requirement.

### 3. Bazantic

**Target both:**

- `Agentify a new API`
- `Best Recipe that uses ETHGlobal Hackathon Sponsor APIs`

**Mandatory requirements:**

- Create a Bazantic account.
- Create an x402 or MCP Gateway.
- Publish a Recipe.
- Make the Recipe explain when, why, and how to use the service.
- Use EdGraph's new Evidence API in a real agent workflow.
- Use The Graph as the second service in the same workflow.
- Make the final result depend on both services.
- Show the complete workflow in a screen recording.
- Include the Bazantic account username in the submission.

The local YAML Recipe is useful for development, but it is not enough for the final submission. The hosted Bazantic Gateway and Recipe must be demonstrated.

Do not target `Help an Agent Use Your Hackathon Project` unless your project is officially classified as a Continuity project. The PDF marks that prize as Continuity-only.

## Corrected EdGraph Product

EdGraph is a testnet stablecoin coverage operations agent.

A DAO creates a demo coverage policy for USDC. EdGraph monitors a live Base Uniswap pool through The Graph. If the price remains below `$0.98` for 30 continuous minutes, EdGraph opens a potential claim.

The claims agent then:

1. Reads live Graph-based observations.
2. Decides whether deeper evidence is worth buying.
3. Discovers the Evidence API through Bazantic.
4. Receives HTTP `402 Payment Required`.
5. Pays testnet HBAR through x402 and Blocky402.
6. Receives a deeper Graph-based evidence report.
7. Sends the report to the deterministic policy engine.
8. Recommends a simulated payout.
9. Waits for DAO operator approval.

No real insurance payout is executed.

## Important Changes to the Previous Plan

### Change 1: Live Graph Data Is Mandatory

Historical replay can still be used for a reliable demo, but it cannot be the only Graph implementation.

The final system must show:

```text
Live Graph provider
    -> Real swap and pool data
    -> Price and liquidity calculations
    -> Monitoring decision
    -> Agent reasoning
```

The replay mode should use either:

- A historical window queried from the live Graph provider, or
- A clearly labeled recorded Graph response.

The dashboard must clearly distinguish:

```text
LIVE GRAPH DATA
REPLAY DATA
```

Do not present hard-coded values as live Graph data.

### Change 2: The AI Agent Must Visibly Use Graph Data

The agent should receive a live Graph-derived risk snapshot before deciding to purchase evidence.

Add a reusable function such as:

```text
queryPoolRiskSnapshot()
```

**Suggested file:**

```text
packages/nextjs/services/graph/agentTool.ts
```

The snapshot should contain:

- Current price
- Recent price movement
- Liquidity change
- Swap volume
- Observation timestamps
- Graph deployment identifier
- Block range
- Query provenance

The agent's decision should be based on this information.

### Change 3: Bazantic Must Be Hosted

The final flow must be:

```text
Agent
    -> Bazantic Gateway or Recipe
    -> Live Graph service
    -> EdGraph Evidence API
    -> HTTP 402
    -> HBAR payment
    -> Evidence report
```

**Required files and evidence:**

```text
bazantic/edgraph-evidence.recipe.yaml
packages/nextjs/services/bazantic/recipe.ts
docs/bazantic.md
docs/bazantic-proof/
```

`docs/bazantic.md` should contain:

- Bazantic account username
- Gateway URL or identifier
- Recipe URL
- Request example
- Response example
- Payment configuration
- Screen recording instructions

For the `Agentify a new API` prize, document that the EdGraph Evidence API was not already available in Bazantic or from another sponsor when the event began.

### Change 4: The x402 Service Must Be Publicly Reachable

Localhost is acceptable during development.

For submission, deploy the Evidence API to a public URL:

```text
https://api.edgraph.example/v1/depeg-evidence
```

Possible hosting options:

- A small VPS
- Render with persistent storage
- Railway with persistent storage
- Fly.io
- Another public Docker host

SQLite is still acceptable if the deployment has a persistent disk.

The public service must complete this real flow:

```text
POST Evidence API
    -> 402 response
    -> HBAR payment
    -> Blocky402 settlement
    -> Retry request
    -> Evidence response
```

Add a health endpoint:

```text
packages/nextjs/app/api/health/route.ts
```

## Updated Architecture

The architecture diagram contains these components and connections:

- DAO treasury wallet -> EdGraph dashboard
- EdGraph dashboard -> DAO approval API
- EdGraph dashboard -> Claims API
- EdGraph dashboard -> Policy API
- DAO approval API -> SQLite
- Claims API -> SQLite
- Policy API -> SQLite
- Monitoring worker -> Candidate detector
- Monitoring worker -> Live The Graph provider
- Candidate detector -> SQLite
- Live The Graph provider -> SQLite
- AI claims agent -> Bazantic Gateway and Recipe
- Bazantic Gateway and Recipe -> EdGraph Evidence API
- Bazantic Gateway and Recipe -> Live The Graph provider
- Deterministic policy engine -> EdGraph Evidence API
- Deterministic policy engine -> SQLite
- EdGraph Evidence API -> SQLite
- EdGraph Evidence API -> x402 payment server
- x402 payment server -> Blocky402 facilitator
- Blocky402 facilitator -> Hedera testnet
- Policy API -> PolicyRegistry on Hedera
- PolicyRegistry on Hedera -> Hedera testnet

## Network Meaning

```text
Base:
    USDC pool
    Uniswap activity
    The Graph market data

Hedera:
    PolicyRegistry contract
    HBAR payment settlement
    HashPack transactions
    HashScan receipts

Public backend:
    Evidence API
    Monitoring worker
    Claims agent
    SQLite audit records
```

There is no token bridge in this MVP.

Base is the observation chain. Hedera is the policy and payment chain.

## Updated System Workflow

1. DAO connects HashPack.
2. DAO creates a demo policy.
3. PolicyRegistry stores the policy on Hedera.
4. Backend reads the policy back from Hedera.
5. Backend mirrors the policy into SQLite.
6. Monitoring worker queries live Graph data every minute.
7. Worker calculates price and liquidity.
8. Worker stores an observation.
9. Detector checks threshold, duration, freshness, and data gaps.
10. A potential claim is created.
11. AI agent reads the live Graph-derived risk snapshot.
12. Agent decides whether evidence spending is justified.
13. Agent discovers the services through Bazantic.
14. Agent calls the Evidence API.
15. Evidence API returns HTTP `402`.
16. Agent signs and pays HBAR.
17. Blocky402 verifies and settles the payment.
18. Agent retries the request.
19. Evidence API queries The Graph for deeper proof.
20. Evidence report is stored.
21. Deterministic policy engine evaluates eligibility.
22. Dashboard shows the full evidence trail.
23. DAO operator approves or rejects the simulated payout.
24. SQLite records the decision.

## Updated Workstream A: Foundation, Hedera, x402, and Bazantic

| Task | Files | Required proof |
| --- | --- | --- |
| EdGraph branding | `packages/nextjs/app/layout.tsx`, `components/Header.tsx` | App is visibly EdGraph |
| SQLite foundation | `services/db/client.ts`, `schema.ts`, `migrations/001_initial.sql` | Six workflow tables exist |
| Shared domain types | `services/policy/types.ts` | API, engine, agent, and UI share types |
| Hedera contract | `packages/hardhat/contracts/PolicyRegistry.sol` | Policy terms are committed on-chain |
| Contract deployment | `packages/hardhat/deploy/01_deploy_policy_registry.ts` | Deployment appears on HashScan |
| Contract tests | `packages/hardhat/test/PolicyRegistry.test.ts` | Creation, pagination, and resolution tests pass |
| Chain reader | `services/policy/chainReader.ts` | Backend reads canonical terms from Hedera |
| Policy creation | `app/api/policies/route.ts`, `services/policy/repository.ts` | DAO creates a real policy with HashPack |
| Public Evidence API | `app/api/v1/depeg-evidence/route.ts` | Public endpoint returns real HTTP 402 |
| Payment settlement | `services/x402/server.ts`, `facilitator/src/server.ts` | Real HBAR payment settles through Blocky402 |
| Evidence storage | `services/evidence/repository.ts` | Payment and report are auditable |
| Bazantic Gateway | Bazantic account and hosted Gateway | Gateway is reachable by an agent |
| Bazantic Recipe | `bazantic/edgraph-evidence.recipe.yaml` | Recipe explains the complete workflow |
| Bazantic documentation | `docs/bazantic.md`, `docs/bazantic-proof/` | Account, Gateway, Recipe, and proof are documented |
| Public deployment | Docker or cloud deployment configuration | Judges can reach the live paid API |

## Updated Workstream B: The Graph, Workers, Engine, Agent, and Frontend

| Task | Files | Required proof |
| --- | --- | --- |
| Select one pool | `services/graph/config.ts` | Pool and chain are documented |
| Live Graph client | `services/graph/client.ts` | Real provider query succeeds |
| Price calculation | `services/graph/price.ts` | Decimals and token ordering are correct |
| Live monitoring | `services/graph/monitor.ts` | Minute observations come from Graph data |
| Graph agent tool | `services/graph/agentTool.ts` | Agent receives a live risk snapshot |
| Graph provenance | `services/graph/provenance.ts` | Deployment, block range, and timestamps are shown |
| Observation storage | `services/observations/repository.ts` | Database rows contain real observations |
| Replay mode | `services/graph/replay.ts` | Replay uses the same monitor and detector pipeline |
| Monitoring worker | `scripts/edgraph-monitor.ts` | Worker runs outside the browser |
| Candidate detector | `services/claims/detector.ts` | Claim opens only after valid conditions |
| Deep evidence | `services/graph/evidence.ts` | Report is calculated from Graph data |
| Policy engine | `services/policy/engine.ts` | Engine returns only three decisions |
| Engine tests | `services/policy/engine.test.ts` | Boundary cases pass |
| Claims agent | `services/claims/agent.ts` | Agent reasons, discovers, pays, retries, and stores |
| Spending policy | `services/claims/spendPolicy.ts` | Agent cannot exceed the evidence budget |
| Dashboard | `app/edgraph/page.tsx` | UI reads backend responses |
| Claim detail | `app/edgraph/claims/[claimId]/page.tsx` | Full timeline is visible |
| Approval flow | `app/api/claims/[claimId]/approve/route.ts` | DAO decision is recorded |

## Bazantic Recipe Workflow

The Recipe should describe two services:

```text
Service 1: The Graph live pool query
Service 2: EdGraph paid Evidence API
```

**Example workflow:**

1. Query live pool price and liquidity from The Graph.
2. Decide whether the pool looks suspicious.
3. Call the EdGraph Evidence API.
4. Pay HBAR if the API returns `402`.
5. Compare the detailed report with the initial Graph snapshot.
6. Produce a claim recommendation.

This is stronger than a Recipe that only calls one endpoint.

## Final Track Proof Checklist

### The Graph

- [ ] Live Graph provider configured
- [ ] Graph API key or provider access configured
- [ ] Real swaps queried
- [ ] Real timestamps used
- [ ] Real liquidity data used
- [ ] Graph data drives a claim decision
- [ ] Evidence report includes provenance
- [ ] Graph service layer is reusable
- [ ] Public README explains how to run it
- [ ] Demo lasts 2 to 4 minutes

### Hedera

- [ ] Policy contract deployed to Hedera testnet
- [ ] DAO policy transaction visible on HashScan
- [ ] Evidence API publicly reachable
- [ ] Evidence API returns real HTTP 402
- [ ] Agent pays testnet HBAR
- [ ] Blocky402 verifies and settles
- [ ] Payment transaction visible on HashScan
- [ ] Evidence is returned only after settlement
- [ ] README explains setup, architecture, and payment flow
- [ ] Demo is under 5 minutes

### Bazantic

- [ ] Bazantic account created
- [ ] x402 or MCP Gateway created
- [ ] EdGraph Evidence API registered
- [ ] Recipe published
- [ ] Recipe uses The Graph and Evidence API
- [ ] Agent completes the full workflow
- [ ] Result depends on both services
- [ ] Hosted Recipe is shown in the video
- [ ] Bazantic username is included in the submission
- [ ] New API status is documented for the Agentify prize

## Recommended Final Video

Record one video of approximately 3 minutes 45 seconds.

```text
0:00 - Problem and EdGraph overview
0:25 - DAO creates a policy on Hedera
0:55 - Live Graph data appears
1:25 - Candidate claim opens
1:45 - Agent resolves Bazantic Recipe
2:05 - Evidence API returns 402
2:20 - Agent pays HBAR through Blocky402
2:45 - Evidence report unlocks
3:05 - Deterministic policy result appears
3:25 - DAO approves simulated payout
3:45 - Explain track integrations and limitations
```

This length satisfies the Graph requirement of 2 to 4 minutes and the Hedera requirement of five minutes or less.

## Final Decision

The final EdGraph implementation should therefore be:

```text
Live Graph data
    + reusable Graph risk tools
    + hosted Bazantic Gateway and Recipe
    + public x402 Evidence API
    + real Hedera HBAR settlement
    + Hedera policy contract
    + deterministic claim evaluation
    + human-approved simulated payout
```

The previous plan remains valid for the product workflow, but these four items are now mandatory for submission:

1. Live Graph provider data.
2. Hosted Bazantic Gateway and Recipe.
3. Public live x402 service with one real paid request.
4. Public README and a 2-to-4-minute end-to-end video.
