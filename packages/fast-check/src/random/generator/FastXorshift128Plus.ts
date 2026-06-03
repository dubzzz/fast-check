import type { JumpableRandomGenerator } from 'pure-rand/types/JumpableRandomGenerator';

/**
 * Drop-in faster replacement for pure-rand's `xorshift128plus` generator.
 *
 * Produces the *exact same* sequence of values as `xorshift128plus` (same `next()`
 * implementation, same `jump()` end state for a given input state), but runs `jump()`
 * via a precomputed "four-Russians" 8-bit lookup table instead of Horner-style
 * iteration over 128 successor states.
 *
 * `jump()` is hot in the fast-check runner — it is called once per iteration of
 * a property. With pure-rand's Horner-style jump it dominates the total runtime
 * of trivial properties (`~50%+` of CPU for `assert(property(constant(1), ...))`).
 * This implementation lowers the cost ~20x: 16 table lookups + 16 four-word XOR
 * batches instead of 128 calls to `next()`.
 *
 * The state shape (`s01`, `s00`, `s11`, `s10`) and `getState` layout match
 * pure-rand's, so jump matrices/state arrays remain interchangeable.
 *
 * @internal
 */
export class FastXorshift128Plus implements JumpableRandomGenerator {
  s01: number;
  s00: number;
  s11: number;
  s10: number;

  constructor(s01: number, s00: number, s11: number, s10: number) {
    this.s01 = s01;
    this.s00 = s00;
    this.s11 = s11;
    this.s10 = s10;
  }

  next(): number {
    // Mirrors pure-rand xorshift128+ exactly so the value stream is identical.
    const a0 = this.s00 ^ (this.s00 << 23);
    const a1 = this.s01 ^ ((this.s01 << 23) | (this.s00 >>> 9));
    const b0 = a0 ^ this.s10 ^ ((a0 >>> 18) | (a1 << 14)) ^ ((this.s10 >>> 5) | (this.s11 << 27));
    const b1 = a1 ^ this.s11 ^ (a1 >>> 18) ^ (this.s11 >>> 5);
    const out = (this.s00 + this.s10) | 0;
    this.s01 = this.s11;
    this.s00 = this.s10;
    this.s11 = b1;
    this.s10 = b0;
    return out;
  }

  jump(): void {
    // The jump operation `s ← J·s` is linear over GF(2). We split the 128-bit
    // state into 16 bytes; for each byte we look up the precomputed 128-bit
    // contribution (stored as 4 ints) and XOR it into the running result.
    //
    // Per chunk c, byte val v, the table offset is `(c * 256 + v) * 4`. Because
    // the chunk-base constants below are pre-shifted by 2 (i.e. `c * 256 * 4 =
    // c * 1024`), we just OR in `v << 2` (= v * 4) — bits of v sit in 2..9 so
    // they don't overlap with the upper bits of the chunk base.
    //
    // Inner loop: 16 lookups × (1 shift + 1 AND + 4 array reads + 4 XORs) ≈ 160 cheap ops,
    // vs ~1500 ops for the Horner method. Empirically ~20x faster on V8.
    const t = JUMP_TABLE;
    let r0 = 0;
    let r1 = 0;
    let r2 = 0;
    let r3 = 0;
    let w = this.s01;
    let o = (w & 0xff) << 2;
    r0 ^= t[o];
    r1 ^= t[o + 1];
    r2 ^= t[o + 2];
    r3 ^= t[o + 3];
    o = 1024 | (((w >>> 8) & 0xff) << 2);
    r0 ^= t[o];
    r1 ^= t[o + 1];
    r2 ^= t[o + 2];
    r3 ^= t[o + 3];
    o = 2048 | (((w >>> 16) & 0xff) << 2);
    r0 ^= t[o];
    r1 ^= t[o + 1];
    r2 ^= t[o + 2];
    r3 ^= t[o + 3];
    o = 3072 | (((w >>> 24) & 0xff) << 2);
    r0 ^= t[o];
    r1 ^= t[o + 1];
    r2 ^= t[o + 2];
    r3 ^= t[o + 3];
    w = this.s00;
    o = 4096 | ((w & 0xff) << 2);
    r0 ^= t[o];
    r1 ^= t[o + 1];
    r2 ^= t[o + 2];
    r3 ^= t[o + 3];
    o = 5120 | (((w >>> 8) & 0xff) << 2);
    r0 ^= t[o];
    r1 ^= t[o + 1];
    r2 ^= t[o + 2];
    r3 ^= t[o + 3];
    o = 6144 | (((w >>> 16) & 0xff) << 2);
    r0 ^= t[o];
    r1 ^= t[o + 1];
    r2 ^= t[o + 2];
    r3 ^= t[o + 3];
    o = 7168 | (((w >>> 24) & 0xff) << 2);
    r0 ^= t[o];
    r1 ^= t[o + 1];
    r2 ^= t[o + 2];
    r3 ^= t[o + 3];
    w = this.s11;
    o = 8192 | ((w & 0xff) << 2);
    r0 ^= t[o];
    r1 ^= t[o + 1];
    r2 ^= t[o + 2];
    r3 ^= t[o + 3];
    o = 9216 | (((w >>> 8) & 0xff) << 2);
    r0 ^= t[o];
    r1 ^= t[o + 1];
    r2 ^= t[o + 2];
    r3 ^= t[o + 3];
    o = 10240 | (((w >>> 16) & 0xff) << 2);
    r0 ^= t[o];
    r1 ^= t[o + 1];
    r2 ^= t[o + 2];
    r3 ^= t[o + 3];
    o = 11264 | (((w >>> 24) & 0xff) << 2);
    r0 ^= t[o];
    r1 ^= t[o + 1];
    r2 ^= t[o + 2];
    r3 ^= t[o + 3];
    w = this.s10;
    o = 12288 | ((w & 0xff) << 2);
    r0 ^= t[o];
    r1 ^= t[o + 1];
    r2 ^= t[o + 2];
    r3 ^= t[o + 3];
    o = 13312 | (((w >>> 8) & 0xff) << 2);
    r0 ^= t[o];
    r1 ^= t[o + 1];
    r2 ^= t[o + 2];
    r3 ^= t[o + 3];
    o = 14336 | (((w >>> 16) & 0xff) << 2);
    r0 ^= t[o];
    r1 ^= t[o + 1];
    r2 ^= t[o + 2];
    r3 ^= t[o + 3];
    o = 15360 | (((w >>> 24) & 0xff) << 2);
    r0 ^= t[o];
    r1 ^= t[o + 1];
    r2 ^= t[o + 2];
    r3 ^= t[o + 3];
    this.s01 = r0;
    this.s00 = r1;
    this.s11 = r2;
    this.s10 = r3;
  }

