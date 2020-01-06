import { Shrinkable } from '../arbitrary/definition/Shrinkable';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import { VerbosityLevel } from './configuration/VerbosityLevel';
import { RunExecution } from './reporter/RunExecution';
import { SourceValuesIterator } from './SourceValuesIterator';

/**
 * @internal
 * Responsible for the iteration logic
 *
 * Workflow:
 * 1- Call to `next` gives back the value to test
 * 2- Call to `handleResult` takes into account the execution status
 * 3- Back to 1
 */
export class RunnerIterator<Ts> implements IterableIterator<Ts> {
  runExecution: RunExecution<Ts>;
  private currentIdx: number;
  private currentShrinkable: Shrinkable<Ts> | undefined;
  private nextValues: IterableIterator<Shrinkable<Ts>>;
  constructor(
    readonly sourceValues: SourceValuesIterator<Shrinkable<Ts>>,
    verbose: VerbosityLevel,
    interruptedAsFailure: boolean
  ) {
    this.runExecution = new RunExecution<Ts>(verbose, interruptedAsFailure);
    this.currentIdx = -1;
    this.nextValues = sourceValues;
  }
  [Symbol.iterator](): IterableIterator<Ts> {
    return this;
  }
  next(value?: any): IteratorResult<Ts> {
    const nextValue = this.nextValues.next();
    if (nextValue.done || this.runExecution.interrupted) {
      return { done: true, value };
    }
    this.currentShrinkable = nextValue.value;
    ++this.currentIdx;
    return { done: false, value: nextValue.value.value_ };
  }
  handleResult(result: PreconditionFailure | string | null) {
    // WARNING: This function has to be called after a call to next
    //          Otherwise it will not be able to execute with the right currentShrinkable (or crash)
    if (result != null && typeof result === 'string') {
      // failed run
      this.runExecution.fail(this.currentShrinkable!.value_, this.currentIdx, result);
      this.currentIdx = -1;
      this.nextValues = this.currentShrinkable!.shrink();
    } else if (result != null) {
      if (!result.interruptExecution) {
        // skipped run
        this.runExecution.skip(this.currentShrinkable!.value_);
        this.sourceValues.skippedOne();
      } else {
        // interrupt signal
        this.runExecution.interrupt();
      }
    } else {
      // successful run
      this.runExecution.success(this.currentShrinkable!.value_);
    }
  }
}
