import jscodeshift from 'jscodeshift';
import { describe, expect, it } from 'vitest';
import { importedName } from './fastCheck.js';

const j = jscodeshift.withParser('ts');

describe('importedName', () => {
  it('should resolve aliased value imports and skip shadowed, computed and type-only uses', () => {
    const root = j(`import fc from 'fast-check';
      import * as ns from 'fast-check';
      import { sample as draw, type check as checkType } from 'fast-check';
      import type * as types from 'fast-check';
      import { sample as other } from 'another-module';
      fc.check(); ns.assert(); draw(); fc['check'](); checkType(); types.check(); other();
      { const draw = other; draw(); }
      draw();`);
    expect(
      root
        .find(j.CallExpression)
        .paths()
        .map((path) => importedName(j, path, path.node.callee)),
    ).toEqual(['check', 'assert', 'sample', undefined, undefined, undefined, undefined, undefined, 'sample']);
  });
});
