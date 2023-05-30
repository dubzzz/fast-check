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
    '[^s-z]', // any character not in range s to z
    '[^ace]', // any character not from ace
    '.', // 'any' character
    ...['w', 'd', 's' /*'b'*/].map((v) => `\\${v}`), // lower case meta characters
    ...['w', 'd', 's' /*'b'*/].map((v) => `\\${v.toUpperCase()}`), // upper case meta characters
    ...' \t\r\n\v\f', // spaces
    ...'\r\n\x1E\x15', // new lines and terminators
    ...'0123456789ABCDEFabcdef-', // some letters, digits... (just some hardcoded characters)
  ];
  type Extra = { regex: RegExp };
  const extraParameters: fc.Arbitrary<Extra> = fc
    .record({
      disjunctions: fc.array(
        fc.record({
          startAssertion: fc.boolean(),
          endAssertion: fc.boolean(),
          chunks: fc.array(
            fc.record(
              {
                matcher: fc.constantFrom(...regexQuantifiableChunks),
                quantifier: fc.oneof(
                  fc.constantFrom('?', '*', '+'),
                  fc.nat({ max: 5 }),
                  fc.tuple(fc.nat({ max: 5 }), fc.option(fc.nat({ max: 5 })))
                ),
              },
              { requiredKeys: ['matcher'] }
            ),
            { minLength: 1 }
          ),
        }),
        { minLength: 1, size: '-1' }
      ),
      flags: fc
        .record({
          // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags
          d: fc.boolean(), // indices
          g: fc.boolean(), // global
          // i: fc.boolean(), // case-insensitive
          m: fc.boolean(), // multiline for ^ and $
          s: fc.boolean(), // multiline for .
          // u: fc.boolean(), // unicode
          // y: fc.boolean(), // sticky
        })
        .map((flags) => `${flags.d ? 'd' : ''}${flags.g ? 'g' : ''}${flags.m ? 'm' : ''}${flags.s ? 's' : ''}`),
    })
    .map(({ disjunctions, flags }) => {
      return {
        regex: new RegExp(
          disjunctions
            .map(({ startAssertion, endAssertion, chunks }) => {
              const start = startAssertion ? '^' : '';
              const end = endAssertion ? '$' : '';
              const content = chunks
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
                .join('');
              return start + content + end;
            })
            .join('|'),
          flags
        ),
      };
    });

  const stringMatchingBuilder = (extra: Extra) => stringMatching(extra.regex);

  // isCorrect has to clone the instance of RegExp to make sure not to depend on its internal state
  const isCorrect = (value: string, extra: Extra) => new RegExp(extra.regex.source, extra.regex.flags).test(value);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(stringMatchingBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(stringMatchingBuilder, isCorrect, { extraParameters });
  });
});
