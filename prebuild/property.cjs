// @ts-check
const { commas, iota, txCommas } = require('./helpers.cjs');

/**
 * @param num {number}
 * @param isAsync {boolean}
 */
const predicateFor = function(num, isAsync) {
  return isAsync
    ? `(${commas(num, v => `t${v}:T${v}`)}) => Promise<boolean|void>`
    : `(${commas(num, v => `t${v}:T${v}`)}) => (boolean|void)`;
};

/**
 * @param num {number}
 * @param isAsync {boolean}
 */
const signatureFor = (num, isAsync) => {
  const functionName = isAsync ? 'asyncProperty' : 'property';
  const className = isAsync ? 'AsyncProperty' : 'Property';
  return `
        /**
         * Instantiate a new {@link ${className}}
         * @param predicate Assess the success of the property. Would be considered falsy if its throws or if its output evaluates to false
         */
        function ${functionName}<${txCommas(num)}>(
            ${commas(num, v => `arb${v}:Arbitrary<T${v}>`)},
            predicate: ${predicateFor(num, isAsync)}
        ): ${className}<[${txCommas(num)}]>;`;
};

/**
 * @param num {number}
 * @param isAsync {boolean}
 */
const generateProperty = (num, isAsync) => {
  const functionName = isAsync ? 'asyncProperty' : 'property';
  const className = isAsync ? 'AsyncProperty' : 'Property';
  const blocks = [
    // imports
    `import { Arbitrary } from '../arbitrary/definition/Arbitrary';`,
    `import { genericTuple } from '../arbitrary/TupleArbitrary';`,
    `import { ${className} } from './${className}.generic';`,
    // declare all signatures
    ...iota(num).map(id => signatureFor(id + 1, isAsync)),
    // declare function
    `function ${functionName}(...args: any[]): any {
      if (args.length < 2) throw new Error('${functionName} expects at least two parameters');
      const arbs = args.slice(0, args.length -1);
      const p = args[args.length -1];
      return new ${className}(genericTuple(arbs), t => p(...t));
    }`,
    // export
    `export { ${functionName} };`
  ];

  return blocks.join('\n');
};

/**
 * @param num {number}
 * @param isAsync {boolean}
 */
const testBasicCall = (num, isAsync) => {
  const functionName = isAsync ? 'asyncProperty' : 'property';
  const kAsync = isAsync ? 'async' : '';
  const kAwait = isAsync ? 'await' : '';
  return `
        it('Should call the underlying arbitraries in ${functionName}${num}', ${kAsync} () => {
            let data = null;
            const p = ${functionName}(
                        ${commas(num, v => `stubArb.single(${v * v})`)},
                        ${kAsync} (${commas(num, v => `a${v}:number`)}) => {
                data = [${commas(num, v => `a${v}`)}];
                return true;
            });
            expect(${kAwait} p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
            expect(data).toEqual([${commas(num, v => `${v * v}`)}]);
        });
    `;
};

/**
 * @param num {number}
 * @param isAsync {boolean}
 */
const generatePropertySpec = (num, isAsync) => {
  const functionName = isAsync ? 'asyncProperty' : 'property';
  const className = isAsync ? 'AsyncProperty' : 'Property';
  const blocks = [
    // imports
    `import * as stubArb from '../../stubs/arbitraries';`,
    `import * as stubRng from '../../stubs/generators';`,
    `import { ${functionName} } from '../../../../src/check/property/${className}';`,
    // start blocks
    `describe('${className}', () => {`,
    // tests
    ...iota(num).map(id => testBasicCall(id + 1, isAsync)),
    // end blocks
    `});`
  ];

  return blocks.join('\n');
};

exports.generateProperty = generateProperty;
exports.generatePropertySpec = generatePropertySpec;
