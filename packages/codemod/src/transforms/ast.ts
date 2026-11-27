import type {
  ASTPath,
  CallExpression,
  Collection,
  ArrowFunctionExpression,
  FunctionExpression,
  Identifier,
  JSCodeshift,
  MemberExpression,
  Node,
  ObjectProperty,
} from 'jscodeshift';

export function isNamedMember(j: JSCodeshift, node: unknown): node is MemberExpression & { property: Identifier } {
  return j.MemberExpression.check(node) && !node.computed && j.Identifier.check(node.property);
}

export function isNamedProperty(j: JSCodeshift, node: unknown): node is ObjectProperty & { key: Identifier } {
  return j.ObjectProperty.check(node) && !node.computed && j.Identifier.check(node.key);
}

export function isFunctionExpression(
  j: JSCodeshift,
  node: unknown,
): node is ArrowFunctionExpression | FunctionExpression {
  return j.ArrowFunctionExpression.check(node) || j.FunctionExpression.check(node);
}

export function withComments<T extends Node>(replacement: T, original: Node): T {
  replacement.comments = original.comments;
  return replacement;
}

// Visit children first because replacing a parent invalidates paths to its original children.
export function callsInsideOut(j: JSCodeshift, root: Collection): ASTPath<CallExpression>[] {
  return root.find(j.CallExpression).paths().reverse();
}

export function isResultDiscarded(j: JSCodeshift, call: ASTPath<CallExpression>): boolean {
  const result = j.AwaitExpression.check(call.parent.node) ? call.parent : call;
  return j.ExpressionStatement.check(result.parent.node);
}
