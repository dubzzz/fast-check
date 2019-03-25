import { ipV4, ipV6 } from '../../../../src/check/arbitrary/IpArbitrary';

import * as genericHelper from './generic/GenericArbitraryHelper';

const isValidIpV4 = (i: string) => {
  if (typeof i !== 'string') return false;
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(i);
  if (m === null) return false;
  return [m[1], m[2], m[3], m[4]].every(g => {
    const n = +g;
    return n >= 0 && n <= 255 && String(n) === g;
  });
};
const isValidIpV6 = (i: string) => {
  if (typeof i !== 'string') return false;
  const firstElision = i.indexOf('::');
  if (firstElision !== -1) {
    // At most one '::'
    if (i.substr(firstElision + 1).includes('::')) return false;
  }
  const chunks = i.split(':');
  const endByIpV4 = isValidIpV4(chunks[chunks.length - 1]);

  const nonEmptyChunks = chunks.filter(c => c !== '');
  const hexaChunks = endByIpV4 ? nonEmptyChunks.slice(0, nonEmptyChunks.length - 1) : nonEmptyChunks;
  if (!hexaChunks.every(s => /^[0-9a-f]{1,4}$/.test(s))) return false;

  const equivalentChunkLength = endByIpV4 ? hexaChunks.length + 2 : hexaChunks.length;
  return firstElision !== -1 ? equivalentChunkLength < 8 : equivalentChunkLength === 8;
};

describe('IpArbitrary', () => {
  describe('ipV4', () => {
    genericHelper.isValidArbitrary(() => ipV4(), {
      isValidValue: (g: string) => isValidIpV4(g)
    });
  });
  describe('ipV6', () => {
    genericHelper.isValidArbitrary(() => ipV6(), {
      isValidValue: (g: string) => isValidIpV6(g)
    });
  });
});
