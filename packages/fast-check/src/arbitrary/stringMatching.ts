import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { safeCharCodeAt, safeEvery, safeJoin, safeSubstring, Error, safeIndexOf, safeMap } from '../utils/globals';
import { stringify } from '../utils/stringify';
import type { SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength';
import { addMissingDotStar } from './_internals/helpers/SanitizeRegexAst';
import type { RegexToken } from './_internals/helpers/TokenizeRegex';
import { tokenizeRegex } from './_internals/helpers/TokenizeRegex';
import { constant } from './constant';
import { constantFrom } from './constantFrom';
import { integer } from './integer';
import { oneof } from './oneof';
import { string } from './string';
import { tuple } from './tuple';

const safeStringFromCodePoint = String.fromCodePoint;

/**
 * Constraints to be applied on the arbitrary {@link stringMatching}
 * @remarks Since 3.10.0
 * @public
 */
export type StringMatchingConstraints = {
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

const defaultChar = () => string({ unit: 'grapheme-ascii', minLength: 1, maxLength: 1 });

function raiseUnsupportedASTNode(astNode: never): Error {
  return new Error(`Unsupported AST node! Received: ${stringify(astNode)}`);
}

type RegexFlags = {
  multiline: boolean;
  dotAll: boolean;
};

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
            return defaultChar().filter((c) => safeIndexOf(wordChars, c) === -1);
          }
          case '\\d': {
            return constantFrom(...digitChars);
          }
          case '\\D': {
            return defaultChar().filter((c) => safeIndexOf(digitChars, c) === -1);
          }
          case '\\s': {
            return constantFrom(...spaceChars);
          }

          case '\\S': {
            return defaultChar().filter((c) => safeIndexOf(spaceChars, c) === -1);
          }
          case '\\b':
          case '\\B': {
            throw new Error(`Meta character ${astNode.value} not implemented yet!`);
          }
          case '.': {
            const forbiddenChars = flags.dotAll ? terminatorChars : newLineAndTerminatorChars;
            return defaultChar().filter((c) => safeIndexOf(forbiddenChars, c) === -1);
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
        const childrenArbitraries = safeMap(astNode.expressions, (n) => toMatchingArbitrary(n, constraints, flags));
        return defaultChar().filter((c) => safeEvery(childrenArbitraries, (arb) => !arb.canShrinkWithoutContext(c)));
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
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
  const sanitizedConstraints: StringMatchingConstraints = { size: constraints.size };
  const flags: RegexFlags = { multiline: regex.multiline, dotAll: regex.dotAll };
  const regexRootToken = addMissingDotStar(tokenizeRegex(regex));
  return toMatchingArbitrary(regexRootToken, sanitizedConstraints, flags);
}
