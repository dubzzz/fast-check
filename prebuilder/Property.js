const fs = require('fs');

function iota(id) {
    let v = 0;
    return [...Array(id)].map(() => ++v);
}

function signatureFor(id) {
    return `
    function property<${iota(id).map(i => `T${i}`).join(',')}>(
        ${iota(id).map(i => `arb${i}:Arbitrary<T${i}>`).join(',')}
        predicate: (${iota(id).map(i => `t${i}:T${i}`).join(',')}) => (boolean|undefined)
    ): Property<[${iota(id).map(i => `T${i}`).join(',')}]>;`;
}

function implementationIfFor(id) {
    return `
    if (arb${id}) {
        const p = arb${id} as (${iota(id).map(i => `t${i}:T${i}`).join(',')}) => (boolean|undefined);
        return new Property(tuple(
            ${iota(id).map(i => `arb${i} as Arbitrary<T${i}>`).join(',')}
        ), t => p(t[0],t[1],t[2],t[3],t[4],t[5],t[6],t[7]));
    }`;
}

function implementationFor(id) {
    return iota(id).map(i => signatureFor(i)).join('\n');
}

fs.writeFile('../src/check/property/Property.impl.ts', implementationFor(4), function(err) {});
