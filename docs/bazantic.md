# Bazantic Integration

EdGraph's Bazantic submission uses a hosted x402 or MCP Gateway to connect a
claims agent to two services in one workflow:

1. A live The Graph provider supplies the Base pool risk snapshot.
2. The EdGraph Evidence API supplies deeper evidence after an HBAR x402 payment.
3. The deterministic policy engine combines both results and recommends a
   simulated payout for DAO operator approval.

## Submission values

| Field | Value |
| --- | --- |
| Bazantic account username | `TODO: add account username` |
| Hosted Gateway URL | `TODO: add hosted Gateway URL` |
| Published Recipe URL | `TODO: add hosted Recipe URL` |
| Evidence API URL | `TODO: add public deployment URL` |

The local source recipe is [`bazantic/edgraph-evidence.recipe.yaml`](../bazantic/edgraph-evidence.recipe.yaml).
The hosted Gateway and Recipe are required for final judging; this file records
the URLs and proof after publication.

## Request

```json
{"claimId":"claim-demo-001"}
```

The first request returns HTTP `402 Payment Required` with an HBAR requirement.
The agent signs the transfer, Blocky402 settles it on Hedera testnet, and the
retry returns the evidence report plus a `PAYMENT-RESPONSE` receipt.

## Proof checklist

- [ ] Bazantic account username captured
- [ ] Gateway URL responds to an agent request
- [ ] Recipe is published and uses both Graph and EdGraph Evidence API
- [ ] Before/after payment screenshots saved in `docs/bazantic-proof/`
- [ ] Public request, settlement transaction, and evidence response recorded
