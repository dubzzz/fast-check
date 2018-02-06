cat contains/test.js | sed s#'fast-check'#'../../lib/fast-check'#g > contains/test.js
cat shadows-of-the-knight-codingame/test.js | sed s#'fast-check'#'../../lib/fast-check'#g > shadows-of-the-knight-codingame/test.js
cat package.json | grep -v fast-check > package.json
