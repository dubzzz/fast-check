import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { Error } from '../utils/globals.js';
import { StringFromCorpusArbitrary } from './_internals/StringFromCorpusArbitrary.js';
import type { SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength.js';
import {
  MaxLengthUpperBound,
  maxGeneratedLengthFromSizeForArbitrary,
} from './_internals/helpers/MaxLengthFromMinLength.js';

const safeMathMax = Math.max;

/**
 * Constraints to be applied on {@link stringFromCorpus}
 * @remarks Since 4.8.0
 * @public
 */
export interface StringFromCorpusConstraints {
  /**
   * Define how large the generated values should be (at max).
   *
   * When used together with `maxLength`, `size` bounds the upper length of the
   * generated strings while `maxLength` documents the general maximum allowed.
   *
   * @remarks Since 4.8.0
   */
  size?: SizeForArbitrary;
  /**
   * **Best-effort** lower bound on generated length, measured in code points.
   *
   * Edit operations that would push the length below `minLength` are dropped.
   * However, when a corpus entry is already shorter than `minLength` and no
   * `insert` operations are drawn, the output can still be shorter than
   * `minLength`. To guarantee a minimum length, ensure every corpus entry
   * already meets it.
   *
   * @defaultValue 0
   * @remarks Since 4.8.0
   */
  minLength?: number;
  /**
   * Upper bound (inclusive) of the generated string length, measured in code points.
   *
   * Enforced on generated values unless `includeOriginals` is `true` and the
   * bias-path fires — see the remarks on {@link stringFromCorpus} for details.
   *
   * ⚠️ When `includeOriginals: true` (default), raw corpus entries may be
   * emitted that exceed `maxLength`. Set `includeOriginals: false` to enforce
   * `maxLength` strictly on every generated value.
   *
   * @defaultValue 0x7fffffff — _defaulting seen as "max non specified" when `defaultSizeToMaxWhenMaxSpecified=true`_
   * @remarks Since 4.8.0
   */
  maxLength?: number;
  /**
   * Maximum number of edit operations (`insert`, `delete`, `substitute`, `transpose`)
   * applied to the chosen corpus entry for a single generate call.
   *
   * `size` scales mutation depth: the default derives `maxEdits` from the
   * resolved generated-length cap so that larger requested outputs admit more
   * mutations.
   *
   * @defaultValue `max(1, maxGeneratedLengthFromSize)` — derived from `size`, with a floor of 1 so small corpora still mutate.
   * @remarks Since 4.8.0
   */
  maxEdits?: number;
  /**
   * When `true`, the arbitrary is biased toward emitting the raw corpus entry
   * (zero edit operations) when the runner asks for biased generation.
   *
   * When `true`, raw corpus entries are emitted as-is even if their length
   * falls outside `[minLength, maxLength]`. Users wanting strict length bounds
   * should set `includeOriginals` to `false`.
   *
   * @defaultValue true
   * @remarks Since 4.8.0
   */
  includeOriginals?: boolean;
  /**
   * Extra characters to mix into the mutation alphabet in addition to the code
   * points observed in `corpus`. Particularly useful when the corpus is small
   * (or when it contains only empty strings), to ensure `insert` and
   * `substitute` operations can actually introduce new characters.
   *
   * If the effective alphabet (corpus code points + `extraAlphabet`) remains
   * empty, the arbitrary falls back to the ASCII printable range `0x20..0x7e`.
   *
   * @defaultValue "" (empty)
   * @remarks Since 4.8.0
   */
  extraAlphabet?: string;
}

/**
 * For strings derived from a fixed corpus via random edit operations.
 *
 * The arbitrary picks a corpus entry, then applies between 0 and `maxEdits`
 * randomly drawn operations from `{insert, delete, substitute, transpose}`
 * over code points. Shrinking drops operations tail-first and then
 * cross-shrinks the chosen corpus index toward `0`, preserving the operation
 * list across the corpus dimension.
 *
 * Characters are manipulated code-point-wise (never code-unit-wise), so
 * non-BMP corpus entries such as emoji are preserved correctly by every
 * mutation and shrink step.
 *
 * @param corpus - Non-empty array of seed strings; at least one element is required.
 * @param constraints - Optional tuning, see {@link StringFromCorpusConstraints}.
 *
 * @remarks
 * Bias-path escape hatch: when `includeOriginals` is `true` (the default) and
 * the runner requests biased generation, the arbitrary may emit a raw corpus
 * entry as-is — including entries whose code-point length exceeds `maxLength`
 * or falls below `minLength`. Set `includeOriginals: false` to guarantee that
 * every generated value respects the length bounds.
 *
 * Replay-without-context limit: `canShrinkWithoutContext` returns `true` only
 * for values that exactly match an entry of `corpus` (by strict equality).
 * Values one edit away from a corpus entry, or produced by a previous run
 * whose context has been lost, cannot be shrunk without their original
 * context.
 *
 * Corpus-order stability: saved failures encode the chosen corpus entry by
 * its position in `corpus`. Appending to `corpus` preserves existing saved
 * failures; inserting entries at the front or removing entries invalidates
 * saved failures that referred to later positions. For stable replay across
 * corpus edits, only append.
 *
 * @example
 * ```typescript
 * import fc from 'fast-check';
 *
 * fc.assert(
 *   fc.property(
 *     fc.stringFromCorpus(['hello world', 'foo bar', 'baz'], { maxEdits: 5 }),
 *     (s) => !s.includes('CRASH'),
 *   ),
 * );
 * ```
 *
 * @remarks Since 4.8.0
 * @public
 */
export function stringFromCorpus(
  corpus: readonly string[],
  constraints: StringFromCorpusConstraints = {},
): Arbitrary<string> {
  if (corpus.length === 0) {
    throw new Error('fc.stringFromCorpus expects a non-empty corpus');
  }
  const minLength = constraints.minLength !== undefined ? constraints.minLength : 0;
  const maxLengthOrUnset = constraints.maxLength;
  const maxLength = maxLengthOrUnset !== undefined ? maxLengthOrUnset : MaxLengthUpperBound;
  const specifiedMaxLength = maxLengthOrUnset !== undefined;
  const maxGeneratedLength = maxGeneratedLengthFromSizeForArbitrary(
    constraints.size,
    minLength,
    maxLength,
    specifiedMaxLength,
  );
  const includeOriginals = constraints.includeOriginals !== undefined ? constraints.includeOriginals : true;
  const extraAlphabet = constraints.extraAlphabet !== undefined ? constraints.extraAlphabet : '';
  // `maxEdits` is capped so that a caller requesting `size: 'small'` does not
  // silently get exploding op-lists. When the user does not specify it, we
  // derive it from `maxGeneratedLength` — roughly "one edit per generated
  // code-point slot" — with a floor of 1 to keep small corpora interesting.
  const maxEdits = constraints.maxEdits !== undefined ? constraints.maxEdits : safeMathMax(1, maxGeneratedLength);
  return new StringFromCorpusArbitrary(corpus, {
    minLength,
    maxGeneratedLength,
    maxEdits,
    includeOriginals,
    extraAlphabet,
  });
}
