import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { safeCharCodeAt, safeEvery, safeJoin, safeSubstring, Error, safeMap, safePush } from '../utils/globals.js';
import { stringify } from '../utils/stringify.js';
import type { GraphemeRange } from './_internals/data/GraphemeRanges.js';
import { asciiAlphabetRanges, autonomousGraphemeRanges } from './_internals/data/GraphemeRanges.js';
import { clampRegexAst } from './_internals/helpers/ClampRegexAst.js';
import {
  convertGraphemeRangeToMapToConstantEntry,
  intersectGraphemeRanges,
  subtractGraphemeRanges,
  unionGraphemeRanges,
} from './_internals/helpers/GraphemeRangesHelpers.js';
import type { SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength.js';
import { addMissingDotStar } from './_internals/helpers/SanitizeRegexAst.js';
import type { RegexToken } from './_internals/helpers/TokenizeRegex.js';
import { tokenizeRegex } from './_internals/helpers/TokenizeRegex.js';
import {
  unicodePropertyArbitrary,
  unicodePropertyRanges,
} from './_internals/helpers/UnicodePropertyArbitraryHelper.js';
import { constant } from './constant.js';
import { constantFrom } from './constantFrom.js';
import { integer } from './integer.js';
import { mapToConstant } from './mapToConstant.js';
import { oneof } from './oneof.js';
import { string } from './string.js';
import { tuple } from './tuple.js';

const safeStringFromCodePoint = String.fromCodePoint;

/**
 * Constraints to be applied on the arbitrary {@link stringMatching}
 * @remarks Since 3.10.0
 * @public
 */
export type StringMatchingConstraints = {
  /**
   * Upper bound of the generated string length (included)
   * @defaultValue 0x7fffffff
   * @remarks Since 4.6.0
   */
  maxLength?: number;
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 3.10.0
   */
  size?: SizeForArbitrary;
};

// Some predefined chars or groups of chars, expressed as ranges of code points (ordered and non-overlapping)
// https://www.w3schools.com/jsref/jsref_regexp_whitespace.asp
const wordCharRanges: GraphemeRange[] = [[0x30, 0x39], [0x41, 0x5a], [0x5f], [0x61, 0x7a]]; // 0-9, A-Z, _, a-z
const digitCharRanges: GraphemeRange[] = [[0x30, 0x39]]; // 0-9
const spaceCharRanges: GraphemeRange[] = [[0x09, 0x0d], [0x20]]; // \t, \n, \v, \f, \r and space
const terminatorCharRanges: GraphemeRange[] = [[0x15], [0x1e]]; // \x15 and \x1E
const newLineAndTerminatorCharRanges: GraphemeRange[] = [[0x0a], [0x0d], [0x15], [0x1e]]; // \n, \r, \x15 and \x1E
const newLineChars = [...'\r\n'];

// All the characters producible by defaultChar(): the printable ASCII characters.
// Decomposable graphemes do not intersect with ASCII so the 'grapheme-ascii' unit boils down to this intersection.
const defaultCharRanges = intersectGraphemeRanges(asciiAlphabetRanges, autonomousGraphemeRanges);

// Ranges of code points for the negated predefined classes, within the characters producible by defaultChar()
const nonWordCharRanges = subtractGraphemeRanges(defaultCharRanges, wordCharRanges);
const nonDigitCharRanges = subtractGraphemeRanges(defaultCharRanges, digitCharRanges);
const nonSpaceCharRanges = subtractGraphemeRanges(defaultCharRanges, spaceCharRanges);
const dotCharRanges = subtractGraphemeRanges(defaultCharRanges, newLineAndTerminatorCharRanges);
const dotAllCharRanges = subtractGraphemeRanges(defaultCharRanges, terminatorCharRanges);

const defaultChar = () => string({ unit: 'grapheme-ascii', minLength: 1, maxLength: 1 });

/**
 * Build an arbitrary producing one single character among the ones declared by the received ranges
 * @internal
 */
function rangesToCharArbitrary(ranges: GraphemeRange[]): Arbitrary<string> {
  return mapToConstant(...safeMap(ranges, (range) => convertGraphemeRangeToMapToConstantEntry(range)));
}

function raiseUnsupportedASTNode(astNode: never): Error {
  return new Error(`Unsupported AST node! Received: ${stringify(astNode)}`);
}

type RegexFlags = {
  multiline: boolean;
  dotAll: boolean;
};

/**
 * Compute the ranges of code points a single-character AST node may produce,
 * or undefined when the node cannot be translated into plain ranges of code points (e.g. \b).
 * Produced ranges may be unordered and overlapping.
 * @internal
 */
function toCharRanges(astNode: RegexToken, flags: RegexFlags): GraphemeRange[] | undefined {
  switch (astNode.type) {
    case 'Char': {
      if (astNode.kind === 'meta') {
        switch (astNode.value) {
          case '\\w':
            return wordCharRanges;
          case '\\W':
            return nonWordCharRanges;
          case '\\d':
            return digitCharRanges;
          case '\\D':
            return nonDigitCharRanges;
          case '\\s':
            return spaceCharRanges;
          case '\\S':
            return nonSpaceCharRanges;
          case '.':
            return flags.dotAll ? dotAllCharRanges : dotCharRanges;
          default:
            return undefined; // \b and \B have no single-character expansion
        }
      }
      const codePoint = astNode.codePoint;
      if (codePoint >= 0 && safeStringFromCodePoint(codePoint) === astNode.symbol) {
        return [[codePoint]];
      }
      return undefined;
    }
    case 'ClassRange': {
      const from = astNode.from.codePoint;
      const to = astNode.to.codePoint;
      return from === to ? [[from]] : [[from, to]];
    }
    case 'UnicodeProperty': {
      return unicodePropertyRanges(astNode);
    }
    default:
      return undefined;
  }
}

/**
 * Convert an AST of tokens into an arbitrary able to produce the requested pattern
 * @internal
 */
function toMatchingArbitrary(
  astNode: RegexToken,
  constraints: StringMatchingConstraints,
  flags: RegexFlags,
): Arbitrary<string> {
  switch (astNode.type) {
    case 'Char': {
      if (astNode.kind === 'meta') {
        if (astNode.value === '\\b' || astNode.value === '\\B') {
          throw new Error(`Meta character ${astNode.value} not implemented yet!`);
        }
        const ranges = toCharRanges(astNode, flags);
        if (ranges !== undefined) {
          return rangesToCharArbitrary(ranges);
        }
      }
      if (astNode.symbol === undefined) {
        throw new Error(`Unexpected undefined symbol received for non-meta Char! Received: ${stringify(astNode)}`);
      }
      return constant(astNode.symbol);
    }
    case 'Repetition': {
      const node = toMatchingArbitrary(astNode.expression, constraints, flags);
      switch (astNode.quantifier.kind) {
        case '*': {
          return string({ ...constraints, unit: node });
        }
        case '+': {
          return string({ ...constraints, minLength: 1, unit: node });
        }
        case '?': {
          return string({ ...constraints, minLength: 0, maxLength: 1, unit: node });
        }
        case 'Range': {
          return string({
            ...constraints,
            minLength: astNode.quantifier.from,
            maxLength: astNode.quantifier.to,
            unit: node,
          });
        }
        default: {
          throw raiseUnsupportedASTNode(astNode.quantifier);
        }
      }
    }
    case 'Quantifier': {
      throw new Error(`Wrongly defined AST tree, Quantifier nodes not supposed to be scanned!`);
    }
    case 'Alternative': {
      // Glue consecutive Char nodes (and drop ^/$ assertions in no-multiline mode) into fewer children, so we generate faster.
      const childrenArbitraries: Arbitrary<string>[] = [];
      let pendingAggregatedValue = '';
      for (const n of astNode.expressions) {
        if (n.type === 'Char' && n.kind !== 'meta' && n.symbol !== undefined) {
          // Plain char: accumulate it into the pending run instead of a dedicated child leading to a constant of one Char
          pendingAggregatedValue += n.symbol;
        } else if (flags.multiline || n.type !== 'Assertion' || (n.kind !== '^' && n.kind !== '$')) {
          // Any other node, except ^/$ assertions when in no-multiline mode
          if (pendingAggregatedValue !== '') {
            safePush(childrenArbitraries, constant(pendingAggregatedValue));
            pendingAggregatedValue = '';
          }
          safePush(childrenArbitraries, toMatchingArbitrary(n, constraints, flags));
        }
      }
      if (pendingAggregatedValue !== '') {
        safePush(childrenArbitraries, constant(pendingAggregatedValue));
      }
      // With 0 or 1 child we skip the tuple to avoid extra post-generate work
      if (childrenArbitraries.length === 0) {
        return constant(''); // e.g. ^$ in no-multiline mode
      }
      if (childrenArbitraries.length === 1) {
        return childrenArbitraries[0];
      }
      // Otherwise join their results
      // TODO - No unmap implemented yet!
      return tuple(...childrenArbitraries).map((vs) => safeJoin(vs, ''));
    }
    case 'CharacterClass': {
      // Try to flatten the whole class into ranges of code points to be able to draw the character in one shot,
      // instead of relying on a oneof tree (non-negated) or on rejection sampling (negated)
      let flattenedRanges: GraphemeRange[] | undefined = [];
      for (const n of astNode.expressions) {
        const childRanges = toCharRanges(n, flags);
        if (childRanges === undefined) {
          flattenedRanges = undefined;
          break;
        }
        safePush(flattenedRanges, ...childRanges);
      }
      if (flattenedRanges !== undefined) {
        const ranges = astNode.negative
          ? subtractGraphemeRanges(defaultCharRanges, unionGraphemeRanges(flattenedRanges))
          : unionGraphemeRanges(flattenedRanges);
        if (ranges.length !== 0) {
          return rangesToCharArbitrary(ranges);
        }
        // The class declares no char at all (e.g. [] or [^\s\S]): fall back to the legacy handling below
      }
      if (astNode.negative) {
        const childrenArbitraries = safeMap(astNode.expressions, (n) => toMatchingArbitrary(n, constraints, flags));
        return defaultChar().filter((c) => safeEvery(childrenArbitraries, (arb) => !arb.canShrinkWithoutContext(c)));
      }
      return oneof(...safeMap(astNode.expressions, (n) => toMatchingArbitrary(n, constraints, flags)));
    }
    case 'ClassRange': {
      const min = astNode.from.codePoint;
      const max = astNode.to.codePoint;
      return integer({ min, max }).map(
        (n) => safeStringFromCodePoint(n),
        (c) => {
          if (typeof c !== 'string') throw new Error('Invalid type');
          if ([...c].length !== 1) throw new Error('Invalid length');
          // oxlint-disable-next-line typescript/no-non-null-assertion
          return safeCharCodeAt(c, 0)!;
        },
      );
    }
    case 'Group': {
      return toMatchingArbitrary(astNode.expression, constraints, flags);
    }
    case 'Disjunction': {
      const stack = [astNode.left, astNode.right];
      const branches: Arbitrary<string>[] = [];
      for (let i = 0; i !== stack.length; ++i) {
        const node = stack[i];
        if (node === null) {
          safePush(branches, constant(''));
        } else if (node.type === 'Disjunction') {
          safePush(stack, node.left);
          safePush(stack, node.right);
        } else {
          safePush(branches, toMatchingArbitrary(node, constraints, flags));
        }
      }
      return oneof(...branches);
    }
    case 'Assertion': {
      if (astNode.kind === '^' || astNode.kind === '$') {
        if (flags.multiline) {
          if (astNode.kind === '^') {
            return oneof(
              constant(''),
              tuple(string({ unit: defaultChar() }), constantFrom(...newLineChars)).map(
                (t) => `${t[0]}${t[1]}`,
                (value) => {
                  if (typeof value !== 'string' || value.length === 0) throw new Error('Invalid type');
                  return [safeSubstring(value, 0, value.length - 1), value[value.length - 1]];
                },
              ),
            );
          } else {
            return oneof(
              constant(''),
              tuple(constantFrom(...newLineChars), string({ unit: defaultChar() })).map(
                (t) => `${t[0]}${t[1]}`,
                (value) => {
                  if (typeof value !== 'string' || value.length === 0) throw new Error('Invalid type');
                  return [value[0], safeSubstring(value, 1)];
                },
              ),
            );
          }
        }
        return constant('');
      }
      throw new Error(`Assertions of kind ${astNode.kind} not implemented yet!`);
    }
    case 'Backreference': {
      throw new Error(`Backreference nodes not implemented yet!`);
    }
    case 'UnicodeProperty': {
      return unicodePropertyArbitrary(astNode);
    }
    default: {
      throw raiseUnsupportedASTNode(astNode);
    }
  }
}

/**
 * For strings matching the provided regex
 *
 * @param regex - Arbitrary able to generate random strings (possibly multiple characters)
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 3.10.0
 * @public
 */
export function stringMatching(regex: RegExp, constraints: StringMatchingConstraints = {}): Arbitrary<string> {
  for (const flag of regex.flags) {
    // Supported:
    //   d - generate indices for substring matches
    //   g - all matches, not limited to first match
    //   m - multiline
    //   s - dot matches newline character
    // Not supported:
    //   i - case-insensitive
    //   u - unicode support
    //   y - search at the exact position in the text or sticky mode
    if (flag !== 'd' && flag !== 'g' && flag !== 'm' && flag !== 's' && flag !== 'u') {
      throw new Error(`Unable to use "stringMatching" against a regex using the flag ${flag}`);
    }
  }
  const maxLength = constraints.maxLength;
  const sanitizedConstraints: StringMatchingConstraints = { size: constraints.size, maxLength };
  const flags: RegexFlags = { multiline: regex.multiline, dotAll: regex.dotAll };
  let regexRootToken = addMissingDotStar(tokenizeRegex(regex));
  if (maxLength !== undefined) {
    regexRootToken = clampRegexAst(regexRootToken, maxLength);
  }
  const baseArbitrary = toMatchingArbitrary(regexRootToken, sanitizedConstraints, flags);
  if (maxLength !== undefined) {
    return baseArbitrary.filter((s) => [...s].length <= maxLength);
  }
  return baseArbitrary;
}
