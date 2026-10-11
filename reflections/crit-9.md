# Crit 9 — All at once

## What was the breakthrough that moved the work forward?

The breakthrough was separating the shared wall from the private act of composing. Making everything live would have been an easy slogan, but it would not explain what another person's action should interrupt. The useful boundary is publication: saved notes and removals are shared immediately, while unfinished text stays in its own browser.

I asked the agent to implement the C9 requirements after reviewing the brief. It used server-sent events as change notifications and fetched a fresh, personalised snapshot for each viewer. This also gives reconnection a clear meaning: show what exists now, including deletions, rather than reconstructing the wall from an event history.

The local two-tab check made the decision tangible. One page kept an unfinished draft and keyboard focus while the other posted a note; the note appeared without refreshing the first page. Automated tests cover the same boundary as well as ownership and reconnection. This is implementation evidence, not feedback from a crit group.

## What did this work change about who I want to be as a software developer?

This stage makes interruption a concrete design concern. A system can be technically fast while still being unpleasant if updates erase input or move attention unnecessarily. The existing quiet visual style needs an equally considerate interaction model.

The remaining trade-off is visible: new notes can shift the wall, and drafts survive network interruption only while the page stays open. Recording these limits is more useful than calling the feature seamless. The next evaluation should ask whether the shared wall actually helps a small group think together.
