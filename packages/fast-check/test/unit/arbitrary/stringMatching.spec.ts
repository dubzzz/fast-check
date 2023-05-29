import * as fc from 'fast-check';
import { stringMatching } from '../../../src/arbitrary/stringMatching';

import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/ArbitraryAssertions';

describe('stringMatching (integration)', () => {
  const regexQuantifiableChunks = [
    '[s-z]', // any character in range s to z
    '[ace]', // any character from ace
    '.', // 'any' character
    ...['w', 'd', 's' /*'b'*/].map((v) => `\\${v}`), // lower case meta characters
    ...['w', 'd', 's' /*'b'*/].map((v) => `\\${v.toUpperCase()}`), // upper case meta characters
    ...' \t\r\n\v\f', // spaces
    ...'\r\n\x1E\x15', // new lines and terminators
    ...'0123456789ABCDEFabcdef-', // some letters, digits... (just some hardcoded characters)
  ];
  type Extra = { regex: RegExp };
  const extraParameters: fc.Arbitrary<Extra> = fc
    .array(
      fc.record(
        {
          matcher: fc.constantFrom(...regexQuantifiableChunks),
          quantifier: fc.oneof(
            fc.constantFrom('?', '*', '+'),
            fc.integer({ max: 5 }),
            fc.tuple(fc.integer({ max: 5 }), fc.option(fc.integer({ max: 5 })))
          ),
        },
        { requiredKeys: ['matcher'] }
      ),
      { minLength: 1 }
    )
    .map((chunks) => {
      return {
        regex: new RegExp(
          chunks
            .map((chunk) => {
              const quantifier = chunk.quantifier;
              const quantifierString =
                quantifier === undefined
                  ? ''
                  : typeof quantifier === 'string'
                  ? quantifier
                  : typeof quantifier === 'number'
                  ? `{${quantifier}}`
                  : typeof quantifier[1] === 'number'
                  ? `{${Math.min(...(quantifier as [number, number]))},${Math.max(
                      ...(quantifier as [number, number])
                    )}}`
                  : `{${quantifier[0]},}`;
              return chunk.matcher + quantifierString;
            })
            .join('')
        ),
      };
    });

  const stringMatchingBuilder = (extra: Extra) => stringMatching(extra.regex);

  const isCorrect = (value: string, extra: Extra) => extra.regex.test(value);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(stringMatchingBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(stringMatchingBuilder, isCorrect, { extraParameters });
  });
});
