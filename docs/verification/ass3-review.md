# Ass3 verification record — 3 November 2026

## Scope

The submission is the Intangible Auction House: registration grant, real-time bidding, collection, blind pawn sale and administrator-issued credit keys. Player-created listings and resale are outside this release. The course grades the deployed state at its deadline, 9 November at noon, so subsequent changes must remain deployed and verified.

## Executed checks

- TypeScript checking and eight automated tests passed. The two official invariants remain; domain tests use isolated temporary databases.
- Independent account checks cover welcome credit, cross-lot reservations, refunds, simultaneous bids, owner-only pawn sales and duplicate-payout rejection.
- Restart checks retain sessions, balances, fixed appraisals, overdue settlement, sold items and redeemed keys.
- Live notifications and personalised snapshots are exercised independently of the browser UI. Early and near-closing bid tests distinguish unchanged deadlines from actual extensions.
- Client DOM checks preserve a typed bid and a focused collection button through unrelated updates.
- The live read-only smoke check passed for /, /readme/, /app.js, /style.css, anonymous state and the event stream. An earlier connection timeout cleared on retry; Fly logs showed normal automatic shutdown, not an application crash.
- The final live cycle in release-results.json passed account isolation, refunds, an actual Fly restart, settlement, owner-only pawn sale, duplicate-payout rejection and return login. The 10,499 ms notification measurement included a TCP connect timeout/retry; it is explicitly not treated as proof of subsecond end-to-end performance.
- A separate public-HTTPS run on established connections measured 45 ms from bid submission to the independent subscriber's refreshed snapshot, and 9 ms after bid acknowledgement. live-latency.json records the measurement and conditions. This is one observed run, not a guarantee for every network.

## Human feedback and response

Walkthrough feedback identified inconspicuous countdowns, unclear concurrent lots and bids that did not visibly extend time. The existing rule extends only near-closing bids. The response clarifies this rule, labels three independent auctions, enlarges each timer and adds extension notices. The server returns its actual extension decision. Group enjoyment and economic pacing remain separate evaluation questions.

## Browser inspection

Inspection used the official 1920×1080 desktop and 390×844 phone viewports. Neither had horizontal overflow. Screenshots of the saleroom are saved in this directory. On the phone, the account dialog fitted the viewport; Tab moved from its close control to the labelled bidder-name input, and Escape closed it. The page reconnected automatically following the Fly restart. The API checks use independent cookie jars; the browser inspection uses the in-app browser.

## Submission bundle

README.md defines good and is served at /readme/. PROCESS.md cites the development record. CLAUDE.md names constraints. Reflections for C8–C10 and the earlier decision records are retained. research-note.md gives a literature-based argument on feedback and autonomy, distinct from the project process account. Check word counts and every citation before the final push; no credentials belong in Git or screenshots.
