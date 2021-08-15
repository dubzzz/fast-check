import { hash } from '../../../../src/utils/hash';
import { stringify } from '../../../../src/utils/stringify';

export function assertToStringIsSameFunction<T extends any[] | [any], TOut>(
  f: (...args: T) => TOut,
  inputs: T[]
): void {
  let assertionHasBeenExecuted = false;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (function (hash, stringify) {
    assertionHasBeenExecuted = true;
    try {
      // As the output of toString might be different if the function has been called
      // before or after toString, we assess both cases
      const dataFromToStringBefore = eval(`(function() { const f = ${f}; return inputs.map((ins) => f(...ins)); })()`);
      const data = inputs.map((ins) => f(...ins));
      const dataFromToString = eval(`(function() { const f = ${f}; return inputs.map((ins) => f(...ins)); })()`);

      expect(dataFromToStringBefore).toStrictEqual(data);
      expect(dataFromToString).toStrictEqual(data);
    } catch (err) {
      throw new Error(`Invalid toString representation encountered, got: ${f}\n\nFailed with: ${err}`);
    }
  })(hash, stringify);

  expect(assertionHasBeenExecuted).toBe(true);
}
