import { vi } from 'vitest';
import type { MockInstance } from 'vitest';
import type { Property } from '../../../../../src/check/property/types/Property.js';
import { Stream } from '../../../../../src/stream/Stream.js';
import { Value } from '../../../../../src/check/arbitrary/definition/Value.js';

/**
 * Generate a fake instance inheriting from IProperty with all methods being mocked
 */
export function fakeProperty<T = unknown>(): { instance: Property<T> } & {
  [K in keyof Property<T>]: MockInstance<Property<T>[K]>;
} {
  const generate = vi.fn<Property<T>['generate']>(() => new Value(Symbol() as unknown as T, undefined));
  const shrink = vi.fn<Property<T>['shrink']>(() => Stream.nil());
  const runBeforeEach = vi.fn<Property<T>['runBeforeEach']>(() => undefined);
  const runAfterEach = vi.fn<Property<T>['runAfterEach']>(() => undefined);
  const run = vi.fn<Property<T>['run']>(() => null);
  class MyProperty implements Property<unknown> {
    generate = generate;
    shrink = shrink;
    run = run;
    runBeforeEach = runBeforeEach;
    runAfterEach = runAfterEach;
  }
  return { instance: new MyProperty(), generate, shrink, run, runBeforeEach, runAfterEach };
}
