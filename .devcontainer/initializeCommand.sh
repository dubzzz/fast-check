#!/bin/bash
set -x

# Setup nvs
nvs add 18
nvs use 18
echo "source nvs.sh" >> ~/.bashrc

# Enable corepack
corepack enable