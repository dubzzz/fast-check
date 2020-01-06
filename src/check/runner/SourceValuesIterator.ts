/**
 * @internal
 * Try to extract maxInitialIterations non-skipped values
 * with a maximal number of remainingSkips skipped values
 * from initialValues source
 */
export class SourceValuesIterator<Ts> implements IterableIterator<Ts> {
  constructor(
    readonly initialValues: IterableIterator<() => Ts>,
    private maxInitialIterations: number,
    private remainingSkips: number
  ) {}
  [Symbol.iterator](): IterableIterator<Ts> {
    return this;
  }
  next(value?: any): IteratorResult<Ts> {
    if (--this.maxInitialIterations !== -1 && this.remainingSkips >= 0) {
      const n = this.initialValues.next();
      if (!n.done) return { value: n.value(), done: false };
    }
    return { value, done: true };
  }
  skippedOne() {
    --this.remainingSkips;
    ++this.maxInitialIterations;
  }
}
