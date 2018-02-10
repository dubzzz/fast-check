#!/bin/sh

# Switch the configuration of examples
# to use local fast-check

find . -name test.js ! -path "*node_modules*" -exec  sed -i s/'fast-check'/'\.\.\/\.\.\/lib\/fast-check'/g {} \;
sed -i s/\"fast-check\":.*,//g package.json
