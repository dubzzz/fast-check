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

## Development Workflow

When making code changes to this repository, ensure you run the following commands as appropriate:

### Format

- **Check formatting**: `pnpm format:check`
- **Apply formatting**: `pnpm format`

Always run format checks before committing to ensure code follows the project's style guidelines enforced by our code formatter.

### Lint

- **Check linting**: `pnpm lint:check`
- **Fix linting issues**: `pnpm lint`

Run lint checks to ensure code follows the project's coding standards and best practices.

### Typecheck

- **Run typecheck**: `pnpm typecheck:all`

Run typecheck to ensure TypeScript types are correct across all packages.

### Build

- **Build all packages**: `pnpm build:all`

Build the project to ensure all packages compile correctly.
