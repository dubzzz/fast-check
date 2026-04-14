import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { safePush } from '../../../utils/globals.js';
import { mapToConstant } from '../../mapToConstant.js';
import { oneof } from '../../oneof.js';
import { tuple } from '../../tuple.js';
import { constantFrom } from '../../constantFrom.js';
import {
  SMP_BASE,
  bmpEmojiPresentationPairs,
  smpEmojiPresentationPairs,
  bmpEmojiModifierBasePairs,
  smpEmojiModifierBasePairs,
} from '../data/EmojiRanges.js';

const safeStringFromCodePoint = String.fromCodePoint;

/** @internal */
type MapToConstantEntry = { num: number; build: (idInGroup: number) => string };

/**
 * Convert a flat array of [start, end] pairs into mapToConstant entries.
 * @param pairs - Flat array where pairs[i] is range start and pairs[i+1] is range end (inclusive)
 * @param base - Base offset added to each value (0 for BMP, SMP_BASE for SMP ranges)
 * @internal
 */
function pairsToEntries(pairs: number[], base: number): MapToConstantEntry[] {
  const entries: MapToConstantEntry[] = [];
  for (let i = 0; i < pairs.length; i += 2) {
    const start = pairs[i] + base;
    const end = pairs[i + 1] + base;
    if (start === end) {
      const c = safeStringFromCodePoint(start);
      safePush(entries, { num: 1, build: () => c });
    } else {
      safePush(entries, {
        num: end - start + 1,
        build: (idInGroup: number) => safeStringFromCodePoint(start + idInGroup),
      });
    }
  }
  return entries;
}

// Skin tone modifiers (Fitzpatrick scale U+1F3FB..U+1F3FF)
const skinToneStrings: string[] = [0x1f3fb, 0x1f3fc, 0x1f3fd, 0x1f3fe, 0x1f3ff].map((cp) =>
  safeStringFromCodePoint(cp),
);

// Regional indicator range for flag sequences
const REGIONAL_A = 0x1f1e6;
const REGIONAL_Z = 0x1f1ff;

// Keycap sequences: base + VS16 (U+FE0F) + Combining Enclosing Keycap (U+20E3)
const keycapSequences: string[] = [0x23, 0x2a, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39].map(
  (cp) => safeStringFromCodePoint(cp) + safeStringFromCodePoint(0xfe0f) + safeStringFromCodePoint(0x20e3),
);

/** @internal */
function buildSingleEmojiArbitrary(): Arbitrary<string> {
  const entries = [...pairsToEntries(bmpEmojiPresentationPairs, 0), ...pairsToEntries(smpEmojiPresentationPairs, SMP_BASE)];
  return mapToConstant(...entries);
}

/** @internal */
function buildSkinToneEmojiArbitrary(): Arbitrary<string> {
  const entries = [
    ...pairsToEntries(bmpEmojiModifierBasePairs, 0),
    ...pairsToEntries(smpEmojiModifierBasePairs, SMP_BASE),
  ];
  const baseArb = mapToConstant(...entries);
  const toneArb = constantFrom(...skinToneStrings);
  return tuple(baseArb, toneArb).map(
    ([base, tone]) => base + tone,
    (value: unknown) => {
      if (typeof value !== 'string') throw new Error('Unsupported type');
      // oxlint-disable-next-line typescript/no-misused-spread
      const cps = [...value];
      if (cps.length !== 2) throw new Error('Unsupported value');
      return [cps[0], cps[1]];
    },
  );
}

/** @internal */
function buildFlagEmojiArbitrary(): Arbitrary<string> {
  const letterArb = mapToConstant({
    num: REGIONAL_Z - REGIONAL_A + 1,
    build: (i: number) => safeStringFromCodePoint(REGIONAL_A + i),
  });
  return tuple(letterArb, letterArb).map(
    ([a, b]) => a + b,
    (value: unknown) => {
      if (typeof value !== 'string') throw new Error('Unsupported type');
      // oxlint-disable-next-line typescript/no-misused-spread
      const cps = [...value];
      if (cps.length !== 2) throw new Error('Unsupported value');
      return [cps[0], cps[1]];
    },
  );
}

/** @internal */
function buildKeycapEmojiArbitrary(): Arbitrary<string> {
  return constantFrom(...keycapSequences);
}

/**
 * Cache for emoji arbitrary instances, keyed by kind.
 * @internal
 */
const cachedEmojiArbitraries: Partial<Record<string, Arbitrary<string>>> = Object.create(null);

/** @internal */
export function getOrCreateEmojiArbitrary(kind: string): Arbitrary<string> {
  const cached = cachedEmojiArbitraries[kind];
  if (cached !== undefined) {
    return cached;
  }
  let arb: Arbitrary<string>;
  switch (kind) {
    case 'single':
      arb = buildSingleEmojiArbitrary();
      break;
    case 'skin-tone':
      arb = buildSkinToneEmojiArbitrary();
      break;
    case 'flag':
      arb = buildFlagEmojiArbitrary();
      break;
    case 'keycap':
      arb = buildKeycapEmojiArbitrary();
      break;
    case 'any':
    default:
      arb = oneof(
        { weight: 5, arbitrary: buildSingleEmojiArbitrary() },
        { weight: 2, arbitrary: buildSkinToneEmojiArbitrary() },
        { weight: 2, arbitrary: buildFlagEmojiArbitrary() },
        { weight: 1, arbitrary: buildKeycapEmojiArbitrary() },
      );
      break;
  }
  cachedEmojiArbitraries[kind] = arb;
  return arb;
}
