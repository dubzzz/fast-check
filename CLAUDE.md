# Claude guidance for fast-check

## Default workflow: spawn an orchestrator, work as a squad

**Mandatory entry point — always spawn the orchestrator.** For any
feature request, redesign, extension, or non-trivial change in
fast-check, your **first action is to spawn the `review-orchestrator`
subagent**. You do not reason about the feature directly, you do not
edit code directly, you do not pick a design alone. You spawn the
orchestrator and let it lead.

**The orchestrator runs a squad, not a checklist.** It is responsible
for driving the request to completion by commanding every other agent
under `.claude/agents/` — hotheads, architects, perf, memory,
api-compatibility, api-ux, determinism, platform-integration,
security, test-plan-designer, documentation, pr-scope,
community-needs, clarification-seeker. The orchestrator picks who
speaks, in what order, in parallel or sequentially, and how often.

**No shortcuts on iterations or time.** The squad's mission is to
deliver the best possible design for the requested feature — *no
matter how many rounds of prototyping, review, refinement, and
re-review this takes, and no matter how long it takes*. The
orchestrator is explicitly instructed to keep spawning agents and
re-spawning them until every relevant expertise agrees on a coherent
direction. Budget is never a reason to cut a round short; ambiguity
is always a reason to add one more agent.

**Prefer multiple agents over a single pass.** fast-check spans
performance, memory, determinism, API compatibility, cross-package
hygiene, and community signals. A single pass-through by one agent
will almost always miss at least one of these axes, so the default
entry point for any non-trivial task is the multi-agent squad under
`.claude/agents/`.

**Use the squad by default.** For any task beyond a typo fix or a
one-line rename, delegate to the `review-orchestrator` subagent
first. The orchestrator runs one of two flows depending on the ask:

- **Implementation requests** (add / redesign / extend a capability):
  the orchestrator opens with **Phase I — parallel prototyping and
  iterative consensus**. It fans out one `hothead-prototyper` per
  design angle (as many as the problem needs — no cap), staggered
  across `haiku` / `sonnet` / `opus` to build a speed ladder. It then
  cross-examines the prototypes with the relevant specialists
  (`architecture`, `performance`, `memory-leak`, `api-compatibility`,
  `api-ux`, `determinism`, `platform-integration`, `test-plan-
  designer`, `security`), spawns refined hotheads on any angle that
  didn't pass, and **loops — prototype → review → refine → re-review
  — for as many iterations as it takes** until every relevant
  expertise signs off on one coherent direction. The hothead is
  always the first agent to intervene on implementation requests. The
  orchestrator escalates to the user only when expertises genuinely
  disagree on a trade-off, never to shorten the loop.
- **Review requests** (a diff already exists): the orchestrator skips
  Phase I and fans out the twelve specialists in parallel
  (`performance`, `memory-leak`, `architecture`,
  `platform-integration`, `documentation`, `test-plan-designer`,
  `community-needs`, `security`, `api-compatibility`, `determinism`,
  `api-ux`, `pr-scope`), funnels through `clarification-seeker` to
  lock down intent, and gates breaking changes / cross-package scope
  through `api-compatibility-reviewer` and `pr-scope-reviewer`.

**Exceptions.** Trivial edits, pure question-answering about the
codebase, and explicit "do X directly" instructions from the user
may bypass the orchestrator. Everything else goes through the team.

The orchestrator's final report feeds into the `pr-authoring` skill
for the actual PR step — it does not replace the skill.

## Pull requests

When opening or updating a pull request in this repo, follow the
`pr-authoring` skill at `.claude/skills/pr-authoring/SKILL.md`.
It covers the PR template, the gitmoji title format, the required
description structure, and the rule that checkboxes stay unchecked
(reviewers tick them, not the author).
