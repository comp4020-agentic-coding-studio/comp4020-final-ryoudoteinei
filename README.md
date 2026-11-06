# The Intangible Auction House

A Sunday without deadlines. Eight uninterrupted hours of sleep. The courage to say no. You can bid on all of them here. It's a small multiplayer auction game about the gap between wanting something and finding out what it's worth. Pick a bidder name and password, get $1,000 in fictional house credit, and walk into the same saleroom as everyone else. No real money goes in or comes out.

## Why an auction house?

This started as Commonplace, a shared note wall. It worked: notes persisted and appeared live. But nothing about it needed other people in the room at the same time. It was a noticeboard. I wanted something where another person's choice changes mine, and an auction does that immediately. The wall is still in the repository history, and its plumbing runs underneath the game.

Robin Sloan's [home-cooked app essay](https://www.robinsloan.com/notes/home-cooked-app/) argues that software can be worth making for a small circle rather than for growth. The [final project brief](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/assessments/final-project/) asks for co-presence. Put the two together and you get a handful of people arguing over what a ridiculous object is worth, with no audience, feed or leaderboard.

## What good means here

Good means you are unsure what things are worth, never unsure what the rules are. Every edition gets a hidden appraisal when it is created. It stays on the server until the owner commits to selling it to the pawnshop, and only the receipt shows the payout and whether you won or lost. I haven't tuned the appraisal spread or auction pace with a real group yet; that needs playtesting.

Bid prices, deadlines and leading paddles are public. Account balances, collections and ledger entries are private. Names are public labels; a password-backed account owns the assets. The server enforces that boundary. A collector cannot pawn another person's item, spend money already reserved elsewhere, or claim the welcome grant again by signing back in. Extra issued credit requires an administrator-generated key. Each key expires after seven days and can be redeemed once; it is not a purchase of real money.

Good also means that a loss feels attributable to a visible rule. Leading bids reserve funds; being outbid releases them. The house awards an item once, with no second charge at settlement. Final-second bids leave at least ten seconds for a response. An owner's confirmed pawn sale is irreversible and removes the item from circulation. No estimate is displayed before that decision.

## Evidence and limits

Server-sent notifications refresh each visitor's own snapshot while retaining active bid inputs. The server's clock decides closing times. SQLite transactions hold the wallet, ownership, ledger and audit records together on the persistent volume. Checks exercise independent accounts, simultaneous bids, insufficient funds, unauthorised sales, duplicate payouts, hidden-value responses, restart recovery and live notifications. The official homepage and README checks remain.

Which claims are enforced and which are judged? The economic rules above are enforced: the server refuses to break them and spec/ tests that it does. Clarity is judged. In my own walkthrough the countdowns were easy to miss, three lots read as one auction, and early bids looked broken because they didn't extend the clock. Timers are now bigger, lots are labelled, and extensions are announced; early bids still don't extend, on purpose. Whether it's funny is not yet judged by anyone but me. The vault starts with sixteen fictional objects and refills itself. Player-created listings, resale auctions and chat are deferred. Paper tones, restrained typography and solemn catalogue labels make the impossible objects the joke.
