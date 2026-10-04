# Process overview

## From the brief to a first scope

I began by asking the agent to check this week's exercise, then asked it to start the work. The relevant shift was from another disposable weekly prototype to the first version of the final project. C8 required an application that a stranger could use, a persistent trace, a published definition of good, and process evidence. It did not require the complete real-time final project immediately. Separating those requirements gave the first iteration a practical stopping point: one shared interaction that could be demonstrated and tested.

I supplied the final-project repository after the agent could not access it through its GitHub connector. The repository was still the official placeholder. Git subsequently accessed it using the existing Windows credentials outside the restricted execution environment. The agent created a separate local development worktree so that implementation could proceed in the writable workspace. These were environment steps, not product features, but they mattered because work needed to remain attached to the actual course repository and its history.

The agent proposed Commonplace, a small shared studio wall, as the initial direction. This proposal has not yet been evaluated with a workshop or crit group. Its core interaction is leaving an idea, question, or discovery under a pseudonym and returning to it later. The wall is intentionally public. Browser identity distinguishes contributions without making account creation the first task. That is a scope decision with an explicit cost: a browser cookie is not a verified person, and losing it loses the ability to remove earlier notes.

## Modules, structure and constraints

The implementation was divided into four responsibilities: HTTP routes and server-rendered pages, SQLite persistence and ownership checks, browser interaction and responsive styling, and the course's existing test and evidence harness. The resulting structure is deliberately shallow: server.ts owns the application, public/ contains the browser assets, and spec/ contains executable promises. README.md is also an input to the running application, not a second manually copied page that can drift out of date.

The fixed infrastructure shaped the technical choice. The template provides one small Fly machine, 256 MB of memory, and one volume mounted at /data. Node's built-in HTTP server and SQLite were selected to avoid a separate database service and a production dependency installation step. SQLite is a reasonable match for short writes on one machine. Its synchronous API would become a liability for expensive queries or a much larger workload; the bounded page size and small intended audience make that trade-off visible rather than pretending the application is designed for arbitrary scale.

The infrastructure commit, [de1d75c](https://github.com/comp4020-agentic-coding-studio/comp4020-final-RyoudoTeinei/commit/de1d75c), replaces the placeholder container and excludes local data from Git and the Docker build context. It also repairs a concrete Windows problem: the template's shell-based prepare command used /dev/null and true, which failed under the local shell. A short Node script now configures hooks across platforms. The course's Fly resource settings and CI checks remain intact.

## Steps and convergence conditions

The implementation sequence started with storage and identity, then the write/read/delete routes, then the visible wall. A note has an ID, ownership hash, display name, category, text, and timestamp. A random browser token is kept in an HttpOnly cookie; only its hash is stored with notes. The public API omits that hash. SQL statements use bound parameters, and HTML output escapes visitor text. These details support the product promise that another visitor may read a note without acquiring the authority to remove it.

The client waits for a successful server response before navigating to the newly saved note. Validation or connection failure leaves the draft in the form. Category filters and permanent links make the stored trace findable instead of treating the latest screenful as the entire archive. Pagination bounds each page without deleting older contributions. Deletion requires a second explicit click and is checked again by the server; hiding a button is not the permission boundary.

The application and tests are recorded together in [bb161a4](https://github.com/comp4020-agentic-coding-studio/comp4020-final-RyoudoTeinei/commit/bb161a4). This iteration was implementation-led rather than a strict test-first cycle. The checks then made the stopping conditions concrete: two visitors see the same saved note, the second cannot delete it, malformed input is rejected, markup remains text, and restarting a process against the same database retains both the note and its owner. The course's two invariant checks remain part of the suite.

## Sources and visual decisions

Robin Sloan's [An app can be a home-cooked meal](https://www.robinsloan.com/notes/home-cooked-app/) informed the argument for a small intended audience. The README applies that idea to a workshop rather than claiming that a smaller feature list is inherently better. It also states a difference: Commonplace preserves contributions so people can revisit them. The technical choice was checked against the [Node SQLite documentation](https://nodejs.org/api/sqlite.html), while the actual installed Node runtime was used for execution and verification.

The visual proposal uses warm paper, dark green controls, and three softly coloured note types. Serif note text gives contributions a different voice from interface labels. Categories remain written out so colour is not the only cue. On a narrow screen, the composer and wall stack vertically. Browser inspection exposed a missing space when a heading's line break disappeared and cramped category labels; [5e8428f](https://github.com/comp4020-agentic-coding-studio/comp4020-final-RyoudoTeinei/commit/5e8428f) records those corrections. The page states that visitors must refresh for other people's additions, keeping the current behaviour separate from the later real-time milestone.

## What the evidence establishes

Local verification passed ten tests and TypeScript checking, and a browser submission produced a stored note with a permanent link. The restart test starts a separate process with a temporary data directory, writes a note, stops it, and starts another process against that directory. This is stronger evidence than refreshing one browser, but it still does not prove the Fly volume is configured correctly in deployment.

Docker Desktop failed to start locally, so the release used Fly's remote builder after I supplied the project's dedicated token. The image built successfully, and the live application passed the same ten checks. scripts/verify-deploy.mjs then created a temporary note, restarted the actual Fly machine, verified the trace survived, and removed its own note. This separates tested deployment persistence from the earlier local evidence. The README and reflection still need my review as the project's author. Future work should make the shared interaction respond live, then add observability, while continuing to revise what good means rather than merely accumulating features.
