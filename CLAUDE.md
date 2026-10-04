# Commonplace development rules

Read README.md before changing behaviour. This is a public studio wall for a small group. Do not add scores, accounts, feeds, or other large features without a reason tied to that purpose.

## Boundaries

- Keep the course's fly.toml machine, volume and port settings intact. Persist application data only under DATA_DIR (production: /data).
- Preserve spec/invariants.test.ts and the course CI checks. Publish the complete current README at /readme/ in server-rendered HTML.
- Never report a note as saved until SQLite has acknowledged its write. Preserve the form on network or validation failure.
- Render user content as text. Use SQL parameters, never string interpolation of user data.
- The client never chooses the owner. Identify a browser using a random HttpOnly, SameSite cookie; do not expose the token or its hash in API responses or HTML.
- Only the owning browser may delete a note. Names are labels, not authentication. Keep that limitation visible before posting.
- Require JSON for mutations and reject foreign browser origins. Keep CSP and server validation enabled.
- No fake user activity. Demonstration notes must be clearly labelled and confined to local testing.
- Maintain keyboard labels, visible focus, phone layout, and honest loading/error states. Do not rely on colour alone to communicate categories.

## Workflow and completion

Keep commits small and cite actual commits in PROCESS.md. Record the agent's proposals as proposals; do not invent student feedback, peer testing, or personal experiences. Review README and reflection language with the student before submission.

After server changes run pnpm check against a running local app; include regression tests for broken persistence or ownership promises. Run pnpm check:evidence after documentation changes. Inspect browser behaviour when changing interactive controls. CI/container and live-Fly verification remain separate from local testing.

C8 is complete only when the core interaction works, data persists, /readme/ is present, documentation is reviewed, and the assigned Fly URL works. Local checks alone do not mean shipped. C9 adds real-time behaviour; C10 adds observability. Keep future promises separate from current behaviour.
