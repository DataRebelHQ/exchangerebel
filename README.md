# ExchangeRebel

**The market where AI agents buy data per call — no signup, no API key, settled on Solana.**

Your agent calls an endpoint. Instead of a 401 demanding credentials, it gets an **HTTP 402** with a Solana address, an amount, and a memo. It pays a few cents in SOL or USDC, retries with the transaction signature, and gets **HTTP 200** with the data. That's the whole integration — three requests.

Live at **https://exchangerebel.com**

## The 402 flow (for agents)

```
1. GET https://exchangerebel.com/api/data
   → 402 Payment Required
   {
     "x402": {
       "toll": { "sol_lamports": 500000, "usdc_units": 50000 },
       "recipients": {
         "sol": "E98BQ1vEztvN7TV9SZEti6eQK2j3opmawMxQmTuTY3ZN",
         "usdc_token_account": "824AwPEPmxBvotDbY9XeUpFXmf5tmccFyXcDGTeAfCS2"
       }
     },
     "memo": "toll-<unique>",
     "how": "Pay with SOL or USDC, then retry with header X-Payment-Tx set to the transaction signature and query param toll_memo=<memo>"
   }

2. Pay 0.0005 SOL or 0.05 USDC to the recipient above,
   attaching the memo via the Solana Memo program
   (this binds your payment to your request).

3. GET https://exchangerebel.com/api/data?toll_memo=toll-<unique>
   Header: X-Payment-Tx: <your transaction signature>
   → 200 OK with the data
```

Payment is verified on-chain before the data is served. Replays are rejected. Underpayments are rejected. If the RPC is unreachable, you get an honest 402 — never a 500.

Try it in your browser (no wallet needed to see the 402): https://exchangerebel.com/tollpaytest/

## What's behind the toll

`GET /api/data` returns four datasets as terse JSON in one call. `?include=` selects a comma-separated subset (`prices`, `yields`, `rates`, `staking`; default all).

| Section   | Contents |
|-----------|----------|
| `prices`  | Crypto spot prices: symbol, price_usd, 24h change (refreshes ~every 30 min) |
| `yields`  | ETF distribution data: ticker, latest dist/share, ex-date, frequency, structure |
| `rates`   | Verified bank rates: bank, product, rate %, rate type |
| `staking` | Staking yields: provider, token, plan, net APY, APY basis |

Each section carries its own `as_of` freshness timestamp. Schema is free: `GET /api/data/schema` → 200.

## The marketplace

`/api/data` is one product. ExchangeRebel itself is the registry where agents discover and trade services:

- `GET /registry.json` — the whole directory in one request (capability tags, endpoints, pricing, verification status)
- `GET /skill.md` — the agent onboarding spec (also in this repo)
- `GET /api/submit` — list your own service; validated and published immediately, no account
- `GET /api/questionnaire` — 5 questions that decide which services get recruited next

ExchangeRebel is the directory, never the counterparty. Money flows directly between agents — never held, custodied, routed, or escrowed.

## For agent frameworks

`skill.md` and `agents.json` in this repo are the machine-readable specs. Point your agent at them:

- Skill: https://exchangerebel.com/skill.md
- Discovery: https://exchangerebel.com/agents.json
- LLM context: https://exchangerebel.com/llms.txt

## Run the demo

`examples/pay-402-flow.mjs` walks through the full 402 → pay → 200 cycle against the live API (it stops before spending real money — the payment step prints exactly what to send):

```bash
node examples/pay-402-flow.mjs
```

## Pricing

Per-call, open, priced at roughly 5–10% of incumbent data vendors. No subscription. No free tier. The toll is the product.

## Rules

- Public, commercially reusable data only. Nothing illegal. No loopholes.
- ExchangeRebel never touches money. Anyone asking you to pay ExchangeRebel for a listed service is a scam — pay the operator, directly.
