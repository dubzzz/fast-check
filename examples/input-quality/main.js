/**
 * :: input-quality ::
 * 
 * In property based testing, the quality of the input might proved very important.
 * 
 * The following, so called classifier in fast-check, show some relevant features
 * that you might want when generating your inputs.
 * 
 * In order to ease the measurements of quality, fast-check comes with some helpers:
 * - `fc.sample` to extract samples of the data that would be generated
 * - `fc.statistics` to measure statistics on characteristics of it
 */

const fc = require('../../lib/fast-check');
const { printSample } = require('./print');
const SAMPLE_SIZE = 10;

printSample(`integer`, fc.sample(fc.integer(), SAMPLE_SIZE));

/*const classifier = (v) => {
    let list = [];
    for (let idx = 0 ; idx != 32 ; ++idx) {
        const mask = 1 << idx;
        if (v & mask) {
            list.push(`${'.'.repeat(32-idx-1)}1${'.'.repeat(idx)}`);
        }
    }
    return list;
};
const classifierLorem = (v) => v.split(' ')
                                .filter(w => w != '' && w != '.')
                                .map(w => w[w.length-1] == '.' ? w.slice(0, -1) : w)
                                .map(w => w.toLowerCase());
const classifierLoremBis = (v) => v.split(' ')
                                .filter(w => w != '' && w != '.')
                                .map(w => w[w.length-1] == '.' ? w.slice(0, -1) : w)
                                .map(w => `${w.length} character(s)`);
const classifierLoremBisBis = (v) => v.split(' ')
                                .filter(w => w != '' && w != '.')
                                .length + " words";
const classifierBase64 = (v) => v.split('').filter(c => c == '=').length + " equal signs";
const classifierBase64Bis = (v) => v.split('').filter(c => c != '=');
const classifierBase64BisBis = (v) => v.length + " character(s)";
const classifierDouble = (v) => {
    for (let r = 1., id = 0 ; r != 0. ; r /= 2., ++id) {
        if (r < v) {
            return `Just below 2^${id}`;
        }
    }
    return "unknown";
};
const classifierDoubleBis = (v) => {
    const epsillon = 1. / 8.;
    const id = Math.floor(v / epsillon);
    return `[ ${id * epsillon} ; ${(id +1) * epsillon} [`;
};

fc.statistics(fc.integer(), classifier, 100000);
fc.statistics(fc.lorem(5, 'sentences'), classifierLorem, 100000);
fc.statistics(fc.lorem(5, 'sentences'), classifierLoremBis, 100000);
fc.statistics(fc.lorem(5, 'sentences'), classifierLoremBisBis, 100000);
fc.statistics(fc.base64String(), classifierBase64, 100000);
fc.statistics(fc.base64String(), classifierBase64Bis, 100000);
fc.statistics(fc.base64String(), classifierBase64BisBis, 100000);
fc.statistics(fc.float(), classifierDouble, 100000);
fc.statistics(fc.double(), classifierDouble, 100000);
fc.statistics(fc.float(), classifierDoubleBis, 100000);
fc.statistics(fc.double(), classifierDoubleBis, 100000);

console.log(fc.sample(fc.base64String(), 10).join('\n'));
console.log(fc.sample(fc.lorem(5, 'sentences'), 10).join('\n'));
*/