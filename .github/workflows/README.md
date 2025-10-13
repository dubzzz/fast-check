# GitHub Actions Workflows

This directory contains the GitHub Actions workflows for the fast-check repository.

## Available Workflows

### Add Contributor

**File:** `add-contributor.yml`

**Purpose:** Automatically add a new contributor to the project using the all-contributors specification.

**How to use:**

1. Go to the [Actions tab](https://github.com/dubzzz/fast-check/actions/workflows/add-contributor.yml) in the repository
2. Click "Run workflow"
3. Enter the required information:
   - **username**: The GitHub username of the contributor (without the @ symbol)
   - **contribution**: The type of contribution (e.g., `code`, `doc`, `test`, `design`, `infra`)
4. Click "Run workflow"

The workflow will:
- Add the contributor to `.all-contributorsrc`
- Update `packages/fast-check/README.md` with the contributor information
- Format all modified files using prettier
- Create a new branch named `contributor/add-{username}`
- Open a pull request with the changes

**Example:**
- Username: `johndoe`
- Contribution: `doc`

**Supported contribution types:**

See the [all-contributors emoji key](https://allcontributors.org/docs/en/emoji-key) for the full list of contribution types.

Common types include:
- `code`: Code contributions
- `doc`: Documentation
- `test`: Tests
- `design`: Design
- `infra`: Infrastructure (CI/CD, build tools, etc.)
- `maintenance`: Repository maintenance
- `question`: Answering questions
- `plugin`: Plugin/utility libraries

### Other Workflows

- **build-status.yml**: Runs tests and checks on PRs and main branch
- **generate-changelog.yml**: Generates changelog from changesets
- **safe-release.yml**: Handles the release process
- **codeql-analysis.yml**: Runs CodeQL security analysis
- **scorecard.yml**: OpenSSF Scorecard security checks
