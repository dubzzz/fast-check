#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Install the package manager version declared by the repository.
pnpm_version="$(node -p "require('./package.json').devEngines.packageManager.version")"
npm install --global --ignore-scripts "pnpm@${pnpm_version}"

# Install locked dependencies
pnpm install --frozen-lockfile --ignore-scripts
