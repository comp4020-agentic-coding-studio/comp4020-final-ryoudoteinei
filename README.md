# The Intangible Auction House

A Sunday without deadlines. Eight uninterrupted hours of sleep. The courage to say no. This is a small multiplayer auction game about the gap between wanting something and discovering what it is worth. Register a bidder name and password, receive $1,000 in fictional house credit, and enter the same saleroom as other collectors. There are no deposits, withdrawals or real-money prizes.

## Why an auction house?

The project began as Commonplace, a shared note wall. That established persistence and live updates, but the subject did not give people a compelling reason to be present together. I chose a different direction: another person's decision should change my decision. An auction makes that relationship immediate. The earlier iterations remain in the repository history; their technical foundations survive in the new game.

Robin Sloan's [home-cooked app essay](https://www.robinsloan.com/notes/home-cooked-app/) provides a reference for making software worthwhile for a small circle instead of optimising for unlimited growth. The [final project brief](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/assessments/final-project/) asks for co-presence. Here, a handful of people can disagree about the value of a ridiculous object without needing an audience, a feed or a popularity score.

## What good means here

Good means uncertainty about value, not uncertainty about the rules. Every edition has a hidden appraisal fixed when it is created. It stays on the server until its owner confirms a final sale to the official pawnshop. The receipt then reveals the payout and gain or loss. Descriptions are fictional catalogue entries. Group playtesting will inform adjustments to the appraisal distribution and auction pacing.

Bid prices, deadlines and leading paddles are public. Account balances, collections and ledger entries are private. Names are public labels; a password-backed account owns the assets. The server enforces that boundary. A collector cannot pawn another person's item, spend money already reserved elsewhere, or claim the welcome grant again by signing back in. Extra issued credit requires an administrator-generated key. Each key expires after seven days and can be redeemed once; it is not a purchase of real money.

Good also means that a loss feels attributable to a visible rule. Leading bids reserve funds; being outbid releases them. The house awards an item once, with no second charge at settlement. Final-second bids leave at least ten seconds for a response. An owner's confirmed pawn sale is irreversible and removes the item from circulation. No estimate is displayed before that decision.

## Evidence and limits

Server-sent notifications refresh each visitor's own snapshot while retaining active bid inputs. The server's clock decides closing times. SQLite transactions hold the wallet, ownership, ledger and audit records together on the persistent volume. Checks exercise independent accounts, simultaneous bids, insufficient funds, unauthorised sales, duplicate payouts, hidden-value responses, restart recovery and live notifications. The official homepage and README checks remain.

Group playtesting will evaluate the humour of the catalogue and whether bidding produces interesting choices. The starting vault contains sixteen fictional descriptions across six separately appraised editions, with further editions replenished automatically. This first release covers registration, bidding, collecting and blind pawning. Player-created listings, resale auctions and chat are deliberately deferred. The warm paper, restrained typography and solemn catalogue labels make the impossible objects the joke.
