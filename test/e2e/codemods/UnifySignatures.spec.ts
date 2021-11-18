// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { applyTransform } from 'jscodeshift/dist/testUtils';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as unifySignatureTransform from '../../../codemods/unify-signatures/transform.cjs';

const defaultTransformOptions = {
  simplifyMin: false,
  simplifyMax: false,
  local: false,
};

describe('codemods::unify-signature', () => {
  describe('require', () => {
    it('should recognize default require', () => {
      const source = trim`
        const fc = require('fast-check');
        fc.assert(fc.property(fc.array(fc.nat(), 7, 10), () => true));
      `;
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).not.toBe(sanitize(source));
      expect(output).toMatchSnapshot();
    });

    it('should not recognize default require from other libraries', () => {
      const source = trim`
        const fc = require('not-fast-check');
        fc.assert(fc.property(fc.array(fc.nat(), 7, 10), () => true));
      `;
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    it('should recognize named require', () => {
      const source = trim`
        const { assert, property, array, nat } = require('fast-check');
        assert(property(array(nat(), 7, 10), () => true));
      `;
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).not.toBe(sanitize(source));
      expect(output).toMatchSnapshot();
    });

    it('should not recognize named require from other libraries', () => {
      const source = trim`
        const { assert, property, array, nat } = require('not-fast-check');
        assert(property(array(nat(), 7, 10), () => true));
      `;
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    it('should recognize aliased require', () => {
      const source = trim`
        const { assert, property, nat } = require('fast-check');
        const { array: fcArray } = require('fast-check');
        assert(property(fcArray(nat(), 7, 10), () => true));
      `;
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).not.toBe(sanitize(source));
      expect(output).toMatchSnapshot();
    });

    it('should not recognize aliased require from other libraries', () => {
      const source = trim`
        const { assert, property, nat } = require('fast-check');
        const { array: fcArray } = require('not-fast-check');
        assert(property(fcArray(nat(), 7, 10), () => true));
      `;
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    describe('from local files', () => {
      it('should not recognize local default require by default', () => {
        const source = trim`
          const fc = require('./path');
          fc.assert(fc.property(fc.array(fc.nat(), 7, 10), () => true));
        `;
        const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
        expect(sanitize(output)).toBe(sanitize(source));
      });

      it('should recognize local default require when --local=true', () => {
        const source = trim`
          const fc = require('./path');
          fc.assert(fc.property(fc.array(fc.nat(), 7, 10), () => true));
        `;
        const output = applyTransform(unifySignatureTransform, { ...defaultTransformOptions, local: true }, { source });
        expect(sanitize(output)).not.toBe(sanitize(source));
        expect(output).toMatchSnapshot();
      });

      it('should not recognize local aliased require by default', () => {
        const source = trim`
          const fc = require('./path');
          const { array: localArray } = require('./path');
          fc.assert(fc.property(localArray(fc.nat(), 7, 10), () => true));
        `;
        const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
        expect(sanitize(output)).toBe(sanitize(source));
      });

      it('should recognize local aliased require when --local=true', () => {
        const source = trim`
          const fc = require('./path');
          const { array: localArray } = require('./path');
          fc.assert(fc.property(localArray(fc.nat(), 7, 10), () => true));
        `;
        const output = applyTransform(unifySignatureTransform, { ...defaultTransformOptions, local: true }, { source });
        expect(sanitize(output)).not.toBe(sanitize(source));
        expect(output).toMatchSnapshot();
      });

      it('should recognize default require from fast-check when --local=true', () => {
        const source = trim`
          const fc = require('fast-check');
          fc.assert(fc.property(fc.array(fc.nat(), 7, 10), () => true));
        `;
        const output = applyTransform(unifySignatureTransform, { ...defaultTransformOptions, local: true }, { source });
        expect(sanitize(output)).not.toBe(sanitize(source));
        expect(output).toMatchSnapshot();
      });

      it('should not recognize default require from other libraries when --local=true', () => {
        const source = trim`
          const fc = require('not-fast-check');
          fc.assert(fc.property(fc.array(fc.nat(), 7, 10), () => true));
        `;
        const output = applyTransform(unifySignatureTransform, { ...defaultTransformOptions, local: true }, { source });
        expect(sanitize(output)).toBe(sanitize(source));
      });
    });
  });

  describe('import', () => {
    it('should recognize default import', () => {
      const source = trim`
        import fc from 'fast-check';
        fc.assert(fc.property(fc.array(fc.nat(), 7, 10), () => true));
      `;
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).not.toBe(sanitize(source));
      expect(output).toMatchSnapshot();
    });

    it('should not recognize default import from other libraries', () => {
      const source = trim`
        import fc from 'not-fast-check';
        fc.assert(fc.property(fc.array(fc.nat(), 7, 10), () => true));
      `;
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    it('should recognize star import', () => {
      const source = trim`
        import * as fc from 'fast-check';
        fc.assert(fc.property(fc.array(fc.nat(), 7, 10), () => true));
      `;
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).not.toBe(sanitize(source));
      expect(output).toMatchSnapshot();
    });

    it('should not recognize star import from other libraries', () => {
      const source = trim`
        import * as fc from 'not-fast-check';
        fc.assert(fc.property(fc.array(fc.nat(), 7, 10), () => true));
      `;
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    it('should recognize named import', () => {
      const source = trim`
        import { assert, property, array, nat } from 'fast-check';
        assert(property(array(nat(), 7, 10), () => true));
      `;
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).not.toBe(sanitize(source));
      expect(output).toMatchSnapshot();
    });

    it('should not recognize named import from other libraries', () => {
      const source = trim`
        import { assert, property, array, nat } from 'not-fast-check';
        assert(property(array(nat(), 7, 10), () => true));
      `;
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    it('should recognize aliased import', () => {
      const source = trim`
        import { assert, property, nat } from 'fast-check';
        import { array as fcArray } from 'fast-check';
        assert(property(fcArray(nat(), 7, 10), () => true));
      `;
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).not.toBe(sanitize(source));
      expect(output).toMatchSnapshot();
    });

    it('should not recognize aliased import from other libraries', () => {
      const source = trim`
        import { assert, property, nat } from 'fast-check';
        import { array as fcArray } from 'not-fast-check';
        assert(property(fcArray(nat(), 7, 10), () => true));
      `;
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    describe('from local files', () => {
      it('should not recognize local default import by default', () => {
        const source = trim`
          import fc from './path';
          fc.assert(fc.property(fc.array(fc.nat(), 7, 10), () => true));
        `;
        const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
        expect(sanitize(output)).toBe(sanitize(source));
      });

      it('should recognize local default import when --local=true', () => {
        const source = trim`
          import fc from './path';
          fc.assert(fc.property(fc.array(fc.nat(), 7, 10), () => true));
        `;
        const output = applyTransform(unifySignatureTransform, { ...defaultTransformOptions, local: true }, { source });
        expect(sanitize(output)).not.toBe(sanitize(source));
        expect(output).toMatchSnapshot();
      });

      it('should not recognize local aliased import by default', () => {
        const source = trim`
          import fc from './path';
          import { array as localArray } from './path';
          fc.assert(fc.property(localArray(fc.nat(), 7, 10), () => true));
        `;
        const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
        expect(sanitize(output)).toBe(sanitize(source));
      });

      it('should recognize local aliased import when --local=true', () => {
        const source = trim`
          import fc from './path';
          import { array as localArray } from './path';
          fc.assert(fc.property(localArray(fc.nat(), 7, 10), () => true));
        `;
        const output = applyTransform(unifySignatureTransform, { ...defaultTransformOptions, local: true }, { source });
        expect(sanitize(output)).not.toBe(sanitize(source));
        expect(output).toMatchSnapshot();
      });

      it('should recognize default import from fast-check when --local=true', () => {
        const source = trim`
          import fc from 'fast-check';
          fc.assert(fc.property(fc.array(fc.nat(), 7, 10), () => true));
        `;
        const output = applyTransform(unifySignatureTransform, { ...defaultTransformOptions, local: true }, { source });
        expect(sanitize(output)).not.toBe(sanitize(source));
        expect(output).toMatchSnapshot();
      });

      it('should not recognize default import from other libraries when --local=true', () => {
        const source = trim`
          import fc from 'not-fast-check';
          fc.assert(fc.property(fc.array(fc.nat(), 7, 10), () => true));
        `;
        const output = applyTransform(unifySignatureTransform, { ...defaultTransformOptions, local: true }, { source });
        expect(sanitize(output)).toBe(sanitize(source));
      });
    });
  });

  function buildSourceFor(expression: string): string {
    return trim`
      const fc = require('fast-check');
      ${expression}
    `;
  }

  describe.each([
    ['hexaString'],
    ['base64String'],
    ['string'],
    ['asciiString'],
    ['unicodeString'],
    ['string16bits'],
    ['fullUnicodeString'],
  ])('%s', (arbitrary) => {
    it.each([
      [`fc.${arbitrary}();`],
      [`fc.${arbitrary}({});`],
      //[`fc.${arbitrary}(maxLength);`], // ambiguous
    ])('should not alter %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    it.each([[`fc.${arbitrary}(5);`], [`fc.${arbitrary}(1, 5);`], [`fc.${arbitrary}(minLength, maxLength);`]])(
      'should migrate %s',
      (expression) => {
        const source = buildSourceFor(expression);
        const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
        expect(sanitize(output)).not.toBe(sanitize(source));
        expect(output).toMatchSnapshot();
      }
    );
  });

  describe.each([['array'], ['stringOf']])('%s', (arbitrary) => {
    it.each([
      [`fc.${arbitrary}(arb);`],
      [`fc.${arbitrary}(arb, {});`],
      //[`fc.${arbitrary}(arb, maxLength);`], // ambiguous
    ])('should not alter %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    it.each([
      [`fc.${arbitrary}(arb, 5);`],
      [`fc.${arbitrary}(arb, 1, 5);`],
      [`fc.${arbitrary}(arb, minLength, maxLength);`],
    ])('should migrate %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).not.toBe(sanitize(source));
      expect(output).toMatchSnapshot();
    });
  });

  describe.each([['set']])('%s', (arbitrary) => {
    it.each([
      [`fc.${arbitrary}(arb);`],
      [`fc.${arbitrary}(arb, {});`],
      [`fc.${arbitrary}(arb, maxLength);`], // ambiguous
      [`fc.${arbitrary}(arb, minLength, maxLength);`], // ambiguous
    ])('should not alter %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    it.each([
      [`fc.${arbitrary}(arb, 5);`],
      [`fc.${arbitrary}(arb, 1, 5);`],
      [`fc.${arbitrary}(arb, function (a, b) { return a === b; });`],
      [`fc.${arbitrary}(arb, (a, b) => a === b);`],
      [`fc.${arbitrary}(arb, 5, (a, b) => a === b);`],
      [`fc.${arbitrary}(arb, maxLength, (a, b) => a === b);`],
      [`fc.${arbitrary}(arb, 1, 5, (a, b) => a === b);`],
      [`fc.${arbitrary}(arb, minLength, maxLength, (a, b) => a === b);`],
      [`fc.${arbitrary}(arb, minLength, maxLength, compare);`],
    ])('should migrate %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).not.toBe(sanitize(source));
      expect(output).toMatchSnapshot();
    });
  });

  describe.each([['subarray'], ['shuffledSubarray']])('%s', (arbitrary) => {
    it.each([[`fc.${arbitrary}([1, 2, 3]);`]])('should not alter %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    it.each([
      [`fc.${arbitrary}([1, 2, 3], 1, 2);`],
      [`fc.${arbitrary}(myArray, 1, 2);`],
      [`fc.${arbitrary}(computeArray(), 1, 2);`],
    ])('should migrate %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).not.toBe(sanitize(source));
      expect(output).toMatchSnapshot();
    });
  });

  describe.each([['json'], ['unicodeJson'], ['jsonObject'], ['unicodeJsonObject']])('%s', (arbitrary) => {
    it.each([
      [`fc.${arbitrary}();`],
      [`fc.${arbitrary}({});`],
      //[`fc.${arbitrary}(maxDepth);`], // ambiguous
    ])('should not alter %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    it.each([[`fc.${arbitrary}(2);`]])('should migrate %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).not.toBe(sanitize(source));
      expect(output).toMatchSnapshot();
    });
  });

  describe.each([['option']])('%s', (arbitrary) => {
    it.each([
      [`fc.${arbitrary}(arb);`],
      [`fc.${arbitrary}(arb, {});`],
      //[`fc.${arbitrary}(arb, freq);`], // ambiguous
    ])('should not alter %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    it.each([[`fc.${arbitrary}(arb, 10);`]])('should migrate %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).not.toBe(sanitize(source));
      expect(output).toMatchSnapshot();
    });
  });

  describe.each([['commands']])('%s', (arbitrary) => {
    it.each([
      [`fc.${arbitrary}([]);`],
      [`fc.${arbitrary}([], {});`],
      //[`fc.${arbitrary}([], maxCommands);`], // ambiguous
    ])('should not alter %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    it.each([[`fc.${arbitrary}([], 10);`]])('should migrate %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).not.toBe(sanitize(source));
      expect(output).toMatchSnapshot();
    });
  });

  describe.each([['lorem']])('%s', (arbitrary) => {
    it.each([
      [`fc.${arbitrary}();`],
      [`fc.${arbitrary}({});`],
      //[`fc.${arbitrary}(num);`], // ambiguous
    ])('should not alter %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    it.each([
      [`fc.${arbitrary}(5);`],
      [`fc.${arbitrary}(5, true);`],
      [`fc.${arbitrary}(5, mode);`],
      [`fc.${arbitrary}(num, mode);`],
    ])('should migrate %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).not.toBe(sanitize(source));
      expect(output).toMatchSnapshot();
    });
  });

  describe.each([['bigInt']])('%s', (arbitrary) => {
    it.each([[`fc.${arbitrary}();`], [`fc.${arbitrary}({});`]])('should not alter %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    it.each([[`fc.${arbitrary}(1n, 2n);`], [`fc.${arbitrary}(min, max);`]])('should migrate %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).not.toBe(sanitize(source));
      expect(output).toMatchSnapshot();
    });
  });

  describe.each([['integer'], ['double'], ['float']])('%s', (arbitrary) => {
    it.each([
      [`fc.${arbitrary}();`],
      [`fc.${arbitrary}({});`],
      //[`fc.${arbitrary}(max);`], // ambiguous
    ])('should not alter %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    it.each([[`fc.${arbitrary}(1);`], [`fc.${arbitrary}(1, 2);`], [`fc.${arbitrary}(min, max);`]])(
      'should migrate %s',
      (expression) => {
        const source = buildSourceFor(expression);
        const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
        expect(sanitize(output)).not.toBe(sanitize(source));
        expect(output).toMatchSnapshot();
      }
    );
  });

  describe.each([['bigUint']])('%s', (arbitrary) => {
    it.each([
      [`fc.${arbitrary}();`],
      [`fc.${arbitrary}({});`],
      //[`fc.${arbitrary}(max);`], // ambiguous
    ])('should not alter %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    it.each([[`fc.${arbitrary}(1n);`]])('should migrate %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).not.toBe(sanitize(source));
      expect(output).toMatchSnapshot();
    });
  });

  describe.each([['nat']])('%s', (arbitrary) => {
    it.each([
      [`fc.${arbitrary}();`],
      [`fc.${arbitrary}({});`],
      //[`fc.${arbitrary}(max);`], // ambiguous
    ])('should not alter %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).toBe(sanitize(source));
    });

    it.each([[`fc.${arbitrary}(1);`]])('should migrate %s', (expression) => {
      const source = buildSourceFor(expression);
      const output = applyTransform(unifySignatureTransform, defaultTransformOptions, { source });
      expect(sanitize(output)).not.toBe(sanitize(source));
      expect(output).toMatchSnapshot();
    });
  });
});

// Helper

function sanitize(code: string): string {
  return code
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length !== 0)
    .join('\n');
}

function trim(template: TemplateStringsArray, ...others: string[]) {
  let code = '';
  for (let index = 0; index !== template.length; ++index) {
    code += template[index];
    if (others[index]) code += others[index];
  }
  const codeLines = code.split('\n');
  while (codeLines[0] === '') {
    codeLines.shift();
  }
  const headingSpacesFirstLine = codeLines[0].length - codeLines[0].trimLeft().length;
  return codeLines.map((line) => line.substr(headingSpacesFirstLine)).join('\n');
}
