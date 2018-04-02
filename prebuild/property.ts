// tslint:disable:no-multiline-string
import { arbCommas, commas, iota, txCommas } from './helpers';

const predicateFor = (num: number, isAsync: boolean): string =>
  isAsync
    ? `(${commas(num, v => `t${v}:T${v}`)}) => Promise<boolean|void>`
    : `(${commas(num, v => `t${v}:T${v}`)}) => (boolean|void)`;

const signatureFor = (num: number, isAsync: boolean): string => {
  const functionName = isAsync ? 'asyncProperty' : 'property';
  const className = isAsync ? 'AsyncProperty' : 'Property';
  return `
        function ${functionName}<${txCommas(num)}>(
            ${commas(num, v => `arb${v}:Arbitrary<T${v}>`)},
            predicate: ${predicateFor(num, isAsync)}
        ): ${className}<[${txCommas(num)}]>;`;
};
const finalSignatureFor = (num: number, isAsync: boolean): string => {
  const functionName = isAsync ? 'asyncProperty' : 'property';
  return `
        function ${functionName}<${txCommas(num)}>(
            ${commas(num, v => `arb${v}?: Arbitrary<T${v}> | (${predicateFor(v, isAsync)})`)},
            arb${num}?: ${predicateFor(num, isAsync)}
        ) {`;
};
const ifFor = (num: number, isAsync: boolean): string => {
  const className = isAsync ? 'AsyncProperty' : 'Property';
  return `
        if (arb${num}) {
            const p = arb${num} as ${predicateFor(num, isAsync)};
            return new ${className}(
                    tuple(${commas(num, v => `arb${v} as Arbitrary<T${v}>`)})
                    , t => p(${commas(num, v => `t[${v}]`)}));
        }`;
};

const generateProperty = (num: number, isAsync: boolean): string => {
  const functionName = isAsync ? 'asyncProperty' : 'property';
  const className = isAsync ? 'AsyncProperty' : 'Property';
  const blocks = [
    // imports
    `import Arbitrary from '../arbitrary/definition/Arbitrary';`,
    `import { tuple } from '../arbitrary/TupleArbitrary';`,
    `import { ${className} } from './${className}.generic';`,
    // declare all signatures
    ...iota(num).map(id => signatureFor(id + 1, isAsync)),
    // start declare function
    finalSignatureFor(num + 1, isAsync),
    // cascade ifs
    ...iota(num)
      .reverse()
      .map(id => ifFor(id + 1, isAsync)),
    // end declare function
    `}`,
    // export
    `export { ${functionName} };`
  ];

  return blocks.join('\n');
};

const testBasicCall = (num: number, isAsync: boolean): string => {
  const functionName = isAsync ? 'asyncProperty' : 'property';
  const className = isAsync ? 'AsyncProperty' : 'Property';
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
            assert.equal(${kAwait} p.run(p.generate(stubRng.mutable.nocall()).value), null, '${className} should succeed');
            assert.deepEqual(data, [${commas(
              num,
              v => `${v * v}`
            )}], '${className} should forward values and keep ordering');
        });
    `;
};

const generatePropertySpec = (num: number, isAsync: boolean): string => {
  const functionName = isAsync ? 'asyncProperty' : 'property';
  const className = isAsync ? 'AsyncProperty' : 'Property';
  const blocks = [
    // imports
    `import * as assert from 'power-assert';`,
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

export { generateProperty, generatePropertySpec };
