export default interface RandomGenerator {
    next(): [number, RandomGenerator]
}// values are between -2**31 and 2**31-1

function generate_n(rng: RandomGenerator, num: number): [number[], RandomGenerator] {
    let cur: RandomGenerator = rng;
    const out: number[] = [];
    for (let idx = 0 ; idx != num ; ++idx) {
        const [value, next] = cur.next();
        out.push(value);
        cur = next;
    }
    return [out, cur];
}

function skip_n(rng: RandomGenerator, num: number): RandomGenerator {
    return generate_n(rng, num)[1];
}

export { RandomGenerator, generate_n, skip_n };
