const fc = require('../lib/fast-check');
const { run } = require('./tasks');

for (let idx = 0 ; idx !== 20 ; ++idx) {
    run(fc);
}
