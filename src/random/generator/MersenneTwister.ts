import { RandomGenerator } from './RandomGenerator'

function toUint32(num: number): number {
    return (num | 0) >= 0 ? (num | 0) : (num | 0) + 4294967296;
}
function toInt32(num: number): number {
    return num | 0;
}
function productInUint32(a: number, b: number) {
    const a32 = toUint32(a);
    const alo = a32 & 0xffff;
    const ahi = (a32 >> 16) & 0xffff;
    const b32 = toUint32(b);
    const blo = b32 & 0xffff;
    const bhi = (b32 >> 16) & 0xffff;
    return toUint32(alo*blo + (alo*bhi + ahi*blo) * 0x10000);
}
function rshiftInUint32(a: number, shift: number) {
    return a < 0x80000000
        ? a >> shift
        : ((a - 0x80000000) >> shift) + (1 << (31 - shift));
}

export default class MersenneTwister implements RandomGenerator {
    static readonly min: number = 0;
    static readonly max: number = 0xffffffff;

    static readonly N = 624;
    static readonly M = 397;
    static readonly R = 31;
    static readonly A = 0x9908B0DF;
    static readonly F = 1812433253;
    static readonly U = 11;
    static readonly S = 7;
    static readonly B = 0x9D2C5680;
    static readonly T = 15;
    static readonly C = 0xEFC60000;
    static readonly L = 18;
    static readonly MASK_LOWER = (2** MersenneTwister.R) - 1;
    static readonly MASK_UPPER = (2** MersenneTwister.R);

    private static twist(prev: number[]): number[] {//OK
        const mt = prev.slice();
        for (let idx = 0 ; idx !== MersenneTwister.N ; ++idx) {
            const x = toUint32(
                    toUint32(mt[idx] & MersenneTwister.MASK_UPPER) +
                    toUint32(mt[(idx + 1) % MersenneTwister.N] & MersenneTwister.MASK_LOWER));
            let xA = rshiftInUint32(x, 1);
            if (x & 1) {
              xA = toUint32(xA ^ MersenneTwister.A);
            }
            mt[idx] = toUint32(mt[(idx+MersenneTwister.M) % MersenneTwister.N] ^ xA);
        }
        return mt;
    }
    
    private static seeded(seed: number): number[] {//OK
        const out = [...Array(MersenneTwister.N)].map(() => 0);
        out[0] = seed;
        for (let idx = 1 ; idx !== MersenneTwister.N ; ++idx) {
            if (toInt32(out[idx - 1]) < 0) { //simulate unsigned computation
                const rescaled = toInt32(out[idx - 1]) + 0x80000000;
                const xored = (rescaled ^ ((rescaled >> 30) + 2)) + 0x80000000;
                out[idx] = toUint32(productInUint32(MersenneTwister.F, xored) + idx);
            }
            else {
                const xored = (out[idx - 1] ^ (out[idx - 1] >> 30));
                out[idx] = toUint32(productInUint32(MersenneTwister.F, xored) + idx);
            }
        }
        return out;
    }

    readonly index: number;
    readonly states: number[];

    private constructor(states: number[], index: number) {
        if (index >= MersenneTwister.N) {
            this.states = MersenneTwister.twist(states);
            this.index = 0;
        }
        else {
            this.states = states;
            this.index = index;
        }
    }
    
    static from(seed: number): MersenneTwister {
        return new MersenneTwister(MersenneTwister.seeded(seed), MersenneTwister.N);
    }
    
    min(): number {
        return MersenneTwister.min;
    }
    
    max(): number {
        return MersenneTwister.max;
    }

    next(): [number, RandomGenerator] {
        let y = this.states[this.index]
        y = toUint32(y ^ rshiftInUint32(this.states[this.index], MersenneTwister.U));
        y = toUint32(y ^ ((y << MersenneTwister.S) & MersenneTwister.B));
        y = toUint32(y ^ ((y << MersenneTwister.T) & MersenneTwister.C));
        y = toUint32(y ^ rshiftInUint32(y, MersenneTwister.L));
        return [y, new MersenneTwister(this.states, this.index +1)];
    }
}
