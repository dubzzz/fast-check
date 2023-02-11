/**
 * Try to extract maxInitialIterations non-skipped values
 * with a maximal number of remainingSkips skipped values
 * from initialValues source
 * @internal
 */
export class SourceValuesIterator<Ts> implements IterableIterator<Ts> {
  constructor(
    readonly initialValues: IterableIterator<Ts>,
    private maxInitialIterations: number,
    private remainingSkips: number
  ) {}
  [Symbol.iterator](): IterableIterator<Ts> {
    return this;
  }
  next(): IteratorResult<Ts> {
    if (--this.maxInitialIterations !== -1 && this.remainingSkips >= 0) {
      const n = this.initialValues.next();
      if (!n.done) return { value: n.value, done: false };
    }
    return { value: undefined, done: true };
  }
  skippedOne(): void {
    --this.remainingSkips;
    ++this.maxInitialIterations;
  }
}
