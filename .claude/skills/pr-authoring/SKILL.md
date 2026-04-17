---
name: pr-authoring
description: Use whenever creating, drafting, or updating a pull request (title or body) for the dubzzz/fast-check repository, including via the mcp__github__create_pull_request and mcp__github__update_pull_request tools.
---

# Authoring a pull request for fast-check

## Title — gitmoji convention

See `CONTRIBUTING.md` (§ "Naming your pull request") and
`.github/copilot-instructions.md` for the full emoji mapping.

- Main package: `emoji Description`
- Other packages: `emoji(scope) Description`
  - Scopes: `ava`, `jest`, `vitest`, `worker`, `poisoning`, `packaged`
- The Description part must be ≤ 50 characters.

Common emojis: ✨ feature · 🐛 fix · 📝 docs · ✅ tests · 🏷️ types ·
⚡️ perf · ♻️ refactor · 🔧 config · 🎨 style · 🔥 remove ·
⬆️ upgrade deps · ⬇️ downgrade deps · 🗑️ deprecation · 👷 CI.

## Body — always use the template

1. Copy `.github/PULL_REQUEST_TEMPLATE.md` **verbatim**. Keep every
   section and every checklist item, in order. Do not delete, rename,
   or reorder anything.
2. **Never tick a checkbox.** Every `- [ ]` stays unchecked — the
   reviewer (or the author during review) ticks them.
3. Link the issue with `Fixes #<n>` when one exists.

## Description section — required order

1. **End-user point of view first.** What does this PR bring to users?
   New capability, fixed behavior, changed default, …? Call out any
   implied changes: breaking changes, migration steps, perf
   characteristics, deprecations.
2. **Then justify.** Why this change, why this design, main trade-offs
   considered — enough context for a reviewer to evaluate the approach.

## Enrich the description from the checklist

Don't tick the boxes, but use them as prompts to preempt reviewer
questions inside the description prose:

- **Impact level** — minor / patch / major (and mention if `pnpm run bump`
  or the changeset bot instructions were followed).
- **Single-concern scope** — state that the PR is focused, or explain
  why bundled changes belong together.
- **Tests** — which tests were added/updated, what they cover, and
  why they would have failed without this PR. If no tests, say why.
- **Gitmoji / scope** — the title itself is evidence; no need to restate.
- **Understanding of every line** — nothing to write, but keep it true.
