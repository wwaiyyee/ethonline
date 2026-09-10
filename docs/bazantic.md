# Bazantic Submission Setup

EdGraph's hosted Bazantic proof must be completed outside this repository before submission. This document is the record to fill in after creating the account, Gateway, and Recipe.

## Account And Hosted Artifacts

| Field | Value |
| --- | --- |
| Bazantic username | `REPLACE_WITH_BAZANTIC_USERNAME` |
| Gateway URL or identifier | `REPLACE_WITH_HOSTED_BAZANTIC_GATEWAY_URL` |
| Published Recipe URL | `REPLACE_WITH_HOSTED_RECIPE_URL` |
| Public Evidence API URL | `REPLACE_WITH_PUBLIC_EVIDENCE_API_URL` |
| Graph service URL | `REPLACE_WITH_GRAPH_GATEWAY_SERVICE_URL` |

The local source recipe is [`bazantic/edgraph-evidence.recipe.yaml`](../bazantic/edgraph-evidence.recipe.yaml). The hosted Recipe must be published from that workflow and must show both services in one run.

## Why The Recipe Uses Both Services

1. The Graph service provides a live Base pool snapshot with price, movement, liquidity, timestamps, block range, deployment, and query hash.
2. The agent decides whether the policy's evidence budget justifies a deeper request.
3. The Evidence API returns `402 Payment Required` until the agent pays native testnet HBAR through x402 and the Blocky402 facilitator.
4. The Evidence API queries The Graph again, stores the report, and returns deterministic policy evaluation plus payment and Graph provenance.
5. The final output is a recommendation only. A DAO operator must approve or reject the simulated payout.

## Request Example

```bash
curl -i -X POST "$PUBLIC_EVIDENCE_API_URL" \
  -H 'content-type: application/json' \
  -d '{"policyId":"0xPOLICY_ID","claimId":"claim-demo-001","lookbackSeconds":1800}'
```

The first request must return `402` with `PAYMENT-REQUIRED`. The paid retry must include `PAYMENT-SIGNATURE` and return a JSON evidence report with `PAYMENT-RESPONSE`.

## Payment Configuration

The hosted service must use:

- `X402_NETWORK=hedera:testnet`
- asset `0.0.0` (native HBAR)
- tinybar amounts only
- `FACILITATOR_URL` pointing at the Blocky402 facilitator deployment
- a dedicated `EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID` account

The Evidence API never holds `FACILITATOR_PRIVATE_KEY`. That key belongs only in the facilitator deployment.

## Agentify Prize Note

For the `Agentify a new API` submission, record the date and screenshot showing that EdGraph's Evidence API was not already available in Bazantic or from another sponsor when the event began. Do not claim this status without that proof.

## Screen Recording Proof

Capture one continuous recording showing:

- hosted Bazantic account and Recipe;
- the Recipe invoking the live Graph service;
- agent decision and evidence budget check;
- `402 Payment Required`;
- HashPack or agent HBAR signing;
- Blocky402 settlement and Hedera transaction receipt;
- paid Evidence API response with provenance;
- deterministic policy recommendation and DAO approval step.

Store screenshots, exported run metadata, and transaction links in `docs/bazantic-proof/`. Never commit private keys or payment signatures.

