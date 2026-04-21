import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import { Value } from '../../check/arbitrary/definition/Value.js';
import type { Random } from '../../random/generator/Random.js';
import { Stream } from '../../stream/Stream.js';
import { makeLazy } from '../../stream/LazyIterableIterator.js';
import {
  Error,
  safeAdd,
  safeCodePointAt,
  safeHas,
  safeJoin,
  safeMap,
  safeMapGet,
  safeMapHas,
  safeMapSet,
  safePush,
  safeSlice,
  safeSort,
  safeSplice,
  safeStringFromCodePoint,
  Map,
  Set,
} from '../../utils/globals.js';

/** @internal */
type OpKind = 'insert' | 'delete' | 'substitute' | 'transpose';

/** @internal */
interface EditOp {
  kind: OpKind;
  pos: number;
  /** Index into the cached alphabet (by code point). Ignored for delete/transpose. */
  charIdx: number;
}

/**
 * Shrink context attached to every {@link Value} produced by {@link StringFromCorpusArbitrary}.
 *
 * Not re-exported from the public factory module — consumers should never
 * observe this type directly.
 *
 * @internal
 */
export interface StringFromCorpusContext {
  corpusIdx: number;
  ops: readonly EditOp[];
}

/** @internal */
export interface StringFromCorpusInternalConstraints {
  minLength: number;
  maxGeneratedLength: number;
  maxEdits: number;
  includeOriginals: boolean;
  extraAlphabet: string;
}

/**
 * Default set of edit operations applied by {@link StringFromCorpusArbitrary}.
 * Held as a module-level default so it can be overridden on a per-instance
 * basis without repeated allocations; a future `opKinds?: OpKind[]` constraint
 * can plumb straight through to `this.opKinds` without touching callers.
 *
 * @internal
 */
const DEFAULT_OP_KINDS: readonly OpKind[] = ['insert', 'delete', 'substitute', 'transpose'];

/**
 * Convert a string into an array of its code points. Iterates via the string's
 * unicode-aware iterator and reads each code point with {@link safeCodePointAt}
 * so that poisoned globals cannot perturb the result.
 *
 * @internal
 */
function codePointsOf(s: string): number[] {
  const out: number[] = [];
  for (const ch of s) {
    const cp = safeCodePointAt(ch, 0);
    if (cp !== undefined) {
      safePush(out, cp);
    }
  }
  return out;
}

/**
 * Convert an array of code points back into a string. Strings are built one
 * code point at a time and then joined, avoiding unbounded spread into
 * `String.fromCodePoint(...cps)` which would risk hitting engine argument limits
 * on pathologically long inputs.
 *
 * @internal
 */
function stringify(cps: readonly number[]): string {
  const chars = safeMap(cps as number[], (cp) => safeStringFromCodePoint(cp));
  return safeJoin(chars, '');
}

/**
 * Build the mutation alphabet from corpus code points + extraAlphabet, sorted
 * by code-point value for determinism. Falls back to ASCII printable
 * (0x20..0x7e) when the effective alphabet would otherwise be empty.
 *
 * @internal
 */
function buildAlphabet(corpus: readonly string[], extraAlphabet: string): number[] {
  // Dedup via a Set<number>: O(1) membership and O(1) insertion make the overall
  // alphabet build O(U + A log A) (A = alphabet size, U = total code points
  // scanned) instead of the O(U * A) that a linear `indexOf` sweep would yield.
  const seenSet: Set<number> = new Set();
  const out: number[] = [];
  const addCp = (cp: number) => {
    if (!safeHas(seenSet, cp)) {
      safeAdd(seenSet, cp);
      safePush(out, cp);
    }
  };
  for (const s of corpus) {
    for (const ch of s) {
      const cp = safeCodePointAt(ch, 0);
      if (cp !== undefined) {
        addCp(cp);
      }
    }
  }
  for (const ch of extraAlphabet) {
    const cp = safeCodePointAt(ch, 0);
    if (cp !== undefined) {
      addCp(cp);
    }
  }
  if (out.length === 0) {
    // Fallback: ASCII printable range
    for (let cp = 0x20; cp <= 0x7e; cp++) {
      safePush(out, cp);
    }
  }
  return safeSort(out, (a, b) => a - b);
}

/**
 * Apply all ops sequentially, honouring length bounds at every step. The
 * base code-point array is copied ONCE on entry, then every op mutates the
 * same buffer in place via `splice` / index assignment / swap. This keeps the
 * allocation profile at O(1) buffers per generate/shrink step (versus one
 * fresh array per op in the earlier implementation).
 *
 * Ops that would violate `[minLength, maxLength]` silently become no-ops — the
 * rng has already consumed the op's draws by the time we get here, so we keep
 * the seed stream deterministic by simply skipping the mutation.
 *
 * @internal
 */
