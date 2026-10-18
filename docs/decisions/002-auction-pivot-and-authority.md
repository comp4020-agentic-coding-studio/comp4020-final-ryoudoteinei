# ADR 002 — From a note wall to a blind-value auction house

Status: implemented for C10, 19 October 2026. Supersedes the note-wall product scope in ADR 001; retains its notification/snapshot approach and protection of unfinished input.

## Why change direction?

The student judged Commonplace too ordinary and rejected the theme. The proposed auction of impossible objects prompted a more specific design from the student: a large preset pool, hidden true values, a one-time registration grant, bidding, ownership and a blind-sale pawnshop. The student reports that teaching staff permit a direction change if the process account explains it. This document records that reported permission, not an independently obtained approval or invented staff quotation.

The reason is substantive: co-presence should create a decision that would not exist alone. A competing bid changes what another player can afford and what they believe a fictional object is worth. The first implementation intentionally covers only register → bid → collect → pawn. Player-created listings and their listing fees are future work, so the unfinished market is not presented as delivered.

## Alternatives and choice

Adding replies or likes to the wall would preserve more UI but would leave its purpose unresolved. Building an unrelated project in a new repository would lose the course's continuous evidence trail. Instead, preserve the repository, old tags, database file and archived tests; replace the current product and define a new economic contract. A separate auction.sqlite protects old data while keeping the one-volume course constraint.

Anonymous cookie ownership was sufficient for notes. Assets and persistent balances benefit from return access across devices, so the game now uses named, password-backed accounts and hashed persistent sessions. The costs are signup friction, password storage and no self-service password recovery in this prototype. Two accounts can use the same display device independently by using different profiles. A name is never accepted as proof of ownership.

## Visibility and authority

Anyone may read live lots, prices and leading public paddle IDs. Only an authenticated account may bid. Only an item's current owner may pawn it. The member ID comes from the server session; every mutation rechecks funds, status, deadline and ownership. Only the owner receives their wallet, collection, payout history and ledger. Pawn valuations are generated once on the server and are excluded from all pre-sale responses.

Integer credits are reserved immediately on an accepted bid. An outbid reservation is refunded in the same transaction that reserves the new amount. Raising one's own bid reuses its existing reservation. Concurrent requests execute serially inside SQLite transactions. Settlement transfers ownership without another debit. Restarting applies overdue settlement before opening replacement lots. A late bid is rejected; a valid bid near closing extends to at least ten seconds from acceptance.

A blind pawn sale requires explicit confirmation, credits the fixed appraisal once, marks the item pawned, and then reveals the payout. Resubmitting cannot produce another payout. No cancelled request, failed validation or network error is treated as proof of a successful sale; returning to the account retrieves committed state.

## Logs and verification

Paddles such as B0001 are visible on the account and accepted bids, and identify actors in JSON logs. Events include wallet.welcome, member.login, bid.accepted, auction.won, pawn.sold and rejected operations. Economic audit rows are durable alongside the ledger; successful events are emitted after commit. Credentials and sealed appraisals are excluded from pre-sale logs. Operators can tail logs and narrate two independent players without controlling the UI.

The initial supply is sixteen authored concepts across six editions, each independently appraised, with automatic replenishment. Appraisals and auction duration are explicit prototype parameters. The game has no real-money economy, and registration grants can be obtained by creating another account; this is not an anti-Sybil system or a commercially balanced market. These costs are accepted for a small fictional game and require further playtesting rather than unsupported fairness claims.
