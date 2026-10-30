#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Read the NVS release and commit from CI so updates have a single source of truth.
ci_workflow=".github/workflows/build-status.yml"
nvs_version="$(sed -nE 's@^[[:space:]]*git clone --branch (v[0-9]+\.[0-9]+\.[0-9]+) --depth 1 https://github\.com/jasongin/nvs "\$NVS_HOME"[[:space:]]*$@\1@p' "$ci_workflow")"
nvs_commit="$(sed -nE 's/^[[:space:]]*if \[ "\$\(git -C "\$NVS_HOME" rev-parse HEAD\)" != "([0-9a-f]{40})" \]; then[[:space:]]*$/\1/p' "$ci_workflow")"
if ! [[ "$nvs_version" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ && "$nvs_commit" =~ ^[0-9a-f]{40}$ ]]; then
  echo "ERROR: Expected exactly one NVS release and commit pin in $ci_workflow" >&2
  exit 1
fi

# Keep NVS available for switching Node versions and running legacy bundle tests.
export NVS_HOME="${NVS_HOME:-$HOME/.nvs}"
if [ ! -d "$NVS_HOME" ]; then
  git clone --branch "$nvs_version" --depth 1 https://github.com/jasongin/nvs "$NVS_HOME"
fi
if [ "$(git -C "$NVS_HOME" rev-parse HEAD)" != "$nvs_commit" ]; then
  echo "ERROR: NVS is not at the expected commit" >&2
  exit 1
fi
for profile in .bashrc .zshrc; do
  NVS_SHELL_PROFILE="$HOME/$profile" "$NVS_HOME/nvs" install
done

# Follow https://pnpm.io/installation#in-a-docker-container, using the repository's version.
pnpm_version="$(node -p "require('./package.json').devEngines.packageManager.version")"
export PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"
export PATH="$PNPM_HOME/bin:$NVS_HOME:$PATH"
pnpm_installer="$(mktemp)"
trap 'rm -f "$pnpm_installer"' EXIT
curl -fsSL https://get.pnpm.io/install.sh -o "$pnpm_installer"
env PNPM_VERSION="$pnpm_version" ENV="$HOME/.bashrc" SHELL="$(command -v bash)" bash "$pnpm_installer"

# Install locked dependencies
pnpm install --frozen-lockfile --ignore-scripts
