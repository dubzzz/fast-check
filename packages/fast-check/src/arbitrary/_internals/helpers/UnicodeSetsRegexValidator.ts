import { Error } from '../../../utils/globals.js';

/**
 * Scan the source of a regular expression compiled with the `v` (unicodeSets) flag and reject
 * constructs that are only available in `v` mode and not yet supported by `stringMatching`:
 *  - set operations inside a character class: `&&` (intersection), `--` (subtraction)
 *  - quoted string alternations inside a character class: `\q{...}`
 *
 * This pre-scan intentionally stays source-level — it does not attempt to build a full AST.
 * It walks the source once, tracking escape sequences and character-class depth, and throws
 * with a targeted message pointing at the exact feature that is not handled.
 *
 * @param source - regex source (the string that JavaScript produced on `.source`)
 * @internal
 */
export function assertUnicodeSetsSupportedByStringMatching(source: string): void {
  let classDepth = 0;
  let index = 0;
  while (index !== source.length) {
    const char = source[index];
    if (char === '\\') {
      // Escape sequence: consume the backslash and whatever it introduces.
      const next = source[index + 1];
      if (classDepth !== 0 && next === 'q' && source[index + 2] === '{') {
        throw new Error(
          'Unable to use "stringMatching" against a regex using the "v" flag with `\\q{…}` quoted-string alternations inside a character class — this feature is not supported yet.',
        );
      }
      // Skip the backslash and the escaped character (handles \u{…}, \p{…}, \x.., \\, etc.
      // coarsely — we do not need full accuracy here, only to avoid misreading an escaped
      // `&`/`-`/`[`/`]` as part of a set operator or as class delimiters).
      if (next === undefined) {
        // Lone trailing backslash — let the tokenizer raise on it.
        return;
      }
      index += 2;
      continue;
    }
    if (classDepth === 0) {
      if (char === '[') {
        classDepth = 1;
      }
      index += 1;
      continue;
    }
    // Inside a character class.
    if (char === '[') {
      classDepth += 1;
      index += 1;
      continue;
    }
    if (char === ']') {
      classDepth -= 1;
      index += 1;
      continue;
    }
    if (char === '&' && source[index + 1] === '&') {
      throw new Error(
        'Unable to use "stringMatching" against a regex using the "v" flag with set intersection (`&&`) inside a character class — this feature is not supported yet.',
      );
    }
    if (char === '-' && source[index + 1] === '-') {
      throw new Error(
        'Unable to use "stringMatching" against a regex using the "v" flag with set subtraction (`--`) inside a character class — this feature is not supported yet.',
      );
    }
    index += 1;
  }
}
