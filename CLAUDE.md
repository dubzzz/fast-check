# Claude guidance for fast-check

## Default workflow: work as a team

**Prefer multiple agents over a single pass.** fast-check spans
performance, memory, determinism, API compatibility, cross-package
hygiene, and community signals. A single pass-through by one agent
will almost always miss at least one of these axes, so the default
entry point for any non-trivial task is the multi-agent review team
under `.claude/agents/`.

**Use the team by default.** For any task beyond a typo fix or a
one-line rename, delegate to the `review-orchestrator` subagent
first. It fans out to the twelve specialists in parallel
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
