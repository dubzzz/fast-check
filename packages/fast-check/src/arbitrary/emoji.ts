import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { getOrCreateEmojiArbitrary } from './_internals/builders/EmojiArbitraryBuilder.js';

/**
 * Constraints to be applied on {@link emoji}
 * @remarks Since 3.22.0
 * @public
 */
export type EmojiConstraints = {
  /**
   * Selects the kind of emoji to generate:
   *
   * - `'any'` — Randomly picks from all categories below (default).
   * - `'single'` — Single code point emoji with `Emoji_Presentation` property (e.g. 😀, 🚀, ⭐).
   * - `'text-with-vs16'` — Text-presentation emoji followed by VS16 (e.g. ☝️, ✂️, ♻️).
   * - `'skin-tone'` — Emoji with a Fitzpatrick skin tone modifier (e.g. 👋🏽, 🧑🏻).
   * - `'flag'` — Flag emoji built from a pair of Regional Indicator symbols (e.g. 🇫🇷, 🇯🇵).
   * - `'keycap'` — Keycap sequence emoji (e.g. 1⃣, #⃣, *⃣).
   * - `'zwj'` — ZWJ sequences: family (👨‍👩‍👦), profession (👩‍🚀), hair style (🧑‍🦰), couple (🧑‍❤️‍🧑), gender (🏃‍♂️).
   * - `'tag'` — Tag sequences for subdivision flags (🏴󠁧󠁢󠁥󠁮󠁧󠁿, 🏴󠁧󠁢󠁳󠁣󠁴󠁿, 🏴󠁧󠁢󠁷󠁬󠁳󠁿).
   *
   * The produced value is always a single emoji string suitable for use as a `unit` in {@link string}.
   *
   * @defaultValue 'any'
   * @remarks Since 3.22.0
   */
  kind?: 'any' | 'single' | 'text-with-vs16' | 'skin-tone' | 'flag' | 'keycap' | 'zwj' | 'tag';
};

/**
 * For emoji strings
 *
 * Generates emoji characters and sequences from the Unicode 16.0 specification.
 * The arbitrary covers single code point emoji, text-presentation emoji with VS16,
 * skin tone variants, flag sequences, keycap sequences, ZWJ sequences
 * (family, profession, hair style, couple, gender), and tag sequences (subdivision flags).
 *
 * @example
 * ```typescript
 * // Any kind of emoji
 * fc.emoji()
 * // Examples: "😀", "👋🏽", "🇫🇷", "#⃣", "👨‍👩‍👦", "👩‍🚀"
 *
 * // Only single code point emoji
 * fc.emoji({ kind: 'single' })
 * // Examples: "😀", "🚀", "⭐", "🎉"
 *
 * // String of emoji
 * fc.string({ unit: fc.emoji(), minLength: 3, maxLength: 5 })
 * // Examples: "😀🚀⭐", "👋🏽🇫🇷#⃣😎🎉"
 * ```
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 3.22.0
 * @public
 */
export function emoji(constraints: EmojiConstraints = {}): Arbitrary<string> {
  return getOrCreateEmojiArbitrary(constraints.kind ?? 'any');
}
