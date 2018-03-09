import  { iota, commas, arbCommas, txCommas } from './helpers';

const classFor = function(num: number): string {
    return `
        export class Tuple${num}Arbitrary<${txCommas(num)}> extends Arbitrary<[${txCommas(num)}]> {
            readonly tupleArb: GenericTupleArbitrary;
            constructor(${commas(num, v => `readonly arb${v}: Arbitrary<T${v}>`)}) {
                super();
                this.tupleArb = new GenericTupleArbitrary([${arbCommas(num)}]);
            }
            generate(mrng: Random): Shrinkable<[${txCommas(num)}]> {
                return this.tupleArb.generate(mrng) as Shrinkable<[${txCommas(num)}]>;
            }
        };
    `;
};
const signatureFor = function(num: number, opt?: boolean): string {
    return `
        function tuple<${txCommas(num)}>(
                ${commas(num, v => `arb${v}${opt === true ? '?' : ''}: Arbitrary<T${v}>`)}
                )`;
};
const ifFor = function(num: number): string {
    return `
        if (arb${num-1}) {
            return new Tuple${num}Arbitrary(
                ${commas(num, v => `arb${v} as Arbitrary<T${v}>`)}
            );
        }`;
};

const generateTuple = function(num: number): string {
    const blocks = [
            // imports
            `import Arbitrary from './definition/Arbitrary';`,
            `import Shrinkable from './definition/Shrinkable';`,
            `import Random from '../../random/generator/Random';`,
            `import { GenericTupleArbitrary } from './TupleArbitrary.generic';`,
            // declare all necessary classes
            ...iota(num).map(num => classFor(num +1)),
            // declare all signatures
            ...iota(num).map(num => `${signatureFor(num +1)}: Tuple${num +1}Arbitrary<${txCommas(num +1)}>;`),
            // start declare function
            `${signatureFor(num +1, true)} {`,
            // cascade ifs
            ...iota(num).reverse().map(num => ifFor(num +1)),
            // end declare function
            `}`,
            // export
            `export { tuple };`
    ];

    return blocks.join('\n');
};

const propertySameSeedSameTupleFor = function(num : number): string {
    return `
        it('Should generate the same tuple${num} with the same random', () => fc.assert(
            propertySameTupleForSameSeed([${commas(num, v => `dummy(${v*v})`)}])
        ));
    `;
};
const propertyShrinkInAllowedFor = function(num : number): string {
    return `
        it('Should shrink tuple${num} within allowed values', () => fc.assert(
            propertyShrinkInRange([${commas(num, v => `dummy(${v*v})`)}])
        ));
    `;
};
const propertyShrinkNotSuggestItselfFor = function(num : number): string {
    return `
        it('Should not suggest input in tuple${num} shrinked values', () => fc.assert(
            propertyNotSuggestInputInShrink([${commas(num, v => `dummy(${v*v})`)}])
        ));
    `;
};

const generateTupleSpec = function(num: number): string {
    const blocks = [
            // imports
            `import fc from '../../../../lib/fast-check';`,
            `import { dummy, propertyNotSuggestInputInShrink, propertySameTupleForSameSeed, propertyShrinkInRange } from './TupleArbitrary.properties';`,
            // start blocks
            `describe('TupleArbitrary', () => {`,
            `    describe('tuple', () => {`,
            // properties
            ...iota(num).map(num => propertySameSeedSameTupleFor(num +1)),
            ...iota(num).map(num => propertyShrinkInAllowedFor(num +1)),
            ...iota(num).map(num => propertyShrinkNotSuggestItselfFor(num +1)),
            // end blocks
            `   });`,
            `});`
    ];

    return blocks.join('\n');
};

export { generateTuple, generateTupleSpec };
