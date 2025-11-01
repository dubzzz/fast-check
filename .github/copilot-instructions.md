# GitHub Copilot Instructions

## Pull Request Naming Convention

When creating or naming pull requests, follow the [gitmoji](https://gitmoji.dev/) specification:

### Format

- **For changes to the main `fast-check` package**: Use the format `emoji Description`
  - Example: `✨ Add new arbitrary for dates`
  - Example: `🐛 Fix edge case in integer shrinking`

- **For changes to other packages** (ava, vitest, jest, worker, poisoning, packaged, expect-type): Use the format `emoji(package-name) Description`
  - Example: `👷(vitest) Add support for new vitest features`
  - Example: `🐛(jest) Fix compatibility with jest 29`
  - Example: `📝(ava) Update documentation for ava integration`

### Common Gitmoji Examples

- ✨ Introduce new features
- 🐛 Fix a bug
- 📝 Add or update documentation
- ✅ Add or update tests
- 🏷️ Add or update types
- ⚡️ Improve performance
- 👷 Add or update CI/CD
- ♻️ Refactor code
- 🔧 Add or update configuration files
- 🎨 Improve structure/format of the code
- 🔥 Remove code or files
- 🚀 Deploy stuff
- 🔒️ Fix security or privacy issues
- ⬆️ Upgrade dependencies
- ⬇️ Downgrade dependencies
- 📦 Add or update compiled files or packages

For a complete list of gitmoji codes, see https://gitmoji.dev/
