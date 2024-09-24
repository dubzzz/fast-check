import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import {
  escapeForTemplateString,
  escapeForMultilineComments,
} from '../../../../../src/arbitrary/_internals/helpers/TextEscaper';

describe('escapeForTemplateString', () => {
  it('should not escape normal characters', () => {
    expect(escapeForTemplateString('a')).toBe('a');
    expect(escapeForTemplateString('z')).toBe('z');
  });

  it('should escape properly known issues', () => {
    expect(escapeForTemplateString('`')).toBe('\\`');
    expect(escapeForTemplateString('$')).toBe('\\$');
    expect(escapeForTemplateString('\\')).toBe('\\\\');
    expect(escapeForTemplateString('\r')).toBe('\\r');
  });

  it('should escape properly string containing multiple issues', () => {
    expect(escapeForTemplateString('`hello${1}\r')).toBe('\\`hello\\${1}\\r');
  });

  it('should escape properly single ascii characters', () => {
    for (let i = 0; i !== 128; ++i) {
      const character = String.fromCharCode(i);
      const escapedCharacter = escapeForTemplateString(character);
      try {
        expect(eval('`' + escapedCharacter + '`')).toBe(character);
      } catch (err) {
        throw new Error(`Failed for i = ${i}, got error: ${err}`);
      }
    }
  });

  it('should escape properly any string', () =>
    fc.assert(
      fc.property(fc.string({ unit: 'binary' }), (text) => {
        const escapedText = escapeForTemplateString(text);
        expect(eval('`' + escapedText + '`')).toBe(text);
      }),
    ));
});

describe('escapeForMultilineComments', () => {
  it('should not escape normal characters', () => {
    expect(escapeForMultilineComments('a')).toBe('a');
    expect(escapeForMultilineComments('z')).toBe('z');
  });

  it('should escape properly known issues', () => {
    expect(escapeForMultilineComments('*/')).toBe('*\\/');
  });

  it('should escape properly string containing multiple issues', () => {
    expect(escapeForMultilineComments('*/ */ */')).toBe('*\\/ *\\/ *\\/');
    expect(escapeForMultilineComments('*/ /*/ **// * / /*')).toBe('*\\/ /*\\/ **\\// * / /*');
  });

  it('should escape properly any string', () =>
    fc.assert(
      fc.property(fc.string({ unit: 'binary' }), (text) => {
        const escapedText = escapeForMultilineComments(text);
        expect(eval('/*' + escapedText + '*/"success"')).toBe('success');
      }),
    ));
});
