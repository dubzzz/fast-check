#!/bin/sh

#cd node-with-import
#yarn
#yarn link "fast-check"
#yarn run start
#diff expectedResult.txt out.txt
#retcode=$?
#if [ $retcode != 0 ]; then
#    echo "node-with-import failed"
#    exit 1
#fi
#cd ..

cd node-with-require
yarn
yarn link "fast-check"
yarn run start
diff expectedResult.txt out.txt
retcode=$?
if [ $retcode != 0 ]; then
    echo "node-with-require failed"
    exit 1
fi
cd ..

cd rollup-with-import
yarn
yarn link "fast-check"
yarn run start
diff expectedResult.txt out.txt
retcode=$?
if [ $retcode != 0 ]; then
    echo "rollup-with-import failed"
    exit 1
fi
cd ..

cd rollup-with-require
yarn
yarn link "fast-check"
yarn run start
diff expectedResult.txt out.txt
retcode=$?
if [ $retcode != 0 ]; then
    echo "rollup-with-require failed"
    exit 1
fi
cd ..

cd webpack-with-import
yarn
yarn link "fast-check"
yarn run start
diff expectedResult.txt out.txt
retcode=$?
if [ $retcode != 0 ]; then
    echo "webpack-with-import failed"
    exit 1
fi
cd ..

cd webpack-with-require
yarn
yarn link "fast-check"
yarn run start
diff expectedResult.txt out.txt
retcode=$?
if [ $retcode != 0 ]; then
    echo "webpack-with-require failed"
    exit 1
fi
cd ..

exit 0