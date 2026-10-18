# Crit 10 — Fly by instruments

## What was the breakthrough that moved the work forward?

The breakthrough was recognising that a working real-time system did not yet give people a reason to use it together. I rejected the shared-wall theme as too ordinary and chose an auction house for impossible objects. I then specified the hidden-value market: a one-time registration grant, competitive bidding, owned collectibles and a pawnshop that reveals its payment only after sale.

The new theme makes authority observable. A price is public, a wallet is private, an accepted bid reserves funds, and only the owner can pawn an item. Public paddle identifiers connect actions on the page to server-side records. The tests can therefore ask stronger questions than whether two pages update: can simultaneous bids overspend, can settlement charge twice, or can another person claim a payout?

## What did this work change about who I want to be as a software developer?

This iteration puts my judgement about the purpose of a project ahead of preserving its first interface. Keeping the earlier commits and reflections makes the change explainable rather than erasing the less successful direction.

The solemn auction-catalogue styling is also part of the idea: it gives impossible possessions a believable institutional frame. That visual promise needs matching behaviour. A sealed appraisal must remain unavailable in the API, not merely hidden by CSS. I still need real group feedback about pacing and whether the uncertainty produces interesting choices. Automated account, ledger and permission checks establish boundaries; they do not establish that people enjoy the game.
