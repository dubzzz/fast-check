# Format PR GitHub Action

This GitHub Action allows you to automatically format code in pull requests or branches using the project's `pnpm format` script.

## Usage

### Manual Trigger

1. Go to the [Actions tab](https://github.com/dubzzz/fast-check/actions) in the repository
2. Click on "Format PR" workflow
3. Click "Run workflow"
4. Fill in the required parameters:
   - **Type of reference**: Choose either "branch" or "pull_request"
   - **Branch name or PR number**:
     - For branches: Enter the branch name (e.g., `feature/my-branch`)
     - For PRs: Enter the PR number (e.g., `123`)

### What it does

1. **Validates input**: Ensures PR numbers are numeric and branch names don't contain spaces
2. **Checks out the target**: Fetches the specified branch or PR
3. **Sets up environment**: Installs pnpm and project dependencies
4. **Checks formatting**: Runs `pnpm format:check` to see if changes are needed
5. **Applies formatting**: If needed, runs `pnpm format` to fix formatting issues
6. **Commits changes**: Creates a commit with formatted code and pushes back to the branch/PR

### Example scenarios

- **Format a PR**: Select "pull_request" and enter PR number like `456`
- **Format a branch**: Select "branch" and enter branch name like `fix-formatting-issues`

### Notes

- The action will only commit changes if formatting modifications are actually needed
- Commits are made by the `github-actions[bot]` user
- The action requires write permissions to the repository