function applyOps(
  baseChars: readonly number[],
  ops: readonly EditOp[],
  alphabet: readonly number[],
  minLength: number,
  maxLength: number,
): string {
  const buf: number[] = safeSlice(baseChars as number[]);
  for (const op of ops) {
    const len = buf.length;
    switch (op.kind) {
      case 'insert': {
        if (len + 1 > maxLength) break; // clamp: cannot grow
        if (alphabet.length === 0) break;
        // Positions are drawn against the live length at generate time; when
        // the same op list is later applied to a shorter base (cross-shrink),
        // `pos` may exceed the current length. Clamp to len so `insert` stays
        // in range (append when out-of-bounds).
        const p = op.pos > len ? len : op.pos;
        safeSplice(buf, p, 0, alphabet[op.charIdx]);
        break;
      }
      case 'delete': {
        if (len === 0) break;
        if (len - 1 < minLength) break; // clamp: cannot shrink below min
        if (op.pos >= len) break; // guard: out-of-range pos after cross-shrink
        safeSplice(buf, op.pos, 1);
        break;
      }
      case 'substitute': {
        if (len === 0) break;
        if (alphabet.length === 0) break;
        if (op.pos >= len) break; // guard: out-of-range pos after cross-shrink
        buf[op.pos] = alphabet[op.charIdx];
        break;
      }
      case 'transpose': {
        if (len < 2) break;
        if (op.pos + 1 >= len) break; // guard: out-of-range pos after cross-shrink
        const p = op.pos;
        const tmp = buf[p];
        buf[p] = buf[p + 1];
        buf[p + 1] = tmp;
        break;
      }
    }
  }
  return stringify(buf);
}

function* shrinkByDroppingOps(
  baseChars: readonly number[],
  ops: readonly EditOp[],
  corpusIdx: number,
  alphabet: readonly number[],
  minLength: number,
  maxLength: number,
): IterableIterator<Value<string>> {
  // Drop from the tail: fewer ops = monotonically closer to raw corpus entry.
  for (let dropCount = 1; dropCount <= ops.length; dropCount++) {
    const fewerOps = safeSlice(ops as EditOp[], 0, ops.length - dropCount);
    const ctx: StringFromCorpusContext = { corpusIdx, ops: fewerOps };
    yield new Value(applyOps(baseChars, fewerOps, alphabet, minLength, maxLength), ctx);
  }
}

function* shrinkCorpusIdx(
  baseCpByIdx: readonly (readonly number[])[],
  ops: readonly EditOp[],
  corpusIdx: number,
  alphabet: readonly number[],
  minLength: number,
  maxLength: number,
): IterableIterator<Value<string>> {
  for (let idx = 0; idx < corpusIdx; idx++) {
    const ctx: StringFromCorpusContext = { corpusIdx: idx, ops };
    yield new Value(applyOps(baseCpByIdx[idx], ops, alphabet, minLength, maxLength), ctx);
  }
}

/** @internal */
export class StringFromCorpusArbitrary extends Arbitrary<string> {
  /** @internal Cached code-point arrays, one per corpus entry. */
  private readonly baseCpByIdx: readonly number[][];
  /**
   * @internal Alphabet as sorted code points.
   * Invariant: non-empty. The constructor guarantees this via the ASCII
   * printable fallback (0x20..0x7e) in {@link buildAlphabet}.
   */
  private readonly alphabet: readonly number[];
  private readonly minLength: number;
  private readonly maxGeneratedLength: number;
  private readonly maxEdits: number;
  private readonly includeOriginals: boolean;
  /**
   * @internal The edit op kinds this instance draws from. Held as an
   * instance field (rather than the module-level constant) so a future
   * `opKinds?` constraint becomes a purely additive change.
   */
  private readonly opKinds: readonly OpKind[];
  /** @internal Precomputed set of corpus entries for O(1) membership lookup. */
  private readonly corpusSet: Map<string, number>;

