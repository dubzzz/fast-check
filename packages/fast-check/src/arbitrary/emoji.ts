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
   * - `'skin-tone'` — Emoji with a Fitzpatrick skin tone modifier (e.g. 👋🏽, 🧑🏻).
   * - `'flag'` — Flag emoji built from a pair of Regional Indicator symbols (e.g. 🇫🇷, 🇯🇵).
   * - `'keycap'` — Keycap sequence emoji (e.g. 1⃣, #⃣, *⃣).
   *
   * The produced value is always a single emoji string suitable for use as a `unit` in {@link string}.
   *
   * @defaultValue 'any'
   * @remarks Since 3.22.0
   */
  kind?: 'any' | 'single' | 'skin-tone' | 'flag' | 'keycap';
};

/**
 * For emoji strings
 *
 * Generates emoji characters and sequences from the Unicode 16.0 specification.
 * The arbitrary covers single code point emoji, skin tone variants,
 * flag sequences, and keycap sequences.
 *
 * @example
 * ```typescript
 * // Any kind of emoji
 * fc.emoji()
 * // Examples: "😀", "👋🏽", "🇫🇷", "#⃣"
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
