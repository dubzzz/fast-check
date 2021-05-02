import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { base64 } from '../../base64';
import { maxLengthFromMinLength } from '../helpers/MaxLengthFromMinLength';
import { stringToBase64Mapper } from '../mappers/StringToBase64';
import { buildStringArbitrary, StringFullConstraintsDefinition } from './StringArbitraryBuilder';

/** @internal */
function extractMinMaxConstraints(...args: StringFullConstraintsDefinition) {
  if (args[0] !== undefined) {
    if (typeof args[0] === 'number') {
      if (typeof args[1] === 'number') {
        // function(minLength, maxLength)
        return { minLength: args[0], maxLength: args[1] };
      } else {
        // function(maxLength)
        return { minLength: 0, maxLength: args[0] };
      }
    } else {
      // function(constraints)
      const minLength = args[0].minLength !== undefined ? args[0].minLength : 0;
      const maxLength = args[0].maxLength !== undefined ? args[0].maxLength : maxLengthFromMinLength(minLength);
      return { minLength, maxLength };
    }
  }
  return { minLength: 0, maxLength: maxLengthFromMinLength(0) };
}

/** @internal */
export function buildBase64StringArbitrary(...args: StringFullConstraintsDefinition): Arbitrary<string> {
  const constraints = extractMinMaxConstraints(...args);
  const unscaledMinLength = constraints.minLength;
  const unscaledMaxLength = constraints.maxLength;

  // base64 length is always a multiple of 4
  const minLength = unscaledMinLength + 3 - ((unscaledMinLength + 3) % 4);
  const maxLength = unscaledMaxLength - (unscaledMaxLength % 4);

  if (minLength > maxLength) throw new Error('Minimal length should be inferior or equal to maximal length');
  if (minLength % 4 !== 0) throw new Error('Minimal length of base64 strings must be a multiple of 4');
  if (maxLength % 4 !== 0) throw new Error('Maximal length of base64 strings must be a multiple of 4');

  return buildStringArbitrary(base64(), { minLength, maxLength }).map(stringToBase64Mapper);
}
