import { describe, it, expect } from 'vitest';
import { assertUnicodeSetsSupportedByStringMatching } from '../../../../../src/arbitrary/_internals/helpers/UnicodeSetsRegexValidator.js';

describe('assertUnicodeSetsSupportedByStringMatching', () => {
  it.each`
    source
    ${''}
    ${'abc'}
    ${'[a-z]'}
    ${'[a-z][A-Z]'}
    ${'[[a-z]]'}
    ${'\\p{Letter}'}
    ${'a&&b'}
    ${'a--b'}
    ${'[\\-\\-]'}
    ${'[\\&\\&]'}
    ${'[a\\-\\-b]'}
    ${'[a\\&\\&b]'}
    ${'[a\\-]'}
    ${'\\\\q{foo}'}
    ${'\\\\'}
  `('accepts non-v-only source $source', ({ source }: { source: string }) => {
    expect(() => assertUnicodeSetsSupportedByStringMatching(source)).not.toThrow();
  });

  it.each`
    source                | kind
    ${'[a&&b]'}           | ${'intersection'}
    ${'[[a-z]&&[aeiou]]'} | ${'intersection'}
    ${'[a--b]'}           | ${'subtraction'}
    ${'[[a-z]--[aeiou]]'} | ${'subtraction'}
    ${'[\\q{foo|bar}]'}   | ${'quoted-string'}
    ${'[a\\q{x}]'}        | ${'quoted-string'}
    ${'[[a-z]\\q{xyz}]'}  | ${'quoted-string'}
  `('rejects v-only construct $source ($kind)', ({ source }: { source: string }) => {
    expect(() => assertUnicodeSetsSupportedByStringMatching(source)).toThrow(/not supported yet/);
  });

  it('does not flag set-like punctuation outside a character class', () => {
    // `&&` and `--` outside a class are two literal `&`/`-` — they never trigger `v` set operators.
    expect(() => assertUnicodeSetsSupportedByStringMatching('a&&b')).not.toThrow();
    expect(() => assertUnicodeSetsSupportedByStringMatching('a--b')).not.toThrow();
  });

  it('tracks nested character classes when scanning for set operators', () => {
    // Outer class contains an inner class; the set operator sits between them.
    expect(() => assertUnicodeSetsSupportedByStringMatching('[[a][b]--c]')).toThrow(/subtraction/);
    expect(() => assertUnicodeSetsSupportedByStringMatching('[[a]&&[b]]')).toThrow(/intersection/);
  });

  it('does not get confused by `]` inside an escape', () => {
    // Here `\]` is an escaped close-bracket inside the outer class, so class-depth must NOT drop
    // before the real `]`. An unescaped `--` right after must still be detected.
    expect(() => assertUnicodeSetsSupportedByStringMatching('[\\]a--b]')).toThrow(/subtraction/);
  });
});
