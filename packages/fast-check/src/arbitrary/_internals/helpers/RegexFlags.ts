/**
 * Single source of truth for the regex flags supported by `stringMatching`.
 *
 * - `d`, `g` — passed through, no effect on tokenization or generation.
 * - `m` — alters the semantics of `^` and `$`.
 * - `s` — alters the semantics of `.`.
 * - `u`, `v` — enable the tokenizer's unicode-aware mode (`\u{...}`, `\p{...}`,
 *   astral code points). The `v` flag additionally authorises unicode-sets
 *   grammar; constructs specific to `v` are detected upstream and rejected by
 *   `stringMatching` since the tokenizer does not understand them.
 *
 * @internal
 */
export const SUPPORTED_REGEX_FLAGS: ReadonlySet<string> = new Set(['d', 'g', 'm', 's', 'u', 'v']);

/**
 * Detect whether `regexSource` contains grammar that is only legal under the
 * `v` (unicode-sets) flag: nested character classes, character-class set
 * operations (`&&`, `--`), or string-literal classes (`\q{...}`).
 *
 * The tokenizer does not understand these constructs and would silently
 * miscompile them. Returning `true` here tells `stringMatching` to reject
 * the regex with an actionable error instead.
 *
 * @internal
 */
export function hasUnicodeSetsOnlyGrammar(regexSource: string): boolean {
  let i = 0;
  let classDepth = 0;
  while (i < regexSource.length) {
    const ch = regexSource[i];
    if (ch === '\\') {
      if (classDepth > 0 && regexSource[i + 1] === 'q' && regexSource[i + 2] === '{') {
        return true;
      }
      i += 2;
      continue;
    }
    if (classDepth > 0) {
      if (ch === '[') {
        return true;
      }
      if (ch === ']') {
        classDepth--;
      } else if ((ch === '&' && regexSource[i + 1] === '&') || (ch === '-' && regexSource[i + 1] === '-')) {
        return true;
      }
    } else if (ch === '[') {
      classDepth = 1;
    }
    i++;
  }
  return false;
}
