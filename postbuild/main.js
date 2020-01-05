// eslint-disable-next-line
const replace = require('replace-in-file');

const options = {
  files: 'lib/**/*.js',
  from: [/from '\.(.*)(?<!\.js)'/g, /from "\.(.*)(?<!\.js)"/g],
  to: ["from '.$1.js'", 'from ".$1.js"']
};

const results = replace.sync(options);
for (const { file, hasChanged } of results) {
  if (hasChanged) {
    // eslint-disable-next-line
    console.info(`Extensions added to: ${file}`);
  }
}
