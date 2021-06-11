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
    cd node-with-import
    yarn run dry
    yarn run start
    diff expectedResult.txt out.txt
    cd ..

    cd node-extension-mjs
    yarn run dry
    yarn run start
    diff expectedResult.txt out.txt
    cd ..
fi

cd node-extension-cjs
yarn run dry
yarn run start
diff expectedResult.txt out.txt
cd ..

cd node-with-require
yarn run dry
yarn run start
diff expectedResult.txt out.txt
cd ..

cd rollup-with-import
yarn run dry
yarn run start
diff expectedResult.txt out.txt
cd ..

cd rollup-with-require
yarn run dry
yarn run start
diff expectedResult.txt out.txt
cd ..

cd webpack-with-import
yarn run dry
yarn run start
diff expectedResult.txt out.txt
cd ..

cd webpack-with-require
yarn run dry
yarn run start
diff expectedResult.txt out.txt
cd ..

cd esbuild-with-require
yarn run start
diff expectedResult.txt out.txt
cd ..

cd esbuild-with-import
yarn run start
diff expectedResult.txt out.txt
cd ..
