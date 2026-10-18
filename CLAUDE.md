# Auction house development rules

The user explicitly redirected the project from Commonplace to a fictional auction house. README.md is the current purpose; docs/decisions/002-auction-pivot-and-authority.md records the pivot and authority model. Older wall decisions and tests are historical evidence, not current product requirements.

## Non-negotiable behaviour

- All money is fictional. No payments, deposits, withdrawals, purchased credits or cash prizes.
- Additional issued credit requires a random single-use key. Only a server-verified admin can mint keys. Store key hashes, credit only the stored amount, and redeem atomically once. Never expose raw keys in logs or key-history responses.
- Admin accounts are provisioned through trusted operator shell only. Registration must never accept an admin role; no public bootstrap or promotion route.
- Grant exactly 1,000 credits on successful account creation, never again on login. Do not overwrite previous accounts or assets on deployment.
- Keep the course's Fly machine, volume and port unchanged. auction.sqlite belongs under DATA_DIR (/data in production). Retain the old commonplace.sqlite rather than deleting it.
- Use parameterised SQL and transactions for reservations, refunds, settlement and pawn payouts. Balances cannot be negative. One lot can settle and pay out only once.
- Names are not authentication. Derive the account from the persistent random session cookie. Store only session-token hashes and salted scrypt password hashes. Never log credentials or password request bodies.
- Check bids, available funds, deadlines, ownership and confirmed pawn sales on the server. Ignore client-supplied owners, balances, valuations and deadlines.
- Generate each edition's appraisal once, persist it, and never include it in public API results, HTML, JS, SSE, client attributes or pre-sale errors. Reveal the payout only following a successful confirmed pawn transaction to its owner.
- Public state includes lot descriptions, prices, deadlines and leading paddles. Private state includes each account's wallet, collection and ledger. Build snapshots separately for each session; broadcast only change notices.
- Preserve pending input and focus during live updates. A stale bid gets an explicit rejection. Snapshot failure retries, and reconnect fetches current authoritative state.
- Log accepted/rejected operations with stable public paddle IDs, action, target and outcome. Persist audit rows; emit successful economic events only after commit. Do not log sealed values before sale.
- Preserve spec/invariants.test.ts. Keep the full current README available in server-rendered HTML at /readme/.

## Workflow

Use small commits and real evidence links. Document the design reasons for decisions. Background information given to the agent is not automatically submission content. Do not invent peer feedback or completed usability studies. C8/C9 tags are historical snapshots and must not move.

Run pnpm check against a running app, including isolated temporary databases for economic tests, and pnpm check:evidence for documentation. Inspect desktop and phone layouts plus an actual register/bid/collect/pawn flow. A passing local suite does not prove a live deploy. Report verification limits honestly.

C10 includes separate browser profiles or incognito accounts and a terminal log narration. No tester should need a secret URL or a pre-provisioned account. The page must explain how to enter, the grant, the paddle and the pawn decision. Final A3 still requires human review of README's argument and process/reflection voice.
