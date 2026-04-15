# Claude Code Configuration

## Pull Request Guidelines

When creating pull requests, always use the PR template located at `.github/PULL_REQUEST_TEMPLATE.md`. Specifically:

- The PR body must follow the template structure with a **Description** section and a **Checklist** section.
- Fill in the Description section with a clear explanation of what the PR changes and why.
- Link related issues with `Fixes #<number>` when applicable.
- Keep all checklist items from the template and check off the ones that have been satisfied.
- Follow the [gitmoji](https://gitmoji.dev/) specification for PR titles, including the package scope when the change targets a package other than `fast-check` (e.g. `🐛(vitest) Something...`).
- Run `pnpm run bump` to flag the impact of the change (minor / patch / major) before opening the PR, or note that the changeset bot should be followed.
- Keep PRs focused on a single concern — do not bundle unrelated changes.
