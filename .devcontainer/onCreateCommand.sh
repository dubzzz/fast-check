#!/bin/bash
set -x

# Setup nvs
source nvs.sh
echo "source nvs.sh" >> ~codespace/.bashrc
nvs add 18
nvs use 18

# Enable corepack
corepack enable