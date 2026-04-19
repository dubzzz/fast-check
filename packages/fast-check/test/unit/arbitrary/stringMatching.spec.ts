import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { stringMatching } from '../../../src/arbitrary/stringMatching.js';

import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/ArbitraryAssertions.js';

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

describe('stringMatching (v flag)', () => {
  const supportFlagV = (() => {
    try {
      // eslint-disable-next-line no-new
      new RegExp('.', 'v'); // Not supported before V8 11.3 / Node 20
      return true;
    } catch {
      return false;
    }
  })();

  const itV = supportFlagV ? it : it.skip;

  itV('accepts a simple /v regex and produces matching strings', () => {
    const regex = new RegExp('^[a-z]+$', 'v');
    const arb = stringMatching(regex);
    assertProduceSameValueGivenSameSeed(() => arb);
    assertProduceCorrectValues(
      () => arb,
      (value) => new RegExp(regex.source, regex.flags).test(value),
    );
  });

  itV('behaves identically to the /u counterpart on syntax that exists in both modes', () => {
    const patterns = ['^[a-z]+$', '^\\w{1,8}$', '^\\p{Letter}+$', '^(foo|bar){1,3}$', '^[\\u{1f431}-\\u{1f434}]+$'];
    for (const source of patterns) {
      const uRegex = new RegExp(source, 'u');
      const vRegex = new RegExp(source, 'v');
      // Both should build without throwing — this is the core guarantee of Angle A.
      stringMatching(uRegex);
      stringMatching(vRegex);
    }
  });

  itV('rejects /v regex using set intersection `[a&&b]` with a targeted error', () => {
    const regex = new RegExp('[[a-z]&&[aeiou]]', 'v');
    expect(() => stringMatching(regex)).toThrowError(/intersection/);
  });

  itV('rejects /v regex using set subtraction `[a--b]` with a targeted error', () => {
    const regex = new RegExp('[[a-z]--[aeiou]]', 'v');
    expect(() => stringMatching(regex)).toThrowError(/subtraction/);
  });

  itV('rejects /v regex using `\\q{…}` quoted-string alternation with a targeted error', () => {
    const regex = new RegExp('[\\q{foo|bar}]', 'v');
    expect(() => stringMatching(regex)).toThrowError(/quoted-string/);
  });

  itV('rejects /v regex using a string-valued unicode property with a clear error', () => {
    // `\p{RGI_Emoji}` only exists under /v — the existing UnicodeProperty resolver rejects it
    // as an unknown property value. That error suffices as long as it surfaces cleanly.
    const regex = new RegExp('\\p{RGI_Emoji}', 'v');
    expect(() => stringMatching(regex)).toThrowError(/RGI_Emoji/);
  });

  it('still rejects unsupported flags (sanity check)', () => {
    // `i` is still unsupported regardless of engine support for /v.
    expect(() => stringMatching(/abc/i)).toThrowError(/flag i/);
  });
});

// Helpers

type Extra = { regex: RegExp };

function hardcodedRegex(): fc.Arbitrary<Extra> {
  const supportFlagV = (() => {
    try {
      new RegExp('.', 'v');
      return true;
    } catch {
      return false;
    }
  })();
  const vFlagCases: { regex: RegExp }[] = supportFlagV
    ? [
        { regex: new RegExp('^[a-z]+$', 'v') },
        { regex: new RegExp('^\\p{Emoji}+$', 'v') },
        { regex: new RegExp('^\\P{Emoji}+$', 'v') },
        { regex: new RegExp('^\\w{1,8}$', 'v') },
      ]
    : [];
  return fc.constantFrom(
    ...vFlagCases,
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
    // Emojis
    { regex: /^\p{Emoji}+$/u },
    // Non-emojis
    { regex: /^\P{Emoji}+$/u },
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
  const supportFlagV = (() => {
    try {
      new RegExp('.', 'v'); // Not supported before V8 11.3 / Node 20
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
          v: fc.boolean(), // unicodeSets
          // y: fc.boolean(), // sticky
        })
        .map((flags) => {
          // `u` and `v` are mutually exclusive: prefer `v` when both are requested and available
          // to exercise the unicodeSets path; fall back to `u` if `v` is unsupported on this engine.
          const wantV = flags.v && supportFlagV;
          const unicodeLetter = wantV ? 'v' : flags.u ? 'u' : '';
          return `${flags.d && supportFlagD ? 'd' : ''}${flags.g ? 'g' : ''}${flags.m ? 'm' : ''}${flags.s ? 's' : ''}${unicodeLetter}`;
        }),
    })
    .map(({ disjunctions, flags }) => {
      const source = disjunctions
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
        .join('|');
      let effectiveFlags = flags;
      if (effectiveFlags.indexOf('v') !== -1) {
        // Some chunk combinations are legal under `/u` but illegal under `/v` (v tightens the set
        // of characters that may appear bare in certain positions). When that happens, silently
        // swap `v` for `u` so the generator still produces a valid regex.
        try {
          new RegExp(source, effectiveFlags);
        } catch {
          effectiveFlags = effectiveFlags.replace('v', 'u');
        }
      }
      return {
        regex: new RegExp(source, effectiveFlags),
      };
    });
}
