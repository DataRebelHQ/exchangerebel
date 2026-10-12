#!/usr/bin/env node
/* ExchangeRebel 402 payment-flow demo.
 * Walks through the full HTTP 402 -> pay -> HTTP 200 cycle against the LIVE API.
 * It stops before spending real money: step 2 prints the exact payment to make,
 * and step 3 shows how to retry once you've paid.
 *
 * Usage: node examples/pay-402-flow.mjs
 */
const BASE = "https://exchangerebel.com";

async function main() {
  // ---- Step 1: call without paying -> 402 with everything you need ---------
  console.log("1. GET /api/data (no payment)");
  const first = await fetch(`${BASE}/api/data`);
  console.log(`   -> HTTP ${first.status}`);
  if (first.status !== 402) {
    console.log("   Unexpected: expected 402. Body:", (await first.text()).slice(0, 200));
    return;
  }
  const challenge = await first.json();
  const { toll, recipients } = challenge.x402;
  const memo = challenge.memo;
  console.log(`   toll: ${toll.sol_lamports} lamports SOL (${toll.sol_lamports / 1e9} SOL)`);
  console.log(`         or ${toll.usdc_units} base units USDC (${toll.usdc_units / 1e6} USDC)`);
  console.log(`   pay SOL to:  ${recipients.sol}`);
  console.log(`   pay USDC to: ${recipients.usdc_token_account}`);
  console.log(`   memo: ${memo}`);
  console.log(`   note: ${challenge.memo_note}`);

  // ---- Step 2: the payment (YOU do this with your wallet/agent) ------------
  console.log("\n2. Pay on-chain (manual step — no real payment is made by this script)");
  console.log(`   Send ${toll.sol_lamports / 1e9} SOL to ${recipients.sol}`);
  console.log(`   — or ${toll.usdc_units / 1e6} USDC to ${recipients.usdc_token_account}`);
  console.log(`   Attach memo "${memo}" via the Solana Memo program.`);
  console.log("   Keep the transaction signature; you'll need it next.");

  // ---- Step 3: retry with proof of payment --------------------------------
  console.log("\n3. Retry with payment proof");
  console.log(`   GET ${BASE}/api/data?toll_memo=${memo}`);
  console.log("   Header: X-Payment-Tx: <your transaction signature>");
  console.log("   -> 200 OK with the data (verified on-chain before serving).");
  console.log("\n   Example with curl, after paying:");
  console.log(`   curl -s "${BASE}/api/data?toll_memo=${memo}" \\`);
  console.log(`     -H "X-Payment-Tx: YOUR_TX_SIGNATURE" | head -c 400`);

  // ---- Bonus: the schema is free -------------------------------------------
  const schema = await fetch(`${BASE}/api/data/schema`);
  console.log(`\nBonus: GET /api/data/schema -> HTTP ${schema.status} (free, no payment)`);
}

main().catch((e) => { console.error("demo failed:", e.message); process.exit(1); });
