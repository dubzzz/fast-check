Before opening a pull request, make sure to follow these guidelines:

## PR Title / Naming Convention

Follow the [gitmoji](https://gitmoji.dev/) specification:

- **For changes to the main `fast-check` package**: `emoji Description`
  - Example: `✨ Add new arbitrary for dates`
  - Example: `🐛 Fix edge case in integer shrinking`

- **For changes to other packages** (ava, vitest, jest, worker, poisoning, packaged): `emoji(package-name) Description`
  - Example: `👷(vitest) Add support for new vitest features`
  - Example: `🐛(jest) Fix compatibility with jest 29`

Limit the description part (after the emoji/package prefix) to at most 50 characters.

Common gitmoji:
- ✨ New features
- 🐛 Bug fix
- 📝 Documentation
- ✅ Tests
- 🏷️ Types
- ⚡️ Performance
- 👷 CI/CD
- ♻️ Refactor
- 🔧 Configuration
- 🎨 Code structure/format
- 🔥 Remove code or files
- ⬆️ Upgrade dependencies
- 🗑️ Deprecate

## PR Body / Template

Always use the PR template from `.github/PULL_REQUEST_TEMPLATE.md`. The body must include:

1. **Description** section — short description and link to related issues
2. **Checklist** section — keep all checklist items; only check boxes that are fulfilled

Do not delete, reorder, or skip any sections or checklist items from the template.
