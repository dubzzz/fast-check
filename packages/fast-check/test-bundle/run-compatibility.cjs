const fc = require('fast-check');
const checkCompatibility = require('./fixtures/compatibility.cjs');

checkCompatibility(fc).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
