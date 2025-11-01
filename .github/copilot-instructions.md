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

- ✨ `:sparkles:` - Introduce new features
- 🐛 `:bug:` - Fix a bug
- 📝 `:memo:` - Add or update documentation
- ✅ `:white_check_mark:` - Add or update tests
- 🏷️ `:label:` - Add or update types
- ⚡️ `:zap:` - Improve performance
- 👷 `:construction_worker:` - Add or update CI/CD
- ♻️ `:recycle:` - Refactor code
- 🔧 `:wrench:` - Add or update configuration files
- 🎨 `:art:` - Improve structure/format of the code
- 🔥 `:fire:` - Remove code or files
- 🚀 `:rocket:` - Deploy stuff
- 🔒️ `:lock:` - Fix security or privacy issues
- ⬆️ `:arrow_up:` - Upgrade dependencies
- ⬇️ `:arrow_down:` - Downgrade dependencies
- 📦 `:package:` - Add or update compiled files or packages

For a complete list of gitmoji codes, see https://gitmoji.dev/
