import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength';
import { tokenizeRegex, RegexToken } from './_internals/helpers/TokenizeRegex';
import { char } from './char';
import { constant } from './constant';
import { constantFrom } from './constantFrom';
import { integer } from './integer';
import { oneof } from './oneof';
import { stringOf } from './stringOf';
import { tuple } from './tuple';

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
const wordChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
const digitChars = '0123456789';
const spaceChars = ' \t\r\n\v\f';
const newLineAndTerminatorChars = '\r\n\x1E\x15';

const defaultChar = char();

function raiseUnsupportedASTNode(astNode: never): Error {
  return new Error(`Unsupported AST node! Received: ${JSON.stringify(astNode)}`);
}

/**
 * Convert an AST of tokens into an arbitrary able to produce the requested pattern
 * @internal
 */
function toMatchingArbitrary(astNode: RegexToken, constraints: StringMatchingConstraints): Arbitrary<string> {
  switch (astNode.type) {
    case 'Char': {
      if (astNode.kind === 'meta') {
        switch (astNode.value) {
          case '\\w': {
            return constantFrom(...wordChars);
          }
          case '\\W': {
            return defaultChar.filter((c) => !wordChars.includes(c));
          }
          case '\\d': {
            return constantFrom(...digitChars);
          }
          case '\\D': {
            return defaultChar.filter((c) => !digitChars.includes(c));
          }
          case '\\s': {
            return constantFrom(...spaceChars);
          }

          case '\\S': {
            return defaultChar.filter((c) => !spaceChars.includes(c));
          }
          case '\\b':
          case '\\B': {
            throw new Error(`Meta character ${astNode.value} not implemented yet!`);
          }
          case '.': {
            return defaultChar.filter((c) => !newLineAndTerminatorChars.includes(c));
          }
        }
      }
      if (astNode.symbol === undefined) {
        throw new Error(`Unexpected undefined symbol received for non-meta Char! Received: ${JSON.stringify(astNode)}`);
      }
      return constant(astNode.symbol);
    }
    case 'Repetition': {
      const node = toMatchingArbitrary(astNode.expression, constraints);
      switch (astNode.quantifier.kind) {
        case '*': {
          return stringOf(node, constraints);
        }
        case '+': {
          return stringOf(node, { ...constraints, minLength: 1 });
        }
        case '?': {
          return stringOf(node, { ...constraints, minLength: 0, maxLength: 1 });
        }
        case 'Range': {
          return stringOf(node, {
            ...constraints,
            minLength: astNode.quantifier.from,
            maxLength: astNode.quantifier.to,
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
      return tuple(...astNode.expressions.map((n) => toMatchingArbitrary(n, constraints))).map((vs) => vs.join(''));
    }
    case 'CharacterClass':
      if (astNode.negative) {
        const childrenArbitraries = astNode.expressions.map((n) => toMatchingArbitrary(n, constraints));
        return defaultChar.filter((c) => childrenArbitraries.every((arb) => !arb.canShrinkWithoutContext(c)));
      }
      return oneof(...astNode.expressions.map((n) => toMatchingArbitrary(n, constraints)));
    case 'ClassRange': {
      const min = astNode.from.codePoint;
      const max = astNode.to.codePoint;
      return integer({ min, max }).map(
        (n) => String.fromCodePoint(n),
        (c) => {
          if (typeof c !== 'string') throw new Error('Invalid type');
          if ([...c].length !== 1) throw new Error('Invalid length');
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return c.codePointAt(0)!;
        }
      );
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
  if (regex.flags.includes('i')) {
    throw new Error('Unable to produce string matching case insensitive regexes');
  }
  if (regex.flags.includes('u')) {
    throw new Error('Unable to produce string matching unicode regexes');
  }
  const sanitizedConstraints: StringMatchingConstraints = { size: constraints.size };
  const regexRootToken = tokenizeRegex(regex);
  return toMatchingArbitrary(regexRootToken, sanitizedConstraints);
}
