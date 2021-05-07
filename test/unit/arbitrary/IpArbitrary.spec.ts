import { ipV4 } from '../../../src/arbitrary/ipV4';
import { ipV4Extended } from '../../../src/arbitrary/ipV4Extended';
import { ipV6 } from '../../../src/arbitrary/ipV6';

import * as genericHelper from '../check/arbitrary/generic/GenericArbitraryHelper';

const isValidIpV4 = (i: string) => {
  if (typeof i !== 'string') return false;
  const chunks = i.split('.').map((v) => {
    if (v[0] === '0') {
      if (v[1] === 'x' || v[1] === 'X') return parseInt(v, 16);
      return parseInt(v, 8);
    }
    return parseInt(v, 10);
  });

  // one invalid chunk
  if (chunks.find((v) => Number.isNaN(v)) !== undefined) return false;

  // maximal amount of 4 chunks
  if (chunks.length > 4) return false;

  // all chunks, except the last one are inferior or equal to 255
  if (chunks.slice(0, -1).find((v) => v < 0 && v > 255) !== undefined) return false;

  // last chunk must be below 256^(5 − number of chunks)
  return chunks[chunks.length - 1] < 256 ** (5 - chunks.length);
};
const isValidIpV6 = (i: string) => {
  if (typeof i !== 'string') return false;
  const firstElision = i.indexOf('::');
  if (firstElision !== -1) {
    // At most one '::'
    if (i.substr(firstElision + 1).includes('::')) return false;
  }
  const chunks = i.split(':');
  const last = chunks[chunks.length - 1];
  // The ipv4 can only be composed of 4 decimal chunks separated by dots
  // 1.1000 is not a valid IP v4 in the context of IP v6
  const endByIpV4 = last.includes('.') && isValidIpV4(last);

  const nonEmptyChunks = chunks.filter((c) => c !== '');
  const hexaChunks = endByIpV4 ? nonEmptyChunks.slice(0, nonEmptyChunks.length - 1) : nonEmptyChunks;
  if (!hexaChunks.every((s) => /^[0-9a-f]{1,4}$/.test(s))) return false;

  const equivalentChunkLength = endByIpV4 ? hexaChunks.length + 2 : hexaChunks.length;
  return firstElision !== -1 ? equivalentChunkLength < 8 : equivalentChunkLength === 8;
};

describe('IpArbitrary', () => {
  describe('ipV4', () => {
    genericHelper.isValidArbitrary(() => ipV4(), {
      isValidValue: (g: string) => isValidIpV4(g),
    });
  });
  describe('ipV4Extended', () => {
    genericHelper.isValidArbitrary(() => ipV4Extended(), {
      isValidValue: (g: string) => isValidIpV4(g),
    });
  });
  describe('ipV6', () => {
    genericHelper.isValidArbitrary(() => ipV6(), {
      isValidValue: (g: string) => isValidIpV6(g),
    });
  });
});
