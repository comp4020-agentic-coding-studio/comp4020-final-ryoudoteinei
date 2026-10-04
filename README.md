# Commonplace

Commonplace is a shared studio wall for unfinished thoughts: an idea, a question, or a discovery worth passing on. It is intended for a small group working in the same room, such as a design studio or reading workshop. Visitors leave short notes under a name or pseudonym. Everyone can read them, and the original browser can remove its own contribution. The first version offers a deliberately small interaction: leave something, go away, and find it here again.

## What good means here

A good wall lowers the cost of contributing without pretending that every contribution deserves a competition. There are no likes, follower counts, scores, or ranked recommendations. Notes appear in chronological order, newest first. Three categories help visitors find a kind of thought without requiring a carefully organised folder system. A permanent link lets someone return to a particular note even after it moves off the first page.

Good also means being honest about who can see the writing. This is a public wall, not a private journal. The composer says this before submission. Browser identity is a convenience rather than a verified identity: names need not be unique, and deleting cookies loses the ability to remove earlier notes. No email address or password is requested. That choice makes entry simple, but makes this unsuitable for sensitive conversations or groups requiring verified membership.

## Where this position comes from

Robin Sloan's [An app can be a home-cooked meal](https://www.robinsloan.com/notes/home-cooked-app/) describes software made for a particular small circle. Commonplace takes its small intended audience seriously, but differs from his disappearing messages: the wall retains notes because a workshop needs something to return to. This is a design hypothesis, not evidence that a workshop has already found it useful.

The [final project brief](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/assessments/final-project/) asks for shared state, persistence and eventually real-time participation. Commonplace interprets those as a shared surface for thinking together. More features would not establish that the surface is worth using. Its next useful evaluation is whether another person can read an unfinished thought and contribute something meaningful beside it.

## Promises and checks

The server validates note length and category, saves acknowledged writes to SQLite, and checks ownership before deletion. Automated tests exercise two visitors, unsafe markup, invalid submissions, and persistence after restarting the application. The database belongs on Fly's persistent volume. Local restart tests support that design; they do not substitute for testing the actual deployed volume.

Legibility, tone and willingness to contribute require human judgement. Desktop and narrow-screen inspection can reveal clipping or awkward controls, but a real workshop still needs to test whether the prompts feel useful. This first version requires a refresh to see other people's additions. Real-time updates are a later milestone; the interface does not claim they already exist.

## Running it

Use Node 24 and pnpm 11 or later. Run `pnpm install`, then `pnpm start`. The default address is `http://localhost:8080`. Run `pnpm check` with the server running, followed by `pnpm check:evidence`. Locally, data is stored in the ignored `data/` directory; the container uses `/data`. These directories must be retained to keep the wall.
