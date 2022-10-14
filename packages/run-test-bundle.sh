#!/bin/sh
set -x # Echo commands in the logs
set -e # Autoquit on crash

## Versions of node >=13.2.0 support es modules without any flag
## Versions 12.x of node >=12.18.0 support es modules without any flag
NODE_MAJOR=$(node --version | cut -d. -f 1 | cut -dv -f 2)
NODE_MINOR=$(node --version | cut -d. -f 2)

if [ $NODE_MAJOR -gt 13 ] || [ $NODE_MAJOR -eq 13 ] && [ $NODE_MINOR -ge 2 ] || [ $NODE_MAJOR -eq 12 ] && [ $NODE_MINOR -ge 18 ]; then
    yarn workspace @fast-check/test-bundle-node-with-import test
    yarn workspace @fast-check/test-bundle-node-extension-mjs test
fi
yarn workspace @fast-check/test-bundle-node-extension-cjs test
yarn workspace @fast-check/test-bundle-node-with-require test
if [ $NODE_MAJOR -gt 14 ] || [ $NODE_MAJOR -eq 14 ] && [ $NODE_MINOR -ge 18 ]; then
    yarn workspace @fast-check/test-bundle-rollup-with-import test
    yarn workspace @fast-check/test-bundle-rollup-with-require test
fi
yarn workspace @fast-check/test-bundle-webpack-with-import test
yarn workspace @fast-check/test-bundle-webpack-with-require test
yarn workspace @fast-check/test-bundle-esbuild-with-require test
yarn workspace @fast-check/test-bundle-esbuild-with-import test
