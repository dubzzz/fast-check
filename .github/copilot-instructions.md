# GitHub Copilot Instructions

## Repository Overview

**fast-check** is a property-based testing framework for JavaScript/TypeScript, similar to QuickCheck. It allows developers to test code by generating random test cases and checking that properties hold true across all inputs.

- **Primary Language**: TypeScript
- **Target Runtimes**: Node.js ≥12.17.0, ES2020+
- **Package Manager**: pnpm 10.26.0 (managed via corepack)
- **Test Framework**: Vitest 4.x
- **Build Tool**: TypeScript Compiler (tsc)
- **Monorepo Structure**: 8 packages using pnpm workspaces

### Packages

1. **fast-check** (main): Core property-based testing framework (~220 TypeScript files)
2. **@fast-check/ava**: Integration with Ava test runner
3. **@fast-check/jest**: Integration with Jest test runner
4. **@fast-check/vitest**: Integration with Vitest test runner
5. **@fast-check/worker**: Worker pool utilities
6. **@fast-check/poisoning**: Testing utilities for preventing prototype pollution
7. **@fast-check/packaged**: Package validation utilities
8. **@fast-check/expect-type**: Type testing utilities

## Build and Development Workflow

### Initial Setup

**ALWAYS run these commands in this exact order when first cloning the repository:**

```bash
corepack enable pnpm           # Enable pnpm (required on first setup)
pnpm install --frozen-lockfile # Install all dependencies (takes ~15-20s)
pnpm --filter fast-check build # Build the main package (takes ~30-40s)
```

**CRITICAL**: You MUST build packages before running typecheck or tests that depend on them.

### Build Commands

- **Build all packages**: `pnpm build:all` (~40s clean build)
- **Build for CI**: `pnpm build-ci:all` (requires GITHUB_SHA environment variable)
- **Build single package**: `pnpm --filter <package-name> build`
  - Example: `pnpm --filter fast-check build`

**Build Order Dependency**: The main `fast-check` package must be built before other packages can be type-checked or tested, as they depend on it.

### Validation Commands

**ALWAYS run these before committing changes:**

1. **Format check/fix**:
   - Check: `pnpm format:check` (~15s)
   - Fix: `pnpm format`
   - Uses Prettier 3.7.4

2. **Lint check/fix**:
   - Check: `pnpm lint:check` (~15s)
   - Fix: `pnpm lint`
   - Uses ESLint 9 with TypeScript ESLint

3. **Type checking**:
   - `pnpm typecheck:all` (~20s)
   - **REQUIRES**: Packages must be built first (especially fast-check)
   - Will fail with "Cannot find module" errors if packages aren't built

4. **Tests**:
   - All tests: `pnpm test` (can take several minutes)
   - With coverage: `pnpm test:coverage`
   - Single package: `pnpm --filter <package-name> test`
   - Specific test file: `pnpm test <path-to-test>`

### Common Build Issues and Workarounds

1. **TypeScript "Cannot find module" errors during typecheck**:
   - **Cause**: Packages not built yet
   - **Fix**: Run `pnpm build:all` first

2. **Windows unpack failures** (in CI):
   - The unpack command may fail when overwriting existing files
   - Workaround: `pnpm run unpack:all || true` (already in CI workflow)

3. **pnpm not found**:
   - **Fix**: Run `corepack enable pnpm` first
   - This downloads and activates the correct pnpm version

4. **GITHUB_SHA required for build-ci**:
   - **Fix**: Set `EXPECT_GITHUB_SHA=true` environment variable
   - Only needed for CI builds, not local development

## Project Structure

### Root Directory Files

```
.github/              # GitHub Actions workflows and configurations
  workflows/          # CI/CD pipelines (build-status.yml is main)
  copilot-instructions.md
.changeset/           # Changesets for version management
packages/             # All publishable packages
  fast-check/         # Main package
    src/              # TypeScript source code
      arbitrary/      # Arbitrary generators
      check/          # Testing framework core
      random/         # Random number generation
      stream/         # Stream utilities
      utils/          # Helper utilities
    test/             # Test files
    lib/              # Build output (gitignored)
examples/             # Usage examples
website/              # Documentation website (Docusaurus)
eslint.config.mjs     # ESLint configuration (Flat config)
tsconfig.*.json       # TypeScript configurations
vitest.config.mjs     # Vitest configuration
pnpm-workspace.yaml   # pnpm workspace configuration
package.json          # Root package with scripts
```