  constructor(
    private readonly corpus: readonly string[],
    cfg: StringFromCorpusInternalConstraints,
  ) {
    super();
    if (corpus.length === 0) {
      throw new Error('StringFromCorpusArbitrary: corpus must not be empty');
    }
    this.minLength = cfg.minLength;
    this.maxGeneratedLength = cfg.maxGeneratedLength;
    this.maxEdits = cfg.maxEdits;
    this.includeOriginals = cfg.includeOriginals;
    this.opKinds = DEFAULT_OP_KINDS;

    // Cache code-point arrays per entry so `[...str]` runs only once per entry.
    this.baseCpByIdx = safeMap(corpus as string[], (s) => codePointsOf(s));

    // Build alphabet with extraAlphabet merged in + ASCII fallback.
    this.alphabet = buildAlphabet(corpus, cfg.extraAlphabet);

    // Build corpus string->index map for canShrinkWithoutContext.
    this.corpusSet = new Map<string, number>();
    for (let i = 0; i < corpus.length; i++) {
      // First occurrence wins (lowest idx preferred so recovery picks the
      // earliest matching entry, which aligns with the cross-shrink direction).
      if (!safeMapHas(this.corpusSet, corpus[i])) {
        safeMapSet(this.corpusSet, corpus[i], i);
      }
    }
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<string> {
    // Bias path: with `includeOriginals` on and a bias factor set, 1-in-biasFactor
    // chance of emitting the raw corpus entry (zero edit operations).
    //
    // Note: the raw corpus entry may already violate the length clamp
    // (minLength/maxLength). We intentionally emit it as-is — the caller asked
    // for originals. Users who need strict bounds should pass
    // `includeOriginals: false`.
    if (this.includeOriginals && biasFactor !== undefined && mrng.nextInt(1, biasFactor) === 1) {
      const corpusIdx = mrng.nextInt(0, this.corpus.length - 1);
      const ctx: StringFromCorpusContext = { corpusIdx, ops: [] };
      return new Value(this.corpus[corpusIdx], ctx);
    }

    // 1. Pick corpus entry uniformly
    const corpusIdx = mrng.nextInt(0, this.corpus.length - 1);
    const baseChars = this.baseCpByIdx[corpusIdx];

    // 2. Draw number of ops: 0..maxEdits
    const numOps = this.maxEdits === 0 ? 0 : mrng.nextInt(0, this.maxEdits);

    // 3. Draw each op, using live length to pick an unbiased position.
    //    We simulate the length-change from each op so that `pos` is drawn
    //    uniformly within the live range at the moment of application.
    const ops: EditOp[] = [];
    let liveLen = baseChars.length;
    for (let i = 0; i < numOps; i++) {
      const op = this.drawOp(mrng, liveLen);
      safePush(ops, op);
      liveLen = this.projectLen(op.kind, liveLen);
    }

    // 4. Apply ops with clamp
    const result = applyOps(baseChars, ops, this.alphabet, this.minLength, this.maxGeneratedLength);

    const ctx: StringFromCorpusContext = { corpusIdx, ops };
    return new Value(result, ctx);
  }

  /**
   * Conservative `canShrinkWithoutContext`: returns `true` iff the value
   * exactly matches a corpus entry by string equality. When true, the runner
   * can reshrink from that corpus entry with an empty `ops` list, which is the
   * trivial base case.
   *
   * Anything fancier — recovering an arbitrary string by computing edit
   * distances against every corpus entry — is out of scope for this arbitrary.
   */
  canShrinkWithoutContext(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    return safeMapHas(this.corpusSet, value);
  }

  shrink(value: string, context: unknown): Stream<Value<string>> {
    let ctx: StringFromCorpusContext;
    if (context === undefined || context === null) {
      // Context-free path: only legal when canShrinkWithoutContext returned true.
      // Synthesise a context pointing at the matching corpus entry with no ops.
      const idx = safeMapGet(this.corpusSet, value);
      if (idx === undefined) return Stream.nil();
      ctx = { corpusIdx: idx, ops: [] };
    } else {
      ctx = context as StringFromCorpusContext;
    }

    const { corpusIdx, ops } = ctx;
    const baseChars = this.baseCpByIdx[corpusIdx];
    const alphabet = this.alphabet;
    const baseCpByIdx = this.baseCpByIdx;
    const minLength = this.minLength;
    const maxLength = this.maxGeneratedLength;

    const dropOpsStream = new Stream(
      makeLazy(() => shrinkByDroppingOps(baseChars, ops, corpusIdx, alphabet, minLength, maxLength)),
    );
    const crossShrinkStream = new Stream(
      makeLazy(() => shrinkCorpusIdx(baseCpByIdx, ops, corpusIdx, alphabet, minLength, maxLength)),
    );
    return dropOpsStream.join(crossShrinkStream);
  }

  /** @internal */
  private drawOp(mrng: Random, liveLen: number): EditOp {
    const kindIdx = mrng.nextInt(0, this.opKinds.length - 1);
    const kind = this.opKinds[kindIdx];
    // Unbiased position draw based on op kind + liveLen.
    let pos: number;
    switch (kind) {
      case 'insert':
        // insert allows [0..liveLen] inclusive (append)
        pos = liveLen === 0 ? 0 : mrng.nextInt(0, liveLen);
        break;
      case 'delete':
      case 'substitute':
        // both need liveLen >= 1; if liveLen === 0 we still draw something
        // consistent so the seed stream is deterministic (the op will become
        // a no-op when applied).
        pos = liveLen === 0 ? 0 : mrng.nextInt(0, liveLen - 1);
        break;
      case 'transpose':
        // needs liveLen >= 2; draw 0..liveLen-2 or 0 as a no-op.
        pos = liveLen < 2 ? 0 : mrng.nextInt(0, liveLen - 2);
        break;
    }
    // Invariant: alphabet is non-empty (ASCII fallback in the constructor).
    const charIdx = mrng.nextInt(0, this.alphabet.length - 1);
    return { kind, pos, charIdx };
  }

  /** @internal Project the length change of a single op, honouring clamps. */
  private projectLen(kind: OpKind, liveLen: number): number {
    switch (kind) {
      case 'insert':
        return liveLen + 1 > this.maxGeneratedLength ? liveLen : liveLen + 1;
      case 'delete':
        if (liveLen === 0) return 0;
        return liveLen - 1 < this.minLength ? liveLen : liveLen - 1;
      case 'substitute':
      case 'transpose':
        return liveLen;
    }
  }
}
