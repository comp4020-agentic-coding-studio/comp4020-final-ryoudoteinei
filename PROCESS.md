# Process overview

## Why I changed direction

The project began as Commonplace, a shared note wall. C8 made it persistent and C9 made it live, but I judged the theme too ordinary: it was essentially a message board, and a working feature list had become a substitute for a reason to be there together.

I chose an auction of impossible objects from the agent's alternatives and designed its economy myself: a deep preset pool, hidden true values, a one-time grant of 1,000 fictional dollars, competitive bidding, and a pawnshop that reveals its payment only after sale. Co-presence now changes a decision: another bidder alters what I can afford and what I am willing to pay. I later added administrator-issued recharge keys; [96b9078](https://github.com/comp4020-agentic-coding-studio/comp4020-final-RyoudoTeinei/commit/96b9078) makes them hashed, expiring and redeemable once, with no public route to promote an account.

## Requirements, modules and boundaries

I asked the agent to build the register, bid, collect and pawn loop first. Player-created objects and resale auctions are deferred, so one complete economic cycle stays testable before seller incentives make it exploitable.

auction.ts holds durable rules and transactions, server.ts authentication and routes, public/ the interface, and spec/ executable contracts. Node's built-in server and SQLite still fit the course's one small Fly machine and one volume, with no separate database service. A new auction.sqlite leaves the old commonplace.sqlite untouched, and wall-specific tests are archived with their original scope.

README.md defines what good means; CLAUDE.md turns it into rules: fictional money only, no premature value exposure, server-derived ownership, atomic economic changes, and logs without credentials. docs/decisions/002-auction-pivot-and-authority.md records the rejected alternatives, account model and accepted costs.

## Building the economic contract

[56fdb53](https://github.com/comp4020-agentic-coding-studio/comp4020-final-RyoudoTeinei/commit/56fdb53) records the first auction implementation. Accounts use salted scrypt password hashes and random, persistent session tokens stored only as hashes. The welcome credit is created in the account-registration transaction. Signing in retrieves that account instead of awarding another grant. Public paddle identifiers connect a bidder's visible actions to logs without exposing session credentials.

A leading bid reserves credit immediately; being outbid refunds it in the same transaction that reserves the new amount. The server checks balances and deadlines itself, never numbers from the browser. SQLite serialises simultaneous requests, so competing bids cannot both spend the same funds, and a database constraint keeps integer balances from going negative.

Settlement transfers the collectible to the winning account without charging again. The deadline is a persisted server timestamp; late bids are rejected, and an accepted last-second bid leaves at least ten seconds to respond. Restarting settles overdue auctions before supplying new ones. The catalogue starts with sixteen authored concepts across six separately appraised editions. [d032659](https://github.com/comp4020-agentic-coding-studio/comp4020-final-RyoudoTeinei/commit/d032659) adds automatic replenishment so a running saleroom does not exhaust its initial queue.

Each appraisal is generated when its edition is inserted and remains in the database. Public state is built from explicit columns excluding that value. Even a collector cannot retrieve their appraisal before selling. A confirmed pawn transaction checks ownership, credits the stored appraisal and marks the lot pawned; only then does the response reveal the payout. Repetition cannot pay twice. This turns the visual metaphor of a sealed appraisal into a server-enforced boundary rather than a CSS concealment.

## Live participation and C10 evidence

I kept server-sent events rather than moving to WebSockets or polling. Traffic only needs to flow one way: bids and pawn sales are ordinary POST requests that the server can authenticate, validate and answer with an explicit rejection. A two-way socket would duplicate that path and need its own authentication and message format. Polling every second would meet the latency target but repeat a full snapshot request from every idle tab. EventSource reconnects by itself, and the server's one-second retry hint bounds the gap. Node's built-in server handles it without an extra package. The cost, one open connection per tab, suits a small saleroom.

The stream carries only a change notice. Each browser then fetches its own snapshot, so a wallet or collection is never broadcast to everyone. Reconnection reloads current state rather than replaying events: the stream is not the ledger, and a missed notification cannot change ownership.

C10 ties people to evidence. JSON log lines name the paddle, target and outcome of every bid, rejection, settlement and pawn sale; audit rows persist beside the ledger and are printed only after commit. Passwords, cookies and sealed values never appear. docs/C10-DEMO.md shows how to narrate two players from the terminal.

## Verification and design judgement

The suite keeps the two official invariants and adds isolated end-to-end market tests: two accounts, the single grant, refunds, simultaneous bids, unauthorised and repeated pawn attempts, absent hidden fields, restart recovery and live notification. Temporary databases keep them away from real players' accounts. A clearly labelled QA account then completed the full cycle on the live Fly app, confirming delivery, blind payout, duplicate-sale rejection and no repeat grant on login.

The visual direction uses paper tones, restrained type and solemn catalogue labels to make impossible possessions feel institutionally plausible. Inspection uses the official 1920×1080 and 390×844 viewports.

## How I directed and corrected the agent

My workflow treats CLAUDE.md and spec/ as the agent's memory. A conversation ends; a rule or a failing test stays and constrains the next session. So when I find a problem, a fix in the code is not enough. The lesson also has to land where the next agent will meet it.

My own walkthrough showed this loop. I found that countdowns were easy to miss, parallel lots looked like one auction, and early bids seemed not to extend the clock. Worse, an unrelated live update could replace the collection control I was focused on. [a99b43a](https://github.com/comp4020-agentic-coding-studio/comp4020-final-RyoudoTeinei/commit/a99b43a) fixes the interface and adds spec/interface.test.ts, which fails if a live update drops an active bid or keyboard focus. [d2ba0d2](https://github.com/comp4020-agentic-coding-studio/comp4020-final-RyoudoTeinei/commit/d2ba0d2) then adds a CLAUDE.md rule requiring unchanged controls to be preserved and actual extensions to be announced. The clock rule itself did not change: only a bid in the final ten seconds restores ten seconds. I made the interface say so.

The same principle shaped earlier corrections. When I rejected the note wall, I did not ask the agent to keep patching it; I recorded the reason in a decision record and rewrote CLAUDE.md around the auction, so old wall rules could not leak into new work. Nine automated checks pass, but they establish boundaries, not fun. Humour and economic pacing still need group playtesting.
