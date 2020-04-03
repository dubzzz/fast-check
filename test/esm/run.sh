#!/bin/sh

# Echo commands in the logs
set -x

# Autoquit on crash
set -e
# Return the exit status of the last command
set -o pipefail

#cd node-with-import
#yarn
#yarn link "fast-check"
#yarn run start
#diff expectedResult.txt out.txt
#cd ..

cd node-with-require
yarn
yarn link "fast-check"
yarn run start
diff expectedResult.txt out.txt
cd ..

cd rollup-with-import
yarn
yarn link "fast-check"
yarn run start
diff expectedResult.txt out.txt
cd ..

cd rollup-with-require
yarn
yarn link "fast-check"
yarn run start
diff expectedResult.txt out.txt
cd ..

cd webpack-with-import
yarn
yarn link "fast-check"
yarn run start
diff expectedResult.txt out.txt
cd ..

cd webpack-with-require
yarn
yarn link "fast-check"
yarn run start
diff expectedResult.txt out.txt
cd ..
