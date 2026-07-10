/**
 * Try to extract maxInitialIterations non-skipped values
 * with a maximal number of remainingSkips skipped values
 * from initialValues source
 * @internal
 */
export class SourceValuesIterator<Ts> implements IterableIterator<Ts> {
  declare readonly initialValues: IterableIterator<Ts>;
  declare private maxInitialIterations: number;
  declare private remainingSkips: number;
  constructor(initialValues: IterableIterator<Ts>, maxInitialIterations: number, remainingSkips: number) {
    this.initialValues = initialValues;
    this.maxInitialIterations = maxInitialIterations;
    this.remainingSkips = remainingSkips;
  }
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
