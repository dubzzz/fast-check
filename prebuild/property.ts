import  { iota, commas, arbCommas, txCommas } from './helpers';

const predicateFor = function(num: number, isAsync: boolean): string {
    return isAsync
            ? `(${commas(num, v => `t${v}:T${v}`)}) => Promise<boolean|void>`
            : `(${commas(num, v => `t${v}:T${v}`)}) => (boolean|void)`;
}
const signatureFor = function(num: number, isAsync: boolean): string {
    const functionName = isAsync ? 'asyncProperty' : 'property';
    const className = isAsync ? 'AsyncProperty' : 'Property';
    return `
        function ${functionName}<${txCommas(num)}>(
            ${commas(num, v => `arb${v}:Arbitrary<T${v}>`)},
            predicate: ${predicateFor(num, isAsync)}
        ): ${className}<[${txCommas(num)}]>;`;
};
const finalSignatureFor = function(num: number, isAsync: boolean): string {
    const functionName = isAsync ? 'asyncProperty' : 'property';
    return `
        function ${functionName}<${txCommas(num)}>(
            ${commas(num, v => `arb${v}?: Arbitrary<T${v}> | (${predicateFor(v, isAsync)})`)},
            arb${num}?: ${predicateFor(num, isAsync)}
        ) {`;
};
const ifFor = function(num: number, isAsync: boolean): string {
    const className = isAsync ? 'AsyncProperty' : 'Property';
    return `
        if (arb${num}) {
            const p = arb${num} as ${predicateFor(num, isAsync)};
            return new ${className}(
                    tuple(${commas(num, v => `arb${v} as Arbitrary<T${v}>`)})
                    , t => p(${commas(num, v => `t[${v}]`)}));
        }`;
};

const generateProperty = function(num: number, isAsync: boolean): string {
    const functionName = isAsync ? 'asyncProperty' : 'property';
    const className = isAsync ? 'AsyncProperty' : 'Property';
    const blocks = [
            // imports
            `import Arbitrary from '../arbitrary/definition/Arbitrary';`,
            `import { tuple } from '../arbitrary/TupleArbitrary';`,
            `import { ${className} } from './${className}.generic';`,
            // declare all signatures
            ...iota(num).map(num => signatureFor(num +1, isAsync)),
            // start declare function
            finalSignatureFor(num +1, isAsync),
            // cascade ifs
            ...iota(num).reverse().map(num => ifFor(num +1, isAsync)),
            // end declare function
            `}`,
            // export
            `export { ${functionName} };`
    ];

    return blocks.join('\n');
};

export { generateProperty };
