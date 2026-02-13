import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { stringMatching } from '../../../src/arbitrary/stringMatching';

import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/ArbitraryAssertions';

describe('stringMatching (integration)', () => {
  const extraParameters: fc.Arbitrary<Extra> = fc.oneof(hardcodedRegex(), regexBasedOnChunks());

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

// Helpers

type Extra = { regex: RegExp };

function hardcodedRegex(): fc.Arbitrary<Extra> {
  //
  return fc.constantFrom(
    // Hex Color
    { regex: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ },
    // RGB Color
    {
      regex:
        /^rgb\(\s*(?:\d|[1-9]\d|1\d\d|2[0-5]\d)\s*,\s*(?:\d|[1-9]\d|1\d\d|2[0-5]\d)\s*,\s*(?:\d|[1-9]\d|1\d\d|2[0-5]\d)\s*\)$/,
    },
    // CSS Color
    { regex: /^(?:#|0x)(?:[a-f0-9]{3}|[a-f0-9]{6})$|^(?:rgb|hsl)a?\([^)]*\)$/ },
    // IPv4
    { regex: /^\d+\.\d+\.\d+\.\d+$/ },
    // IPv4
    { regex: /^([0-9]{1,3}\.){3}\.([0-9]{1,3})$/ },
    // IPv4
    {
      regex: /^((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))*$/,
    },
    // IPv6
    {
      regex:
        /^((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|(([0-9A-Fa-f]{1,4}:){0,5}:((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|(::([0-9A-Fa-f]{1,4}:){0,5}((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))$/,
    },
    // E-mail address based on RFC-1123
    {
      regex:
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    },
    // E-mail address based on RFC-5322
    {
      regex:
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    },
    // URL
    { regex: /^(((http|https|ftp):\/\/)?([[a-zA-Z0-9]-\.])+(\.)([[a-zA-Z0-9]]){2,4}([[a-zA-Z0-9]\/+=%&_\.~?-]*))*$/ },
    // GitHub profile
    { regex: /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9]+$/ },
    // Twitter profile
    { regex: /^https?:\/\/twitter.com\/[A-Za-z0-9_]+\/status\/[0-9]+$/ },
  );
}

function regexBasedOnChunks(): fc.Arbitrary<Extra> {
  const supportFlagD = (() => {
    try {
      new RegExp('.', 'd'); // Not supported in Node 14
      return true;
    } catch {
      return false;
    }
  })();
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
  return fc
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
                  fc.tuple(fc.nat({ max: 5 }), fc.option(fc.nat({ max: 5 }))),
                ),
              },
              { requiredKeys: ['matcher'] },
            ),
            { minLength: 1 },
          ),
        }),
        { minLength: 1, size: '-1' },
      ),
      flags: fc
        .record({
          // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags
          d: fc.boolean(), // indices
          g: fc.boolean(), // global
          // i: fc.boolean(), // case-insensitive
          m: fc.boolean(), // multiline for ^ and $
          s: fc.boolean(), // multiline for .
          u: fc.boolean(), // unicode
          // y: fc.boolean(), // sticky
        })
        .map(
          (flags) =>
            `${flags.d && supportFlagD ? 'd' : ''}${flags.g ? 'g' : ''}${flags.m ? 'm' : ''}${flags.s ? 's' : ''}${
              flags.u ? 'u' : ''
            }`,
        ),
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
                                ...(quantifier as [number, number]),
                              )}}`
                            : `{${quantifier[0]},}`;
                  return chunk.matcher + quantifierString;
                })
                .join('');
              return start + content + end;
            })
            .join('|'),
          flags,
        ),
      };
    });
}
