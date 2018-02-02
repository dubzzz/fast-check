import  { iota, commas, arbCommas, txCommas } from './helpers';

const predicateFor = function(num: number): string {
    return `(${commas(num, v => `t${v}:T${v}`)}) => (boolean|void)`;
}
const signatureFor = function(num: number, opt?: boolean): string {
    return `
        function property<${txCommas(num)}>(
            ${commas(num, v => `arb${v}:Arbitrary<T${v}>`)},
            predicate: ${predicateFor(num)}
        ): Property<[${txCommas(num)}]>;`;
};
const finalSignatureFor = function(num: number, opt?: boolean): string {
    return `
        function property<${txCommas(num)}>(
            ${commas(num, v => `arb${v}?: Arbitrary<T${v}> | (${predicateFor(v)})`)},
            arb${num}?: ${predicateFor(num)}
        ) {`;
};
const ifFor = function(num: number): string {
    return `
        if (arb${num}) {
            const p = arb${num} as (${commas(num, v => `t${v}:T${v}`)}) => (boolean|void);
            return new Property(
                    tuple(${commas(num, v => `arb${v} as Arbitrary<T${v}>`)})
                    , t => p(${commas(num, v => `t[${v}]`)}));
        }`;
};

const generateProperty = function(num: number): string {
    const blocks = [
            // imports
            `import Arbitrary from '../arbitrary/definition/Arbitrary';`,
            `import { tuple } from '../arbitrary/TupleArbitrary';`,
            `import { Property } from './Property.generic';`,
            // declare all signatures
            ...iota(num).map(num => signatureFor(num +1)),
            // start declare function
            finalSignatureFor(num +1),
            // cascade ifs
            ...iota(num).reverse().map(num => ifFor(num +1)),
            // end declare function
            `}`,
            // export
            `export { property };`
    ];

    return blocks.join('\n');
};

export { generateProperty };
