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
