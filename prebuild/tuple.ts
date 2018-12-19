import { arbCommas, commas, iota, joiner, txCommas, txXor } from './helpers';

const classFor = (num: number): string =>
  `
        /** @hidden */
        export class Tuple${num}Arbitrary<${txCommas(num)}> extends Arbitrary<[${txCommas(num)}]> {
            readonly tupleArb: GenericTupleArbitrary<${txXor(num)}>;
            constructor(${commas(num, v => `readonly arb${v}: Arbitrary<T${v}>`)}) {
                super();
                this.tupleArb = new GenericTupleArbitrary<${txXor(num)}>([${arbCommas(num)}]);
            }
            generate(mrng: Random): Shrinkable<[${txCommas(num)}]> {
                return this.tupleArb.generate(mrng) as Shrinkable<[${txCommas(num)}]>;
            }
            withBias(freq: number) {
                return new Tuple${num}Arbitrary(${commas(num, v => `this.arb${v}.withBias(freq)`)});
            }
        };
    `;

const signatureFor = (num: number, opt?: boolean): string =>
  `
        /**
         * For tuples of [${txCommas(num)}]
         * ${joiner(num, v => `@param arb${v} Arbitrary responsible for T${v}`, '\n* ')}
         */
        function tuple<${txCommas(num)}>(
                ${commas(num, v => `arb${v}${opt === true ? '?' : ''}: Arbitrary<T${v}>`)}
                )`;

const ifFor = (num: number): string =>
  `
        if (arb${num - 1}) {
            return new Tuple${num}Arbitrary(
                ${commas(num, v => `arb${v} as Arbitrary<T${v}>`)}
            );
        }`;

const generateTuple = (num: number): string => {
  const blocks = [
    // imports
    `import { Arbitrary } from './definition/Arbitrary';`,
    `import { Shrinkable } from './definition/Shrinkable';`,
    `import { Random } from '../../random/generator/Random';`,
    `import { GenericTupleArbitrary } from './TupleArbitrary.generic';`,
    // declare all necessary classes
    ...iota(num).map(id => classFor(id + 1)),
    // declare all signatures
    ...iota(num).map(id => `${signatureFor(id + 1)}: Tuple${id + 1}Arbitrary<${txCommas(id + 1)}>;`),
    // start declare function
    `${signatureFor(num, true)} {`,
    // cascade ifs
    ...iota(num)
      .reverse()
      .map(id => ifFor(id + 1)),
    // end declare function
    `}`,
    // export
    `export { tuple };`
  ];

  return blocks.join('\n');
};

const simpleUnitTest = (num: number, biased: boolean): string =>
  `
        it('Should produce the same output for tuple${num} and genericTuple${biased ? ' (enforced bias)' : ''}', () => {
            const tupleArb = tuple(${commas(num, v => `dummy(${v * v})`)})${biased ? '.withBias(1)' : ''};
            const genericTupleArb = genericTuple([${commas(num, v => `dummy(${v * v})`)}])${
    biased ? '.withBias(1)' : ''
  };
            const mrng1 = stubRng.mutable.fastincrease(0);
            const mrng2 = stubRng.mutable.fastincrease(0);
            const g1 = tupleArb.generate(mrng1).value;
            const g2 = genericTupleArb.generate(mrng2).value;
            expect(g1).toEqual(g2);
        });
    `;

const generateTupleSpec = (num: number): string => {
  const blocks = [
    // imports
    `import { dummy } from './TupleArbitrary.properties';`,
    `import * as stubRng from '../../stubs/generators';`,
    `import { tuple, genericTuple } from '../../../../src/check/arbitrary/TupleArbitrary';`,
    // start blocks
    `describe('TupleArbitrary', () => {`,
    `    describe('tuple', () => {`,
    // units
    ...iota(num).map(id => simpleUnitTest(id + 1, false)),
    ...iota(num).map(id => simpleUnitTest(id + 1, true)),
    // end blocks
    `   });`,
    `});`
  ];

  return blocks.join('\n');
};

export { generateTuple, generateTupleSpec };
