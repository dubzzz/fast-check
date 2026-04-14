import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { safePush, safeSplit } from '../../../utils/globals.js';
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
  bmpTextEmojiPairs,
  smpTextEmojiPairs,
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

// Special characters used in emoji composition
const ZWJ = safeStringFromCodePoint(0x200d);
const VS16 = safeStringFromCodePoint(0xfe0f);

// Skin tone modifiers (Fitzpatrick scale U+1F3FB..U+1F3FF)
const skinToneStrings: string[] = [0x1f3fb, 0x1f3fc, 0x1f3fd, 0x1f3fe, 0x1f3ff].map((cp) =>
  safeStringFromCodePoint(cp),
);

// Regional indicator range for flag sequences
const REGIONAL_A = 0x1f1e6;
const REGIONAL_Z = 0x1f1ff;

// Keycap sequences: base + VS16 + Combining Enclosing Keycap (U+20E3)
const keycapSequences: string[] = [0x23, 0x2a, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39].map(
  (cp) => safeStringFromCodePoint(cp) + VS16 + safeStringFromCodePoint(0x20e3),
);

// ZWJ sequence components (algorithmic - no need to enumerate all combinations)
// Person bases: man, woman, person (gender-neutral)
// prettier-ignore
const zwjPersonStrings: string[] = [0x1f468, 0x1f469, 0x1f9d1].map((cp) => safeStringFromCodePoint(cp));
// Children: boy, girl
// prettier-ignore
const zwjChildStrings: string[] = [0x1f466, 0x1f467].map((cp) => safeStringFromCodePoint(cp));
// Profession objects joined to person via ZWJ (medical⚕, student🎓, teacher🏫, judge⚖, farmer🌾,
// cook🍳, mechanic🔧, factory🏭, office💼, scientist🔬, technologist💻, singer🎤, artist🎨,
// pilot✈, astronaut🚀, firefighter🚒, with-cane🦯, motorized-wheelchair🦼, manual-wheelchair🦽)
// prettier-ignore
const zwjProfessionStrings: string[] = [
  0x2695, 0x2696, 0x2708,
  0x1f33e, 0x1f373, 0x1f393, 0x1f3a4, 0x1f3a8, 0x1f3eb, 0x1f3ed,
  0x1f4bb, 0x1f4bc, 0x1f527, 0x1f52c, 0x1f680, 0x1f692,
  0x1f9af, 0x1f9bc, 0x1f9bd,
].map((cp) => safeStringFromCodePoint(cp));
// Hair components: red🦰, curly🦱, bald🦲, white🦳
// prettier-ignore
const zwjHairStrings: string[] = [0x1f9b0, 0x1f9b1, 0x1f9b2, 0x1f9b3].map((cp) => safeStringFromCodePoint(cp));

/** Unmap a ZWJ-joined string into 2 parts @internal */
function zwjUnmapper2(value: unknown): [string, string] {
  if (typeof value !== 'string') throw new Error('Unsupported type');
  const parts = safeSplit(value, ZWJ);
  if (parts.length !== 2) throw new Error('Unsupported value');
  return [parts[0], parts[1]];
}

/** Unmap a ZWJ-joined string into 3 parts @internal */
function zwjUnmapper3(value: unknown): [string, string, string] {
  if (typeof value !== 'string') throw new Error('Unsupported type');
  const parts = safeSplit(value, ZWJ);
  if (parts.length !== 3) throw new Error('Unsupported value');
  return [parts[0], parts[1], parts[2]];
}

/** @internal */
function buildSingleEmojiArbitrary(): Arbitrary<string> {
  const entries = [...pairsToEntries(bmpEmojiPresentationPairs, 0), ...pairsToEntries(smpEmojiPresentationPairs, SMP_BASE)];
  return mapToConstant(...entries);
}

/** @internal */
function buildTextEmojiArbitrary(): Arbitrary<string> {
  const entries = [...pairsToEntries(bmpTextEmojiPairs, 0), ...pairsToEntries(smpTextEmojiPairs, SMP_BASE)];
  return mapToConstant(...entries).map(
    (c) => c + VS16,
    (value: unknown) => {
      if (typeof value !== 'string') throw new Error('Unsupported type');
      if (value[value.length - 1] !== VS16) throw new Error('Unsupported value');
      return value.slice(0, -VS16.length);
    },
  );
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

/** @internal */
function buildZwjEmojiArbitrary(): Arbitrary<string> {
  const personArb = constantFrom(...zwjPersonStrings);
  const childArb = constantFrom(...zwjChildStrings);
  const professionArb = constantFrom(...zwjProfessionStrings);
  const hairArb = constantFrom(...zwjHairStrings);

  // Family: adult + ZWJ + adult + ZWJ + child (e.g. 👨‍👩‍👦)
  const familyArb: Arbitrary<string> = tuple(personArb, personArb, childArb).map(
    ([p1, p2, c]) => p1 + ZWJ + p2 + ZWJ + c,
    zwjUnmapper3,
  );

  // Profession: person + ZWJ + object (e.g. 👩‍🚀)
  const professionSeqArb: Arbitrary<string> = tuple(personArb, professionArb).map(
    ([p, o]) => p + ZWJ + o,
    zwjUnmapper2,
  );

  // Hair: person + ZWJ + hair component (e.g. 🧑‍🦰)
  const hairSeqArb: Arbitrary<string> = tuple(personArb, hairArb).map(
    ([p, h]) => p + ZWJ + h,
    zwjUnmapper2,
  );

  // Couple with heart: person + ZWJ + ❤️ + ZWJ + person (e.g. 🧑‍❤️‍🧑)
  const heartStr = safeStringFromCodePoint(0x2764) + VS16;
  const coupleArb: Arbitrary<string> = tuple(personArb, personArb).map(
    ([p1, p2]) => p1 + ZWJ + heartStr + ZWJ + p2,
    (value: unknown): [string, string] => {
      if (typeof value !== 'string') throw new Error('Unsupported type');
      const parts = safeSplit(value, ZWJ);
      if (parts.length !== 3 || parts[1] !== heartStr) throw new Error('Unsupported value');
      return [parts[0], parts[2]];
    },
  );

  return oneof(
    { weight: 3, arbitrary: familyArb },
    { weight: 3, arbitrary: professionSeqArb },
    { weight: 2, arbitrary: hairSeqArb },
    { weight: 2, arbitrary: coupleArb },
  );
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
    case 'text-with-vs16':
      arb = buildTextEmojiArbitrary();
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
    case 'zwj':
      arb = buildZwjEmojiArbitrary();
      break;
    case 'any':
    default:
      arb = oneof(
        { weight: 4, arbitrary: buildSingleEmojiArbitrary() },
        { weight: 2, arbitrary: buildTextEmojiArbitrary() },
        { weight: 2, arbitrary: buildSkinToneEmojiArbitrary() },
        { weight: 3, arbitrary: buildZwjEmojiArbitrary() },
        { weight: 2, arbitrary: buildFlagEmojiArbitrary() },
        { weight: 1, arbitrary: buildKeycapEmojiArbitrary() },
      );
      break;
  }
  cachedEmojiArbitraries[kind] = arb;
  return arb;
}
