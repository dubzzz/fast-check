import { safePush } from '../../../utils/globals.js';
import { noSuchValue } from '../../../utils/noSuchValue.js';
import type { RegexToken } from './TokenizeRegex.js';

const safeMathFloor = Math.floor;
const safeMathMin = Math.min;

/** @internal */
function clampRegexAstInternal(astNode: RegexToken, maxLength: number): { astNode: RegexToken; minLength: number } {
  switch (astNode.type) {
    case 'Char': {
      return { astNode, minLength: 1 };
    }
    case 'Repetition': {
      switch (astNode.quantifier.kind) {
        case '*': {
          const clamped = clampRegexAstInternal(astNode.expression, maxLength);
          return {
            astNode: {
              type: 'Repetition',
              quantifier: { ...astNode.quantifier, kind: 'Range', from: 0, to: maxLength },
              expression: clamped.astNode,
            },
            minLength: 0,
          };
        }
        case '+': {
          const clamped = clampRegexAstInternal(astNode.expression, maxLength);
          const scaledClampedMinLength = clamped.minLength > 1 ? clamped.minLength : 1;
          return {
            astNode: {
              type: 'Repetition',
              quantifier: {
                ...astNode.quantifier,
                kind: 'Range',
                from: 1,
                to: safeMathFloor(maxLength / scaledClampedMinLength),
              },
              expression: clamped.astNode,
            },
            minLength: clamped.minLength,
          };
        }
        case '?': {
          const clamped = clampRegexAstInternal(astNode.expression, maxLength);
          if (maxLength < clamped.minLength) {
            return {
              astNode: {
                type: 'Repetition',
                quantifier: { ...astNode.quantifier, kind: 'Range', from: 0, to: 0 },
                expression: clamped.astNode,
              },
              minLength: 0,
            };
          }
          return { astNode: { ...astNode, expression: clamped.astNode }, minLength: 0 };
        }
        case 'Range': {
          const scaledMaxLength =
            astNode.quantifier.from > 1 ? safeMathFloor(maxLength / astNode.quantifier.from) : maxLength;
          const clamped = clampRegexAstInternal(astNode.expression, scaledMaxLength);
          const scaledClampedMinLength = clamped.minLength > 1 ? clamped.minLength : 1;
          if (astNode.quantifier.to === undefined || astNode.quantifier.to * scaledClampedMinLength > maxLength) {
            // On unbounded range like {3,} or on bounded range with upper bound strictly higher than the requested maxLength,
            // fallback to the requested maxLength
            return {
              astNode: {
                type: 'Repetition',
                quantifier: {
                  ...astNode.quantifier,
                  kind: 'Range',
                  to: safeMathFloor(maxLength / scaledClampedMinLength),
                },
                expression: clamped.astNode,
              },
              minLength: astNode.quantifier.from * clamped.minLength,
            };
          }
          // Quantifier already bounded at or below maxLength, no adjustment needed on quantifier
          return {
            astNode: { ...astNode, expression: clamped.astNode },
            minLength: astNode.quantifier.from * clamped.minLength,
          };
        }
        default: {
          return noSuchValue(astNode.quantifier, { astNode, minLength: 0 });
        }
      }
    }
    case 'Quantifier': {
      return { astNode, minLength: 0 }; // Not supported
    }
    case 'Alternative': {
      let totalMinLength = 0;
      const extendedClampeds: { value: ReturnType<typeof clampRegexAstInternal>; allowance: number }[] = [];
      for (let index = 0; index !== astNode.expressions.length; ++index) {
        const temporaryAllowance = maxLength - totalMinLength;
        const clamped = clampRegexAstInternal(astNode.expressions[index], temporaryAllowance);
        totalMinLength += clamped.minLength;
        safePush(extendedClampeds, { value: clamped, allowance: temporaryAllowance });
      }
      const refinedExpressions: RegexToken[] = [];
      for (let index = 0; index !== extendedClampeds.length; ++index) {
        const current = extendedClampeds[index].value;
        const pastAllowance = extendedClampeds[index].allowance;
        const allowance = maxLength - totalMinLength + current.minLength;
        const reclamped = allowance !== pastAllowance ? clampRegexAstInternal(current.astNode, allowance) : current;
        safePush(refinedExpressions, reclamped.astNode);
      }
      return { astNode: { ...astNode, expressions: refinedExpressions }, minLength: totalMinLength };
    }
    case 'CharacterClass': {
      return { astNode, minLength: 1 };
    }
    case 'ClassRange': {
      return { astNode, minLength: 1 };
    }
    case 'Group': {
      const clamped = clampRegexAstInternal(astNode.expression, maxLength);
      return { astNode: { ...astNode, expression: clamped.astNode }, minLength: clamped.minLength };
    }
    case 'Disjunction': {
      if (astNode.left === null) {
        if (astNode.right === null) {
          return { astNode, minLength: 0 };
        }
        const clampedRight = clampRegexAstInternal(astNode.right, maxLength);
        const refinedRight = clampedRight.minLength > maxLength ? null : clampedRight.astNode;
        return {
          astNode: { ...astNode, left: null, right: refinedRight },
          minLength: 0,
        };
      }
      if (astNode.right === null) {
        const clampLeft = clampRegexAstInternal(astNode.left, maxLength);
        const refinedLeft = clampLeft.minLength > maxLength ? null : clampLeft.astNode;
        return {
          astNode: { ...astNode, left: refinedLeft, right: null },
          minLength: 0,
        };
      }
      const clampedLeft = clampRegexAstInternal(astNode.left, maxLength);
      const clampedRight = clampRegexAstInternal(astNode.right, maxLength);
      if (clampedLeft.minLength > maxLength) {
        return clampedRight;
      }
      if (clampedRight.minLength > maxLength) {
        return clampedLeft;
      }
      return {
        astNode: { ...astNode, left: clampedLeft.astNode, right: clampedRight.astNode },
        minLength: safeMathMin(clampedLeft.minLength, clampedRight.minLength),
      };
    }
    case 'Assertion': {
      return { astNode, minLength: 0 };
    }
    case 'Backreference': {
      return { astNode, minLength: 0 }; // Not supported
    }
  }
}

/**
 * Adapt an AST Node to fit within a maxLength constraint
 * @param astNode - The AST to be adapted
 * @param maxLength - The max authorized length
 */
export function clampRegexAst(astNode: RegexToken, maxLength: number): RegexToken {
  return clampRegexAstInternal(astNode, maxLength).astNode;
}
