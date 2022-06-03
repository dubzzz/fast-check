#!/bin/sh

# Echo commands in the logs
set -x

# Autoquit on crash
set -e

## Versions of node >=13.2.0 support es modules without any flag
## Versions 12.x of node >=12.18.0 support es modules without any flag
NODE_MAJOR=$(node --version | cut -d. -f 1 | cut -dv -f 2)
NODE_MINOR=$(node --version | cut -d. -f 2)

if [ $NODE_MAJOR -gt 13 ] || [ $NODE_MAJOR -eq 13 ] && [ $NODE_MINOR -ge 2 ] || [ $NODE_MAJOR -eq 12 ] && [ $NODE_MINOR -ge 18 ]; then
    cd test-bundle-node-with-import
    yarn test
    cd ..

    cd test-bundle-node-extension-mjs
    yarn test
    cd ..
fi

cd test-bundle-node-extension-cjs
yarn test
cd ..

cd test-bundle-node-with-require
yarn test
cd ..

cd test-bundle-rollup-with-import
yarn test
cd ..

cd test-bundle-rollup-with-require
yarn test
cd ..

cd test-bundle-webpack-with-import
yarn test
cd ..

cd test-bundle-webpack-with-require
yarn test
cd ..

cd test-bundle-esbuild-with-require
yarn test
cd ..

cd test-bundle-esbuild-with-import
yarn test
cd ..
