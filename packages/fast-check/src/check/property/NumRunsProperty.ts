import type { Random } from '../../random/generator/Random.js';
import type { Stream } from '../../stream/Stream.js';
import type { Value } from '../arbitrary/definition/Value.js';
import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { PropertyFailure, IRawProperty } from './IRawProperty.js';

/** @internal */
export class NumRunsProperty<Ts, IsAsync extends boolean> implements IRawProperty<Ts, IsAsync> {
  private remainingRuns: number;
  private inShrinking: boolean;

  constructor(
    readonly property: IRawProperty<Ts, IsAsync>,
    numRuns: number,
  ) {
    this.remainingRuns = numRuns;
    this.inShrinking = false;
  }

  isAsync(): IsAsync {
    return this.property.isAsync();
  }

  generate(mrng: Random, runId?: number): Value<Ts> {
    return this.property.generate(mrng, runId);
  }

  shrink(value: Value<Ts>): Stream<Value<Ts>> {
    return this.property.shrink(value);
  }

  run(v: Ts): ReturnType<IRawProperty<Ts, IsAsync>['run']> {
    if (!this.inShrinking && this.remainingRuns <= 0) {
      const preconditionFailure = new PreconditionFailure(true);
      if (this.isAsync()) {
        return Promise.resolve(preconditionFailure) as any;
      } else {
        return preconditionFailure as any;
      }
    }
    const result = this.property.run(v);
    if (this.isAsync()) {
      return Promise.resolve(result as Promise<PreconditionFailure | PropertyFailure | null>).then((resolved) => {
        this.accountFor(resolved);
        return resolved;
      }) as any;
    }
    this.accountFor(result);
    return result;
  }

  private accountFor(result: PreconditionFailure | PropertyFailure | null): void {
    if (this.inShrinking) {
      return;
    }
    if (result === null) {
      --this.remainingRuns;
    } else if (PreconditionFailure.isFailure(result)) {
      // skip — do not consume the budget
    } else {
      this.inShrinking = true;
    }
  }

  runBeforeEach(): ReturnType<IRawProperty<Ts, IsAsync>['runBeforeEach']> {
    return this.property.runBeforeEach();
  }

  runAfterEach(): ReturnType<IRawProperty<Ts, IsAsync>['runAfterEach']> {
    return this.property.runAfterEach();
  }
}
