import type {
  ASTNode,
  ASTPath,
  ArrowFunctionExpression,
  BlockStatement,
  FunctionDeclaration,
  FunctionExpression,
  JSCodeshift,
} from 'jscodeshift';
import { isFunctionExpression } from './ast.js';
import { findBinding, isConstDeclarator } from './bindings.js';

type Callback = ArrowFunctionExpression | FunctionExpression | FunctionDeclaration;

export function resolveCallback(j: JSCodeshift, path: ASTPath, expression: unknown): Callback | undefined {
  if (isFunctionExpression(j, expression)) {
    return expression;
  }
  if (!j.Identifier.check(expression)) {
    return undefined;
  }
  const declaration = findBinding(j, path, expression.name)?.parent;
  if (j.FunctionDeclaration.check(declaration?.node)) {
    return declaration.node;
  }
  if (isConstDeclarator(j, declaration) && isFunctionExpression(j, declaration.node.init)) {
    return declaration.node.init;
  }
}

export function usesReceiver(j: JSCodeshift, node: ASTNode): boolean {
  const root = j(node);
  return root.find(j.ThisExpression).size() > 0 || root.find(j.Super).size() > 0;
}

export function callbackStatements(j: JSCodeshift, body: Callback['body']): BlockStatement['body'] {
  return j.BlockStatement.check(body) ? body.body : [j.returnStatement(body)];
}
