# ADR 001 — Live published notes, private unfinished drafts

Status: historical C9 decision, 11 October 2026. Product scope superseded by ADR 002 on 19 October; its event/snapshot approach and preservation of local input continue in the auction game.

## Context

Commonplace asks a small studio group to contribute unfinished thoughts without competitive feedback. A visitor may be composing while someone else posts or removes a note. The shared wall should stay current without turning the act of typing into a public performance. The README's low-pressure participation goal is the criterion for this decision.

## Options

1. Reload the whole page after every change. Simple and consistent, but destroys unsaved input and disrupts keyboard focus.
2. Show an “updates available” banner and wait for a click. Keeps the layout stable, but shared content does not appear automatically within the C9 real-time requirement.
3. Update published notes immediately while keeping the composer untouched. Preserves private writing while keeping everyone informed. New cards can shift the visible wall.
4. Broadcast keystrokes and presence as well. Gives stronger co-presence, but exposes unfinished text and adds social pressure and identity complexity.

## Decision

Use option 3. Publish additions and removals after SQLite commits. Preserve the current filter and page. Never transmit a draft, typing indicator or presence list. Submission clears only the exact draft acknowledged by the server, so text entered during an in-flight request is retained.

SSE carries a minimal change notice; each browser fetches its own current snapshot. A new connection immediately requests a snapshot, including changes missed while offline. SQLite remains authoritative, so neither event ordering nor an in-memory history determines persistence. The client serialises snapshot requests and keeps a pending-refresh flag to avoid applying responses out of order. Unchanged cards are retained, including an in-progress deletion confirmation.

## Concurrent actions and disconnection

Notes are immutable after publishing. Concurrent posts receive different IDs and both survive. Simultaneous authorised deletions leave the note absent; a later attempt may report that the note no longer exists. Ownership is checked on the server for every deletion. A permanent-link page shows that a removed note is gone.

During a network interruption, the wall shows its last known state and a reconnecting indicator. The draft stays in the open page. Reconnection replaces the shared snapshot, never the form. Closing the tab or manually reloading can still discard an unsubmitted draft; offline submission and cross-device draft recovery are outside this decision.

## Costs and verification

New cards can move older cards; pagination is a live window, not an immutable reading session. Each event causes a bounded snapshot request for every connected viewer. SSE connections also keep resources in use, so this design is intended for a small group on one Fly machine. Snapshots and heartbeats trade some bandwidth for simple recovery; a larger audience would need a different strategy.

spec/realtime.test.ts checks write/delete notices, receiving-browser ownership, filters and reconnect notification. spec/client.test.ts checks draft text, focus and selection across updates and reconnection. A two-tab browser check exercises actual submission without navigation. These tests support behaviour, not claims about how a workshop feels.
