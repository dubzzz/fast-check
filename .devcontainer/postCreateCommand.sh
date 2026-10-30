#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Keep NVS available for switching Node versions and running legacy bundle tests.
# Use the same release and commit as the legacy bundle job in CI.
export NVS_HOME="${NVS_HOME:-$HOME/.nvs}"
if [ ! -d "$NVS_HOME" ]; then
  git clone --branch v1.7.1 --depth 1 https://github.com/jasongin/nvs "$NVS_HOME"
fi
if [ "$(git -C "$NVS_HOME" rev-parse HEAD)" != "b87ae9593cd20e7b667e9099240c9befeb50659f" ]; then
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
