import { AsyncCommand } from './command/AsyncCommand';
import { Command } from './command/Command';
import { ICommand } from './command/ICommand';

type Setup<Model, Real> = () => { model: Model; real: Real };

/** @hidden */
const genericModelRun = <Model extends object, Real, P>(
  s: Setup<Model, Real>,
  cmds: Iterable<ICommand<Model, Real, P>>,
  initialValue: P,
  then: (p: P, c: () => P | undefined) => P
): P => {
  const { model, real } = s();
  let state = initialValue;
  for (const c of cmds) {
    state = then(state, () => {
      // No need to check incoming state
      // as c.run "throws" in case of exception
      if (c.check(model)) return c.run(model, real);
    });
  }
  return state;
};

/**
 * Run synchronous commands over a `Model` and the `Real` system
 *
 * Throw in case of inconsistency
 *
 * @param s Initial state provider
 * @param cmds Synchronous commands to be executed
 */
export const modelRun = <Model extends object, Real>(
  s: Setup<Model, Real>,
  cmds: Iterable<Command<Model, Real>>
): void => {
  const then = (p: undefined, c: () => undefined) => c();
  genericModelRun(s, cmds, undefined, then);
};

/**
 * Run asynchronous commands over a `Model` and the `Real` system
 *
 * Throw in case of inconsistency
 *
 * @param s Initial state provider
 * @param cmds Asynchronous commands to be executed
 */
export const asyncModelRun = <Model extends object, Real>(
  s: Setup<Model, Real>,
  cmds: Iterable<AsyncCommand<Model, Real>>
): Promise<void> => {
  const then = (p: Promise<void>, c: () => Promise<void> | undefined) => p.then(c);
  return genericModelRun(s, cmds, Promise.resolve(), then);
};
