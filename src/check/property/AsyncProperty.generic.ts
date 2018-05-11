import Random from '../../random/generator/Random';
import Arbitrary from '../arbitrary/definition/Arbitrary';
import Shrinkable from '../arbitrary/definition/Shrinkable';
import { IProperty, runIdToFrequency } from './IProperty';

/**
 * Asynchronous property, see {@link IProperty}
 *
 * Prefer using {@link asyncProperty} instead
 */
export class AsyncProperty<Ts> implements IProperty<Ts> {
  constructor(readonly arb: Arbitrary<Ts>, readonly predicate: (t: Ts) => Promise<boolean | void>) {}
  isAsync = () => true;
  generate(mrng: Random, runId?: number): Shrinkable<Ts> {
    return runId != null ? this.arb.withBias(runIdToFrequency(runId)).generate(mrng) : this.arb.generate(mrng);
  }
  async run(v: Ts): Promise<string | null> {
    try {
      const output = await this.predicate(v);
      return output == null || output === true ? null : 'Property failed by returning false';
    } catch (err) {
      if (err instanceof Error && err.stack) return `${err}\n\nStack trace: ${err.stack}`;
      return `${err}`;
    }
  }
}
