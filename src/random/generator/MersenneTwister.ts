import { RandomGenerator } from './RandomGenerator'

export default class MersenneTwister implements RandomGenerator {
    static readonly min: number = -(2**31);
    static readonly max: number = 2**31 -1;

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

    private static twist(prev: number[]): number[] {
        const mt = prev.slice();
        for (let idx = 0 ; idx !== MersenneTwister.N ; ++idx) {
            const x = (mt[idx] & MersenneTwister.MASK_UPPER) + (mt[(idx + 1) % MersenneTwister.N] & MersenneTwister.MASK_LOWER);
            let xA = x >> 1;
            if ((x & 1) == 1) {
              xA ^= MersenneTwister.A;
            }
            mt[idx] = mt[(idx+MersenneTwister.M) % MersenneTwister.N] ^ xA
        }
        return mt;
    }
    
    private static seeded(seed: number): number[] {
        const out = [];
        for (let idx = 0, prev = seed ; idx !== MersenneTwister.N ; ++idx, prev = MersenneTwister.F * (prev ^ (prev >> 30)) + idx) {
            out.push(prev);
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
        y ^= (this.states[this.index] >> MersenneTwister.U);
        y ^= (y << MersenneTwister.S) & MersenneTwister.B;
        y ^= (y << MersenneTwister.T) & MersenneTwister.C;
        y ^= (y >> MersenneTwister.L);
        return [y, new MersenneTwister(this.states, this.index +1)];
    }
}