### Key Configuration Files

- **eslint.config.mjs**: ESLint flat config, TypeScript-aware
- **tsconfig.common.json**: Shared TypeScript settings
- **tsconfig.publish.json**: Build configuration for published code
- **vitest.config.mjs**: Test runner configuration with workspace projects
- **.prettierrc**: Code formatting rules

## CI/CD Pipeline

### GitHub Actions Workflows

1. **build-status.yml** (main workflow):
   - Runs on: Push to main, PRs
   - Jobs:
     - `warmup_pnpm_cache`: Installs dependencies
     - `format_lint`: Checks formatting and linting
     - `production_packages`: Builds all packages (~40s)
     - `typecheck`: Type checks after building
     - `test`: Runs tests on multiple OS/Node versions
     - `preview`: Creates package previews for PRs
   - Node versions tested: 20.x, 22.x, 24.x, latest
   - OS tested: Ubuntu, macOS, Windows

2. **validate-pr-title.yml**: Validates PR titles follow gitmoji format

3. **pr-format.yml**: Auto-formats code in PRs

4. **codeql-analysis.yml**: Security scanning

### Pre-commit Validation

To ensure your changes pass CI, run locally:

```bash
pnpm format:check  # Formatting
pnpm lint:check    # Linting
pnpm build:all     # Build all packages
pnpm typecheck:all # Type checking
pnpm test          # Run tests
```

## Making Changes

### Adding a New Arbitrary

1. Create file in `packages/fast-check/src/arbitrary/`
2. Add unit tests in `packages/fast-check/test/unit/arbitrary/`
3. Add integration tests using test helpers (see CONTRIBUTING.md)
4. Update `packages/fast-check/test/e2e/NoRegression.spec.ts` snapshot
5. Add to documentation

### Modifying Code

1. Make minimal changes to source files
2. Run `pnpm format` to auto-format
3. Run `pnpm lint` to fix linting issues
4. Run `pnpm --filter fast-check build` to rebuild
5. Run tests: `pnpm --filter fast-check test`
6. Before committing, run full validation (see above)

### Changesets for Version Management

**ALWAYS create a changeset for code changes:**

```bash
pnpm bump  # Interactive changeset creation
```

- Choose appropriate semver level:
  - **patch**: Bug fixes, no breaking changes
  - **minor**: New features, backward compatible
  - **major**: Breaking changes
  - **decline**: No version bump (for internal/private packages)

**IMPORTANT**: Internal packages (@fast-check/packaged, etc.) should always use "decline" as they're not versioned independently.

## Common Patterns and Conventions

### Code Style

- **Formatting**: Prettier 3.7.4 (enforced)
- **Linting**: ESLint 9 with TypeScript ESLint plugin
- **Import style**: ES modules (type: "module" in package.json)
- **Type imports**: Use `import type` for type-only imports
- **Exports**: Explicit module boundary types required

### Testing

- **Framework**: Vitest 4.x
- **Test location**: `test/` directory in each package
- **Test naming**: `*.spec.ts` or `*.test.ts`
- **Coverage**: Run with `pnpm test:coverage`

### Build Output

- **ESM**: `lib/*.js` with `lib/types/*.d.ts`
- **CJS**: `lib/cjs/*.js` with `lib/cjs/types/*.d.ts`
- **Legacy types**: `lib/types57/*.d.ts` for TypeScript <5.7

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

Limit the name of the PR to at most 50 characters for the Description part (that is, the text after the `emoji` or `emoji(package-name)` prefix).

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

## Trust These Instructions

These instructions have been validated through actual execution of commands in the repository. If you encounter issues not covered here, check:

1. CONTRIBUTING.md for contributor guidelines
2. README.md in packages/fast-check/ for usage documentation
3. GitHub Actions workflows in .github/workflows/ for CI details

Only perform exploratory searches if the information above is incomplete or you encounter unexpected errors.
