#!/bin/bash
set -x

# Install locked dependencies
#corepack enable
yarn install --immutable

# Pre-download node version in nvs
CURRENT_NODE_VERSION=`node --version`
nvs add "$CURRENT_NODE_VERSION"