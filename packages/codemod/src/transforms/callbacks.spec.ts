import jscodeshift from 'jscodeshift';
import { describe, expect, it } from 'vitest';
import { callbackStatements, resolveCallback, usesReceiver } from './callbacks.js';

const j = jscodeshift.withParser('ts');

describe('resolveCallback', () => {
  it('should resolve inline functions, declarations and const callbacks at the call site', () => {
    const root = j(`function declared() {}
      const handler = () => {};
      let mutable = () => {};
      use(declared, handler, function () {}, mutable, missing);
      { const handler = other; use(handler); }`);
    const callbacks = root
      .find(j.CallExpression)
      .paths()
      .map((path) => path.node.arguments.map((arg) => resolveCallback(j, path, arg)?.type));
    expect(callbacks).toEqual([
      ['FunctionDeclaration', 'ArrowFunctionExpression', 'FunctionExpression', undefined, undefined],
      [undefined],
    ]);
  });
});

describe('usesReceiver', () => {
  it('should detect this and super in callbacks', () => {
    const root = j('class B extends A { method() { use(() => this.x, () => super.method(), () => x); } }');
    expect(
      root
        .find(j.ArrowFunctionExpression)
        .nodes()
        .map((fn) => usesReceiver(j, fn)),
    ).toEqual([true, true, false]);
  });
});

describe('callbackStatements', () => {
  it('should preserve the return value of expression bodies and reuse block statements', () => {
    const [expression, block] = j('use(() => result, () => { work(); });').find(j.ArrowFunctionExpression).nodes();
    expect(callbackStatements(j, expression.body)).toMatchObject([
      { type: 'ReturnStatement', argument: expression.body },
    ]);
    expect(callbackStatements(j, block.body)).toBe(j(block).find(j.BlockStatement).nodes()[0].body);
  });
});
