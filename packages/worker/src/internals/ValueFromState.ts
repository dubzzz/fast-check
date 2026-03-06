import { xorshift128plus } from 'pure-rand/generator/XorShift';
import { Random } from 'fast-check';
import type { IRawProperty } from 'fast-check';

/**
 * Definition of the Value
 */
export type ValueState = { rngState: number[]; runId: number | undefined };

/**
 * Build the appropriate Value based on the provided state
 * @param state - The state defining the Value to be generated (the how)
 */
export function generateValueFromState<Ts>(property: IRawProperty<Ts>, state: ValueState): Ts {
  const mrng = new Random(xorshift128plus.fromState(state.rngState));
  return property.generate(mrng, state.runId).value_;
}
