import { stringify } from '../../../utils/stringify.js';
import type { RegexToken } from './TokenizeRegex.js';

function raiseUnsupportedASTNode(astNode: never): Error {
  return new Error(`Unsupported AST node! Received: ${stringify(astNode)}`);
}

type TraversalResults = { hasStart: boolean; hasEnd: boolean };

function addMissingDotStarTraversalAddMissing(astNode: RegexToken, isFirst: boolean, isLast: boolean): RegexToken {
  if (!isFirst && !isLast) {
    return astNode;
  }
  const traversalResults = { hasStart: false, hasEnd: false };
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const revampedNode = addMissingDotStarTraversal(astNode, isFirst, isLast, traversalResults);
  const missingStart = isFirst && !traversalResults.hasStart;
  const missingEnd = isLast && !traversalResults.hasEnd;
  if (!missingStart && !missingEnd) {
    return revampedNode;
  }
  const expressions: RegexToken[] = [];
  if (missingStart) {
    expressions.push({ type: 'Assertion', kind: '^' });
    expressions.push({
      type: 'Repetition',
      quantifier: { type: 'Quantifier', kind: '*', greedy: true },
      expression: { type: 'Char', kind: 'meta', symbol: '.', value: '.', codePoint: Number.NaN },
    });
  }
  expressions.push(revampedNode);
  if (missingEnd) {
    expressions.push({
      type: 'Repetition',
      quantifier: { type: 'Quantifier', kind: '*', greedy: true },
      expression: { type: 'Char', kind: 'meta', symbol: '.', value: '.', codePoint: Number.NaN },
    });
    expressions.push({ type: 'Assertion', kind: '$' });
  }
  return { type: 'Group', capturing: false, expression: { type: 'Alternative', expressions } };
}

function addMissingDotStarTraversal(
  astNode: RegexToken,
  isFirst: boolean,
  isLast: boolean,
  traversalResults: TraversalResults,
): RegexToken {
  switch (astNode.type) {
    case 'Char':
      return astNode;
    case 'Repetition':
      return astNode;
    case 'Quantifier':
      throw new Error(`Wrongly defined AST tree, Quantifier nodes not supposed to be scanned!`);
    case 'Alternative':
      traversalResults.hasStart = true; // disjunction always adds missing start and end if any
      traversalResults.hasEnd = true;
      return {
        ...astNode,
        expressions: astNode.expressions.map((node, index) =>
          addMissingDotStarTraversalAddMissing(
            node,
            isFirst && index === 0,
            isLast && index === astNode.expressions.length - 1,
          ),
        ),
      };
    case 'CharacterClass':
      return astNode;
    case 'ClassRange':
      return astNode;
    case 'Group': {
      return {
        ...astNode,
        expression: addMissingDotStarTraversal(astNode.expression, isFirst, isLast, traversalResults),
      };
    }
    case 'Disjunction': {
      traversalResults.hasStart = true; // disjunction always adds missing start and end if any
      traversalResults.hasEnd = true;
      return {
        ...astNode,
        left: astNode.left !== null ? addMissingDotStarTraversalAddMissing(astNode.left, isFirst, isLast) : null,
        right: astNode.right !== null ? addMissingDotStarTraversalAddMissing(astNode.right, isFirst, isLast) : null,
      };
    }
    case 'Assertion': {
      if (astNode.kind === '^' || astNode.kind === 'Lookahead') {
        traversalResults.hasStart = true;
        return astNode;
      } else if (astNode.kind === '$' || astNode.kind === 'Lookbehind') {
        traversalResults.hasEnd = true;
        return astNode;
      } else {
        throw new Error(`Assertions of kind ${astNode.kind} not implemented yet!`);
      }
    }
    case 'Backreference':
      return astNode;
    default:
      throw raiseUnsupportedASTNode(astNode);
  }
}

/**
 * Revamp a regex token tree into one featuring missing ^ and $ assertions.
 *
 * WARNING: The produced tree may not define the same groups.
 * Refer to the unit tests for more details on this limitation.
 *
 * @internal
 */
export function addMissingDotStar(astNode: RegexToken): RegexToken {
  return addMissingDotStarTraversalAddMissing(astNode, true, true);
}
