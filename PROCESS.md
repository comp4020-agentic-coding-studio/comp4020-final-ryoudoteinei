# Process overview

## Why I changed direction

The project began as Commonplace, a shared wall for short ideas, questions and discoveries. C8 established a persistent interaction and C9 added live updates while preserving local drafts. Those were useful technical milestones, but I judged the theme too ordinary. I asked whether the application was essentially a message board and then explicitly rejected that direction. A working feature list had become a substitute for a reason to use the application with other people.

I chose an auction of impossible objects from the agent's alternatives and developed its economic rules myself: a deep preset pool, hidden true values, a one-time registration grant of 1,000 fictional dollars, competitive bidding, owned collectibles and a pawnshop that reveals its payment only after sale. I reported that teaching staff allow a change of direction provided the process account explains why. This records my report; it does not invent correspondence or an independently verified approval.

The reason for the pivot is that co-presence now changes a decision. Another bidder alters what I can afford, what I am willing to pay and whether I should wait. The difference between purchase price and eventual appraisal provides a concrete uncertainty that the message board lacked. That remains a design hypothesis: no completed group playtest is claimed here.

## Requirements, modules and boundaries

I asked the agent to implement the registration, bidding, collection and pawn-reveal loop first, restyle the interface as an auction house, and meet C10 and final-project requirements. Player-created objects, listing fees and resale auctions are part of the larger proposal, but are not claimed as completed features. Limiting the first release keeps a complete economic cycle testable before introducing seller incentives and an exploitable content-creation economy.

The implementation divides responsibilities between auction.ts for durable rules and transactions, server.ts for authentication and routes, public/ for the interface, and spec/ for executable contracts. The existing Node and SQLite stack still fits the course's single small Fly machine and one persistent volume. A separate auction.sqlite retains the old commonplace.sqlite unchanged. C8 and C9 remain visible in earlier commits and reflections; old wall-specific tests are archived rather than silently presented as checks of the new product.

README.md now defines what good means for the auction. CLAUDE.md translates that into rules: fictional money only, no premature value exposure, server-derived ownership, atomic economic changes, and logs without credentials. The new decision record, docs/decisions/002-auction-pivot-and-authority.md, explains the rejected alternatives, new account model and accepted costs. The older live-wall decision remains a historical record whose event/snapshot approach is still useful.

## Building the economic contract

[56fdb53](https://github.com/comp4020-agentic-coding-studio/comp4020-final-RyoudoTeinei/commit/56fdb53) records the first auction implementation. Accounts use salted scrypt password hashes and random, persistent session tokens stored only as hashes. The welcome credit is created in the account-registration transaction. Signing in retrieves that account instead of awarding another grant. Public paddle identifiers connect a bidder's visible actions to logs without exposing session credentials.

A leading bid reserves credit immediately. Being outbid refunds the earlier reservation inside the same transaction that reserves the new amount. Raising one's own bid reuses its existing reservation. The server checks current balances and deadlines, not numbers supplied by the browser. SQLite serialises simultaneous requests, so competing bids cannot both spend the same funds. All credits are integers and balances have a database constraint against becoming negative.

Settlement transfers the collectible to the winning account without charging again. The deadline is a persisted server timestamp; late bids are rejected, and an accepted last-second bid leaves at least ten seconds to respond. Restarting settles overdue auctions before supplying new ones. The catalogue starts with sixteen authored concepts across six separately appraised editions. [d032659](https://github.com/comp4020-agentic-coding-studio/comp4020-final-RyoudoTeinei/commit/d032659) adds automatic replenishment so a running saleroom does not exhaust its initial queue.

Each appraisal is generated when its edition is inserted and remains in the database. Public state is built from explicit columns excluding that value. Even a collector cannot retrieve their appraisal before selling. A confirmed pawn transaction checks ownership, credits the stored appraisal and marks the lot pawned; only then does the response reveal the payout. Repetition cannot pay twice. This turns the visual metaphor of a sealed appraisal into a server-enforced boundary rather than a CSS concealment.

## Live participation and C10 evidence

Server-sent events continue to carry only change notifications. Each browser fetches its own authoritative snapshot, which contains its wallet and collection while sharing public prices and leading paddles. Live bid-card updates retain active input instead of replacing the page. Reconnection reloads current state rather than reconstructing financial truth from an event history. The event stream is not the ledger, and a missed notification cannot change ownership.

C10 adds a stable relationship between people, actions and evidence. JSON records identify paddles, targets, accepted bids, rejections, settlement and pawn sales. Economic audit records persist beside the ledger, and successful events are printed after transaction commit. Passwords, cookies and sealed values are excluded from pre-sale logs. docs/C10-DEMO.md describes how two people register independently from the URL while I narrate their actions from the terminal. It describes a rehearsal, not an already completed crit.

## Verification and design judgement

The revised suite retains the two official invariants and adds isolated end-to-end tests of the complete market. They check two accounts, the single grant, refunds, simultaneous bids, unauthorised and repeated pawn attempts, absence of hidden fields, restart recovery and live change notification. Temporary databases keep economic tests separate from players' deployed accounts. In a local browser I also registered, reserved 25 credits, received a collectible at settlement and sold it; the receipt revealed a 959-credit payout only after confirmation.

After deployment, a clearly labelled QA account completed the same cycle against the live Fly application using the ordinary public deadlines. The checks confirmed delivery, blind payout, duplicate-sale rejection and no repeat grant after login. The account remains labelled as QA rather than pretending to be a real player. GitHub's check and deploy jobs also passed for the auction revision.

The visual direction uses paper tones, restrained type, catalogue numbers and solemn labels to make impossible possessions feel institutionally plausible. Robin Sloan's [home-cooked app essay](https://www.robinsloan.com/notes/home-cooked-app/) still informs the small-group scale, while the course brief supplies the co-presence test. Pacing, humour and appraisal distribution need real player feedback. A technically protected fictional economy is not automatically a good game; the next evaluation must test the experience that motivated the pivot.
