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
- The final live cycle and restart rehearsal is recorded in the execution results for this review; do not substitute these operator checks for a classmate study.

## Human feedback and response

The student reported that a bid did not visibly extend time, countdowns were inconspicuous and multiple lots appeared to run simultaneously. The existing rule extends only near-closing bids. The response clarifies this rule, labels three independent auctions, enlarges each timer and adds extension notices. The server returns its actual extension decision. No claim is made that this feedback evaluates the humour or establishes a balanced economy.

## Browser inspection

Inspect at the official 1920×1080 desktop and 390×844 phone viewports, including the account dialog, saleroom and project statement. Record actual screenshot evidence in this directory. A normal and an incognito/profile-based two-player rehearsal remains useful for the student's own final review; automated HTTP identities are not described as separate Chrome profiles.

## Submission bundle

README.md defines good and is served at /readme/. PROCESS.md cites the development record. CLAUDE.md names constraints. Reflections for C8–C10 and the earlier decision records are retained. research-note.md gives a literature-based argument on feedback and autonomy, distinct from the project process account. Check word counts and every citation before the final push; no credentials belong in Git or screenshots.
