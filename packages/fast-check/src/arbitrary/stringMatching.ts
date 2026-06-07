import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import {
  safeCharCodeAt,
  safeEvery,
  safeJoin,
  safeSubstring,
  Error,
  safeMap,
  Set,
  safeHas,
  safeAdd,
  safeFilter,
  safePush,
} from '../utils/globals.js';
import { stringify } from '../utils/stringify.js';
import { clampRegexAst } from './_internals/helpers/ClampRegexAst.js';
import type { SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength.js';
import { addMissingDotStar } from './_internals/helpers/SanitizeRegexAst.js';
import type { RegexToken } from './_internals/helpers/TokenizeRegex.js';
import { tokenizeRegex } from './_internals/helpers/TokenizeRegex.js';
import { unicodePropertyArbitrary } from './_internals/helpers/UnicodePropertyArbitraryHelper.js';
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

// Some predefined chars or groups of chars
// https://www.w3schools.com/jsref/jsref_regexp_whitespace.asp
const wordChars = [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'];
const digitChars = [...'0123456789'];
const spaceChars = [...' \t\r\n\v\f'];
const newLineChars = [...'\r\n'];
const terminatorChars = [...'\x1E\x15'];
const newLineAndTerminatorChars = [...newLineChars, ...terminatorChars];

// Precomputed membership sets for faster lookups
const wordCharsSet = new Set(wordChars);
const digitCharsSet = new Set(digitChars);
const spaceCharsSet = new Set(spaceChars);
const terminatorCharsSet = new Set(terminatorChars);
const newLineAndTerminatorCharsSet = new Set(newLineAndTerminatorChars);

const defaultChar = () => string({ unit: 'grapheme-ascii', minLength: 1, maxLength: 1 });

// The set of characters producible by `defaultChar()` (the 95 printable ASCII chars, 0x20..0x7e).
// Computed once at module load by probing `canShrinkWithoutContext` so it stays in sync with `defaultChar`.
const defaultCharUniverse: string[] = (() => {
  const arb = defaultChar();
  const universe: string[] = [];
  // The universe is the 95 printable ASCII chars (0x20..0x7e); we probe a slightly wider
  // range to stay robust if `defaultChar` ever changes.
  for (let cp = 0x00; cp <= 0xff; ++cp) {
    const ch = safeStringFromCodePoint(cp);
    if (arb.canShrinkWithoutContext(ch)) {
      safePush(universe, ch);
    }
  }
  return universe;
})();

function raiseUnsupportedASTNode(astNode: never): Error {
  return new Error(`Unsupported AST node! Received: ${stringify(astNode)}`);
}

type RegexFlags = {
  multiline: boolean;
  dotAll: boolean;
};

/**
 * Expand a child of a negated CharacterClass into the concrete set of characters it forbids
 * (only chars within the printable-ASCII universe matter; adding extras is harmless).
 * Returns false when the child cannot be expanded simply (e.g. negated metas, UnicodeProperty),
 * signalling the caller to fall back to rejection sampling.
 * @internal
 */
function collectForbiddenChars(astNode: RegexToken, forbidden: Set<string>): boolean {
  if (astNode.type === 'ClassRange') {
    const from = astNode.from.codePoint;
    const to = astNode.to.codePoint;
    for (let cp = from; cp <= to; ++cp) {
      safeAdd(forbidden, safeStringFromCodePoint(cp));
    }
    return true;
  }
  if (astNode.type === 'Char') {
    if (astNode.kind === 'meta') {
      let members: string[] | undefined;
      switch (astNode.value) {
        case '\\w':
          members = wordChars;
          break;
        case '\\d':
          members = digitChars;
          break;
        case '\\s':
          members = spaceChars;
          break;
        default:
          // \W, \D, \S, ., \b, \B cannot be expanded into a simple forbidden set here
          return false;
      }
      for (const ch of members) {
        safeAdd(forbidden, ch);
      }
      return true;
    }
    if (astNode.symbol === undefined) {
      return false;
    }
    safeAdd(forbidden, astNode.symbol);
    return true;
  }
  return false;
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
        switch (astNode.value) {
          case '\\w': {
            return constantFrom(...wordChars);
          }
          case '\\W': {
            return defaultChar().filter((c) => !safeHas(wordCharsSet, c));
          }
          case '\\d': {
            return constantFrom(...digitChars);
          }
          case '\\D': {
            return defaultChar().filter((c) => !safeHas(digitCharsSet, c));
          }
          case '\\s': {
            return constantFrom(...spaceChars);
          }

          case '\\S': {
            return defaultChar().filter((c) => !safeHas(spaceCharsSet, c));
          }
          case '\\b':
          case '\\B': {
            throw new Error(`Meta character ${astNode.value} not implemented yet!`);
          }
          case '.': {
            const forbiddenChars = flags.dotAll ? terminatorCharsSet : newLineAndTerminatorCharsSet;
            return defaultChar().filter((c) => !safeHas(forbiddenChars, c));
          }
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
      // TODO - No unmap implemented yet!
      return tuple(...safeMap(astNode.expressions, (n) => toMatchingArbitrary(n, constraints, flags))).map((vs) =>
        safeJoin(vs, ''),
      );
    }
    case 'CharacterClass':
      if (astNode.negative) {
        // Negated class: produce the universe (printable ASCII) minus everything the children forbid.
        // We try to expand each child into a concrete set of forbidden code points within the universe.
        // If any child cannot be expanded simply, we fall back to rejection sampling (correctness first).
        const forbidden = new Set<string>();
        let canExpandAll = true;
        for (const n of astNode.expressions) {
          if (!collectForbiddenChars(n, forbidden)) {
            canExpandAll = false;
            break;
          }
        }
        if (canExpandAll) {
          const allowedChars = safeFilter(defaultCharUniverse, (ch) => !safeHas(forbidden, ch));
          return constantFrom(...allowedChars);
        }
        const childrenArbitraries = safeMap(astNode.expressions, (n) => toMatchingArbitrary(n, constraints, flags));
        return defaultChar().filter((c) => safeEvery(childrenArbitraries, (arb) => !arb.canShrinkWithoutContext(c)));
      }
      {
        // Non-negated class: if every child is a simple single-code-point producer (a non-meta Char with
        // a defined symbol, or a ClassRange), build ONE flat arbitrary over the union of all members via
        // mapToConstant. Otherwise fall back to oneof (e.g. meta chars, UnicodeProperty).
        const entries: { num: number; build: (idInGroup: number) => string }[] = [];
        let canFlatten = true;
        for (const n of astNode.expressions) {
          if (n.type === 'ClassRange') {
            const from = n.from.codePoint;
            const to = n.to.codePoint;
            safePush(entries, { num: to - from + 1, build: (i: number) => safeStringFromCodePoint(from + i) });
          } else if (n.type === 'Char' && n.kind !== 'meta' && n.symbol !== undefined) {
            const symbol = n.symbol;
            safePush(entries, { num: 1, build: () => symbol });
          } else {
            canFlatten = false;
            break;
          }
        }
        if (canFlatten && entries.length !== 0) {
          return mapToConstant(...entries);
        }
      }
      return oneof(...safeMap(astNode.expressions, (n) => toMatchingArbitrary(n, constraints, flags)));
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
      const left = astNode.left !== null ? toMatchingArbitrary(astNode.left, constraints, flags) : constant('');
      const right = astNode.right !== null ? toMatchingArbitrary(astNode.right, constraints, flags) : constant('');
      return oneof(left, right);
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
