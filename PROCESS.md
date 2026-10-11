# Process overview

## Reading the brief and choosing a scope

I began by asking the agent to check the weekly exercise and then implement a first version. C8 marked the start of the final project: a stranger had to perform a meaningful action and find its trace when returning. C9 adds a different test of the same application: several open sessions must receive changes automatically, within about a second, and the repository must explain a decision about how simultaneous participation behaves. Treating these as stages of one project kept persistence relevant while shifting attention towards interaction.

The agent proposed Commonplace, a public studio wall for ideas, questions and discoveries. I supplied the official repository and later its deployment token. The initial direction remains a proposal to evaluate with people, not a workshop-tested product. A small group is its intended audience. Pseudonyms and browser identity avoid an account-creation task, but do not establish verified membership. The composer therefore states that notes are public and that clearing cookies loses the connection to earlier contributions.

## Modules, structure and boundaries

The work separates HTTP routing and page rendering, SQLite storage and ownership, browser interaction, and the course harness. server.ts holds the application, public/ holds styles and browser code, and spec/ contains checks. README.md is rendered directly at /readme/ so the public argument cannot silently diverge from the repository. This modest structure fits the current feature set; it is not an argument against splitting modules if the application grows.

The template fixes one 256 MB Fly machine and one persistent volume at /data. Node's built-in HTTP server and SQLite avoid a separate database service and production package installation. Short, parameterised SQLite writes suit the intended workload, although synchronous queries and one machine limit scale. [de1d75c](https://github.com/comp4020-agentic-coding-studio/comp4020-final-RyoudoTeinei/commit/de1d75c) records the deployment setup and a Windows correction: the original shell-based prepare command failed locally, so a small Node script replaced it. Local data and credentials stay outside Git and the Docker build context.

The boundaries are product promises as well as implementation rules. A client cannot choose a note's owner. A random HttpOnly browser cookie supplies identity, and its hash remains on the server. Visitors' text is escaped in HTML, input is validated independently of the form, and deletion checks ownership on every request. A hidden button is not a permission check. These requirements carry into the live version because broadcasting an update must not accidentally broadcast another person's authority.

## The first working interaction

The C8 implementation and tests are recorded in [bb161a4](https://github.com/comp4020-agentic-coding-studio/comp4020-final-RyoudoTeinei/commit/bb161a4). The sequence was implementation-led, followed by checks of the resulting promises. A note could be created, read from another browser, revisited through a permanent link, and removed by its owner. Pagination bounded each page without deleting the archive. A process restart test verified that a saved note and its ownership survived outside the original process.

Docker Desktop could not start locally. After I supplied the assigned token, Fly's remote builder produced the image and the live application passed its checks. [c5b651c](https://github.com/comp4020-agentic-coding-studio/comp4020-final-RyoudoTeinei/commit/c5b651c) adds a separate deployment check: create one temporary note, restart the actual Fly machine, find the note again, and remove it with its original identity. That supplied evidence about the deployed volume beyond a successful local database test.

## The C9 behaviour decision

I next asked the agent to implement the C9 brief. The important decision was what should change while someone is writing. Reloading a document would make its contents current, but could erase a draft and move focus. A manual updates banner would preserve a stable screen, but would not satisfy automatic real-time participation. Broadcasting unfinished text and typing indicators would create stronger co-presence at the cost of exposing the process of composing.

The chosen behaviour is to update published notes immediately while leaving the composer alone. The alternatives, costs, concurrent actions and reconnection semantics are recorded in docs/decisions/001-live-wall-local-drafts.md. This follows the README's low-pressure participation goal. The cost is not hidden: new notes may shift older cards, and the page is a live view rather than a frozen reading surface. Unsubmitted drafts survive connection interruption in an open tab, not closing that tab or manually reloading it.

## Implementation steps and convergence

[6ffc4c1](https://github.com/comp4020-agentic-coding-studio/comp4020-final-RyoudoTeinei/commit/6ffc4c1) implements server-sent events carrying only a change notice after a committed write or deletion. Each receiving browser fetches a snapshot using its own cookie, filter and page. Sending personalised HTML through a common broadcast would incorrectly share ownership controls; separating notification from retrieval avoids that. SQLite remains the source of truth, including after disconnection or a server restart.

The client serialises snapshot requests and remembers whether another update arrived while a request was running. Reconnection requests the current snapshot instead of replaying potentially obsolete events. A failed snapshot retries even if no further note is posted. The server sends heartbeats, removes disconnected subscribers and closes streams during shutdown. These measures keep the simple transport compatible with deployment and recovery.

Only the note area, count and pagination are updated. Unchanged cards retain their DOM nodes, including any deletion confirmation in progress. The composer is never replaced by a remote update. Submission clears the body only after acknowledgement and only if it still matches the submitted text, preserving a new draft typed while the request was pending. No keystrokes or presence list are shared.

## Evidence, sources and remaining judgement

The expanded local suite passes twelve tests. Its real-time check connects a second visitor, observes committed additions and deletions, verifies personalised snapshots and filters, and checks the reconnect notification. A client test preserves draft text, focus and selection through updates and reconnection. A real two-tab browser check also showed a new note arriving while the first window's draft and focus remained intact. These are reproducible observations, not invented peer feedback.

Robin Sloan's [home-cooked app essay](https://www.robinsloan.com/notes/home-cooked-app/) informs the small-audience argument. Commonplace differs by retaining contributions for later reflection. Its warm paper, quiet colours and readable note typography propose a slower participation style; C9 extends that intention into how updates treat the writer's attention. The README and reflection remain accounts for me to review as the author. Human evaluation still needs to establish whether this wall helps a group think together. C10 can add observability without changing that question.
