import { SENTINEL_DONE, type PullableIterator } from './Tosser.js';

const DONE_RESULT: IteratorResult<never> = { value: undefined, done: true };

/**
 * Try to extract maxInitialIterations non-skipped values
 * with a maximal number of remainingSkips skipped values
 * from initialValues source
 * @internal
 */
export class SourceValuesIterator<Ts> implements PullableIterator<Ts> {
  // If the underlying iterator exposes the fast `pullNext` puller (it does for
  // {@link TossIterator}), we cache the typed reference so the hot path can
  // skip both the per-call `typeof` check and the IteratorResult allocation
  // that `.next()` would force. Determined once at construction. We do not
  // call `.bind` because Poisoning-resistance tests assume we never rely on
  // Function.prototype.bind being intact.
  private readonly innerPullable: PullableIterator<Ts> | null;
  constructor(
    readonly initialValues: IterableIterator<Ts>,
    private maxInitialIterations: number,
    private remainingSkips: number,
  ) {
    const candidate = (initialValues as PullableIterator<Ts>).pullNext;
    this.innerPullable = typeof candidate === 'function' ? (initialValues as PullableIterator<Ts>) : null;
  }
  [Symbol.iterator](): IterableIterator<Ts> {
    return this;
  }
  next(): IteratorResult<Ts> {
    const v = this.pullNext();
    if (v === SENTINEL_DONE) return DONE_RESULT;
    return { value: v, done: false };
  }
  /**
   * Hot-path: returns the next value directly, or {@link SENTINEL_DONE} when
   * the iterator is exhausted. Avoids per-call IteratorResult allocations on
   * the runner's tight loop.
   * @internal
   */
  pullNext(): Ts | typeof SENTINEL_DONE {
    if (--this.maxInitialIterations !== -1 && this.remainingSkips >= 0) {
      const inner = this.innerPullable;
      if (inner !== null) {
        const v = inner.pullNext();
        if (v !== SENTINEL_DONE) return v;
      } else {
        const n = this.initialValues.next();
        if (!n.done) return n.value;
      }
    }
    return SENTINEL_DONE;
  }
  skippedOne(): void {
    --this.remainingSkips;
    ++this.maxInitialIterations;
  }
}
