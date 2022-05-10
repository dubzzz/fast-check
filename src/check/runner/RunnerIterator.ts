import { Value } from '../arbitrary/definition/Value';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import { PropertyFailure } from '../property/IRawProperty';
import { VerbosityLevel } from './configuration/VerbosityLevel';
import { RunExecution } from './reporter/RunExecution';
import { SourceValuesIterator } from './SourceValuesIterator';

/**
 * Responsible for the iteration logic
 *
 * Workflow:
 * 1- Call to `next` gives back the value to test
 * 2- Call to `handleResult` takes into account the execution status
 * 3- Back to 1
 *
 * @internal
 */
export class RunnerIterator<Ts> implements IterableIterator<Ts> {
  runExecution: RunExecution<Ts>;
  private currentIdx: number;
  private currentValue: Value<Ts> | undefined;
  private nextValues: IterableIterator<Value<Ts>>;
  constructor(
    readonly sourceValues: SourceValuesIterator<Value<Ts>>,
    readonly shrink: (value: Value<Ts>) => IterableIterator<Value<Ts>>,
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
  next(): IteratorResult<Ts> {
    const nextValue = this.nextValues.next();
    if (nextValue.done || this.runExecution.interrupted) {
      return { done: true, value: undefined };
    }
    this.currentValue = nextValue.value;
    ++this.currentIdx;
    return { done: false, value: nextValue.value.value_ };
  }
  handleResult(result: PreconditionFailure | PropertyFailure | null): void {
    // WARNING: This function has to be called after a call to next
    //          Otherwise it will not be able to execute with the right currentShrinkable (or crash)
    // As a consequence: currentShrinkable is always defined in the code below
    if (result != null && typeof result === 'object' && !PreconditionFailure.isFailure(result)) {
      // failed run
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.runExecution.fail(this.currentValue!.value_, this.currentIdx, result.errorMessage);
      this.currentIdx = -1;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.nextValues = this.shrink(this.currentValue!);
    } else if (result != null) {
      if (!result.interruptExecution) {
        // skipped run
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.runExecution.skip(this.currentValue!.value_);
        this.sourceValues.skippedOne();
      } else {
        // interrupt signal
        this.runExecution.interrupt();
      }
    } else {
      // successful run
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.runExecution.success(this.currentValue!.value_);
    }
  }
}
