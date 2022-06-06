const fc = require('fast-check');
const { runComplexFailure, runArraySuccess } = require('./tasks');

const run = runArraySuccess;
for (let idx = 0; idx !== 20; ++idx) {
  run(fc);
}
