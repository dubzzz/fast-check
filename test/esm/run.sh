#!/bin/sh

# Echo commands in the logs
set -x

# Autoquit on crash
set -e

## Versions of node >=13.2.0 support es modules without any flag
#NODE_MAJOR=$(node --version | cut -d. -f 1 | cut -dv -f 2)
#NODE_MINOR=$(node --version | cut -d. -f 2)
#
#if [ $NODE_MAJOR -gt 13 ] || [ $NODE_MAJOR -eq 13 ] && [ $NODE_MINOR -ge 2 ]; then
#    cd node-with-import
#    yarn --frozen-lockfile --ignore-engines
#    yarn link "fast-check"
#    yarn run dry
#    yarn run start
#    diff expectedResult.txt out.txt
#    cd ..
#fi

cd node-with-require
yarn --frozen-lockfile --ignore-engines
yarn link "fast-check"
yarn run dry
yarn run start
diff expectedResult.txt out.txt
cd ..

cd rollup-with-import
yarn --frozen-lockfile --ignore-engines
yarn link "fast-check"
yarn run dry
yarn run start
diff expectedResult.txt out.txt
cd ..

cd rollup-with-require
yarn --frozen-lockfile --ignore-engines
yarn link "fast-check"
yarn run dry
yarn run start
diff expectedResult.txt out.txt
cd ..

cd webpack-with-import
yarn --frozen-lockfile --ignore-engines
yarn link "fast-check"
yarn run dry
yarn run start
diff expectedResult.txt out.txt
cd ..

cd webpack-with-require
yarn --frozen-lockfile --ignore-engines
yarn link "fast-check"
yarn run dry
yarn run start
diff expectedResult.txt out.txt
cd ..
