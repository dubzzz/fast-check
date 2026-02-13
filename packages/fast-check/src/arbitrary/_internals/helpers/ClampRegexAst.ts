import { safeMap } from '../../../utils/globals';
import type { RegexToken } from './TokenizeRegex';

/**
 * Adapt an AST Node to fit within a maxLength constraint
 * @param astNode - The AST to be adapted
 * @param maxLength - The max authorized length
 */
export function clampRegexAst(astNode: RegexToken, maxLength: number): RegexToken {
  switch (astNode.type) {
    case 'Char': {
      return astNode;
    }
    case 'Repetition': {
      const refinedExpression = clampRegexAst(astNode.expression, maxLength);
      switch (astNode.quantifier.kind) {
        case '*': {
          return {
            type: 'Repetition',
            quantifier: { ...astNode.quantifier, kind: 'Range', from: 0, to: maxLength },
            expression: refinedExpression,
          };
        }
        case '+': {
          return {
            type: 'Repetition',
            quantifier: { ...astNode.quantifier, kind: 'Range', from: 1, to: maxLength },
            expression: refinedExpression,
          };
        }
        case '?': {
          if (maxLength === 0) {
            return {
              type: 'Repetition',
              quantifier: { ...astNode.quantifier, kind: 'Range', from: 0, to: 0 },
              expression: refinedExpression,
            };
          }
          return { ...astNode, expression: refinedExpression };
        }
        case 'Range': {
          if (astNode.quantifier.to === undefined || astNode.quantifier.to > maxLength) {
            // On unbounded range like {3,} or on bounded range with upper bound strictly higher than the requested maxLength,
            // fallback to the requested maxLength
            return {
              type: 'Repetition',
              quantifier: { ...astNode.quantifier, kind: 'Range', to: maxLength },
              expression: refinedExpression,
            };
          }
          // Quantifier already bounded at or below maxLength, no adjustment needed on quantifier
          return { ...astNode, expression: refinedExpression };
        }
        default: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _unused: never = astNode.quantifier;
          return astNode;
        }
      }
    }
    case 'Quantifier': {
      return astNode; // Not supported
    }
    case 'Alternative': {
      return { ...astNode, expressions: safeMap(astNode.expressions, (n) => clampRegexAst(n, maxLength)) };
    }
    case 'CharacterClass': {
      return astNode;
    }
    case 'ClassRange': {
      return astNode;
    }
    case 'Group': {
      return { ...astNode, expression: clampRegexAst(astNode, maxLength) };
    }
    case 'Disjunction': {
      return {
        ...astNode,
        left: astNode.left !== null ? clampRegexAst(astNode.left, maxLength) : null,
        right: astNode.right !== null ? clampRegexAst(astNode.right, maxLength) : null,
      };
    }
    case 'Assertion': {
      return astNode;
    }
    case 'Backreference': {
      return astNode; // Not supported
    }
  }
}
