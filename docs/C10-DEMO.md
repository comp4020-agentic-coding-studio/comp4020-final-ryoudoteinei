# C10 log-led rehearsal

Open the assigned Fly URL in a normal Chrome profile and a separate profile or incognito window. Register two different bidder names; each receives exactly 1,000 fictional credits. Their public paddle IDs appear above the saleroom.

From the repository, tail `mise.exe exec -- flyctl logs -a comp4020-final-ryoudoteinei` (PowerShell's mise wrapper may mishandle the separator; use mise.exe).

Let the two players bid on the same lot. Narrate the stable paddle, lot, bid acceptance or rejection and amount from JSON events. When one is outbid, its reservation returns. After the deadline, an auction.won event identifies the winner and the collection receives the item. The owner can confirm a blind pawn sale; pawn.sold records the payout only after it happens. The other account cannot sell that item.

Passwords, session cookies and pre-sale values must never appear in the logs. Economic audit events are also persisted in auction.sqlite on /data. The ledger and lots survive restarts. There is no public audit endpoint exposing everyone else's wallet.

The operator explains the logs while the two players operate the website. Match the public paddle identifiers on the players' pages to the actors in the logs.