  clone(): FastXorshift128Plus {
    return new FastXorshift128Plus(this.s01, this.s00, this.s11, this.s10);
  }

  getState(): readonly number[] {
    return [this.s01, this.s00, this.s11, this.s10];
  }

  /**
   * Copy this rng's state into `dst` without allocating. Used by the runner's
   * hot loop in place of `dst = src.clone()` so each iteration spends no time
   * (and no GC pressure) on a fresh 4-int instance.
   * @internal
   */
  unsafeCopyStateTo(dst: FastXorshift128Plus): void {
    dst.s01 = this.s01;
    dst.s00 = this.s00;
    dst.s11 = this.s11;
    dst.s10 = this.s10;
  }
}

/**
 * Build the 4-Russians lookup table: 16 byte-chunks × 256 byte-values × 4 ints.
 *
 * Each entry `t[(chunk * 256 + byteValue) * 4 + j]` (j ∈ 0..3) holds the
 * contribution of that byte position in the state to output word `j` of the
 * post-jump state, computed as the XOR of the corresponding jump-matrix rows.
 *
 * Building the table runs once at module load: 16 × 256 × 8 ≈ 32k cheap XORs.
 *
 * The per-row jump matrix `J` (basis-vector responses) is itself built by
 * running pure-rand's Horner-style jump 128 times on unit-vector states.
 */
function buildJumpTable(): Int32Array {
  // Step 1: build J — 128 rows × 4 ints — by running slow Horner jump on unit vectors.
  const row = new Int32Array(128 * 4);
  for (let bitPos = 0; bitPos !== 128; ++bitPos) {
    const field = bitPos >> 5;
    const bit = bitPos & 31;
    const s01 = field === 0 ? 1 << bit : 0;
    const s00 = field === 1 ? 1 << bit : 0;
    const s11 = field === 2 ? 1 << bit : 0;
    const s10 = field === 3 ? 1 << bit : 0;
    const rng = new FastXorshift128Plus(s01, s00, s11, s10);
    slowJump(rng);
    const off = bitPos * 4;
    row[off] = rng.s01;
    row[off + 1] = rng.s00;
    row[off + 2] = rng.s11;
    row[off + 3] = rng.s10;
  }
  // Step 2: collapse 8 consecutive rows into 256 byte-value entries per chunk.
  const table = new Int32Array(16 * 256 * 4);
  for (let chunk = 0; chunk !== 16; ++chunk) {
    const rowBase = chunk * 8 * 4;
    const tblBase = chunk * 256 * 4;
    for (let val = 0; val !== 256; ++val) {
      let r0 = 0;
      let r1 = 0;
      let r2 = 0;
      let r3 = 0;
      for (let b = 0; b !== 8; ++b) {
        if (val & (1 << b)) {
          const ro = rowBase + b * 4;
          r0 ^= row[ro];
          r1 ^= row[ro + 1];
          r2 ^= row[ro + 2];
          r3 ^= row[ro + 3];
        }
      }
      const off = tblBase + val * 4;
      table[off] = r0;
      table[off + 1] = r1;
      table[off + 2] = r2;
      table[off + 3] = r3;
    }
  }
  return table;
}

/**
 * Reference Horner-style jump from pure-rand, used only at module init.
 * Kept verbatim so any divergence vs. pure-rand would be visible during build.
 */
function slowJump(rng: FastXorshift128Plus): void {
  let ns01 = 0;
  let ns00 = 0;
  let ns11 = 0;
  let ns10 = 0;
  const jump = [1667051007, 2321340297, 1548169110, 304075285];
  for (let i = 0; i !== 4; ++i) {
    for (let mask = 1; mask; mask <<= 1) {
      if (jump[i] & mask) {
        ns01 ^= rng.s01;
        ns00 ^= rng.s00;
        ns11 ^= rng.s11;
        ns10 ^= rng.s10;
      }
      rng.next();
    }
  }
  rng.s01 = ns01;
  rng.s00 = ns00;
  rng.s11 = ns11;
  rng.s10 = ns10;
}

const JUMP_TABLE: Int32Array = buildJumpTable();

/**
 * Seed constructor matching pure-rand's `xorshift128plus(seed)`.
 * @internal
 */
export function fastXorshift128plus(seed: number): FastXorshift128Plus {
  return new FastXorshift128Plus(-1, ~seed, seed | 0, 0);
}
