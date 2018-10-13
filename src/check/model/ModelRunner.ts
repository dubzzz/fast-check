import { AsyncCommand } from './command/AsyncCommand';
import { Command } from './command/Command';
import { ICommand } from './command/ICommand';
import { CommandsIterable } from './commands/CommandsIterable';

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

/** @hidden */
const internalModelRun = <Model extends object, Real>(
  s: Setup<Model, Real>,
  cmds: Iterable<Command<Model, Real>> | CommandsIterable<Model, Real, void>
): void => {
  const then = (p: undefined, c: () => undefined) => c();
  try {
    return genericModelRun(s, cmds, undefined, then);
  } catch (err) {
    if ('errorDetected' in cmds && typeof cmds.errorDetected === 'function') {
      cmds.errorDetected();
    }
    throw err;
  }
};

/** @hidden */
const internalAsyncModelRun = async <Model extends object, Real>(
  s: Setup<Model, Real>,
  cmds: Iterable<AsyncCommand<Model, Real>> | CommandsIterable<Model, Real, Promise<void>>
): Promise<void> => {
  const then = (p: Promise<void>, c: () => Promise<void> | undefined) => p.then(c);
  try {
    return await genericModelRun(s, cmds, Promise.resolve(), then);
  } catch (err) {
    if ('errorDetected' in cmds && typeof cmds.errorDetected === 'function') {
      cmds.errorDetected();
    }
    throw err;
  }
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
  cmds: Iterable<Command<Model, Real>> | CommandsIterable<Model, Real, void>
): void => {
  internalModelRun(s, cmds);
};

/**
 * Run asynchronous commands over a `Model` and the `Real` system
 *
 * Throw in case of inconsistency
 *
 * @param s Initial state provider
 * @param cmds Asynchronous commands to be executed
 */
export const asyncModelRun = async <Model extends object, Real>(
  s: Setup<Model, Real>,
  cmds: Iterable<AsyncCommand<Model, Real>> | CommandsIterable<Model, Real, Promise<void>>
): Promise<void> => {
  await internalAsyncModelRun(s, cmds);
};
