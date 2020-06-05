import * as fc from '../../../../../lib/fast-check';

import { escapeForTemplateString } from '../../../../../src/check/arbitrary/helpers/TextEscaper';

describe('TextEscaper', () => {
  describe('escapeForTemplateString', () => {
    it('Should not escape normal characters', () => {
      expect(escapeForTemplateString('a')).toBe('a');
      expect(escapeForTemplateString('z')).toBe('z');
    });
    it('Should escape properly known issues', () => {
      expect(escapeForTemplateString('`')).toBe('\\`');
      expect(escapeForTemplateString('$')).toBe('\\$');
      expect(escapeForTemplateString('\\')).toBe('\\\\');
      expect(escapeForTemplateString('\r')).toBe('\\r');
    });
    it('Should escape properly string containing multiple issues', () => {
      expect(escapeForTemplateString('`hello${1}\r')).toBe('\\`hello\\${1}\\r');
    });
    it('Should escape properly single ascii characters', () => {
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
    it('Should escape properly any string', () =>
      fc.assert(
        fc.property(fc.fullUnicodeString(), (text) => {
          const escapedText = escapeForTemplateString(text);
          expect(eval('`' + escapedText + '`')).toBe(text);
        })
      ));
  });
});
