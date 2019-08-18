import { StringPadStart } from '../../utils/polyfills';
import { nat } from './IntegerArbitrary';
import { tuple } from './TupleArbitrary';

/** @hidden */
const paddedEightHexa = nat(0xffffffff).map(n => {
  return StringPadStart(n.toString(16), 8, '0');
});

/**
 * For UUID
 *
 * No mixed case, only lower case digits (0-9a-f)
 */
export function uuid() {
  return tuple(paddedEightHexa, paddedEightHexa, paddedEightHexa, paddedEightHexa).map(t => {
    return `${t[0]}-${t[1].substring(0, 4)}-${t[1].substring(4)}-${t[2].substring(0, 4)}-${t[2].substring(4)}${t[3]}`;
  });
}

/**
 * For UUID
 *
 * With mixed case, eligible digits are any of 0-9a-fA-F
 */
export function uuidExtended() {
  // uuidExtended is defined as a chain over uuid instead of a map over tuple(uuid, uppers)
  // in order to optimize the shrink (uppers will focus on digits that can be set to upper case only)
  return uuid().chain(g => {
    // store the indices where digits are lower case (a-f)
    const indicesWithLower: number[] = [];
    for (let idx = 0; idx !== 36; ++idx) {
      if (g[idx] >= 'a' && g[idx] <= 'f') {
        indicesWithLower.push(idx);
      }
    }
    // integer having bits to one for indices in indicesWithLower
    // that should be put to upper case
    return nat(2 ** indicesWithLower.length - 1).map(uppers => {
      let idxInIndices = 0;
      let maskInIndices = 1;
      let newUuid = '';
      for (let idx = 0; idx !== 36; ++idx) {
        if (idx === indicesWithLower[idxInIndices]) {
          if (uppers & maskInIndices) newUuid += g[idx].toUpperCase();
          else newUuid += g[idx];
          ++idxInIndices;
          maskInIndices <<= 1;
        } else {
          newUuid += g[idx];
        }
      }
      return newUuid;
    });
  });
}
