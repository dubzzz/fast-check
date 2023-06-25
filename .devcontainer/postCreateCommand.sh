#!/bin/bash
set -x

# Setup git lfs
git lfs install
git lfs pull

# Install locked dependencies
yarn install --immutable