import { AsyncCommand } from './command/AsyncCommand';
import { Command } from './command/Command';
import { ICommand } from './command/ICommand';
import { CommandsIterable } from './commands/CommandsIterable';

type Setup<Model, Real> = () => { model: Model; real: Real };
type AsyncSetup<Model, Real> = () => Promise<{ model: Model; real: Real }>;

type SetupFun<Model, Real, P> = (s: { model: Model; real: Real }) => P;
interface SetupProducer<Model, Real, P> {
  then: (fun: SetupFun<Model, Real, P>) => P;
}

/** @hidden */
const genericModelRun = <Model extends object, Real, P>(
  s: SetupProducer<Model, Real, P>,
  cmds: Iterable<ICommand<Model, Real, P>>,
  initialValue: P,
  then: (p: P, c: () => P | undefined) => P
): P => {
  return s.then((o: { model: Model; real: Real }) => {
    const { model, real } = o;
    let state = initialValue;
    for (const c of cmds) {
      state = then(state, () => {
        // No need to check incoming state
        // as c.run "throws" in case of exception
        if (c.check(model)) return c.run(model, real);
      });
    }
    return state;
  });
};

/** @hidden */
const internalModelRun = <Model extends object, Real>(
  s: Setup<Model, Real>,
  cmds: Iterable<Command<Model, Real>> | CommandsIterable<Model, Real, void>
): void => {
  const then = (p: undefined, c: () => undefined) => c();
  try {
    const setupProducer = { then: (fun: SetupFun<Model, Real, void>) => fun(s()) };
    return genericModelRun(setupProducer, cmds, undefined, then);
  } catch (err) {
    throw err;
  }
};

/** @hidden */
const isAsyncSetup = <Model, Real>(
  s: ReturnType<Setup<Model, Real>> | ReturnType<AsyncSetup<Model, Real>>
): s is ReturnType<AsyncSetup<Model, Real>> => {
  return typeof (s as any).then === 'function';
};

/** @hidden */
const internalAsyncModelRun = async <Model extends object, Real>(
  s: Setup<Model, Real> | AsyncSetup<Model, Real>,
  cmds: Iterable<AsyncCommand<Model, Real>> | CommandsIterable<Model, Real, Promise<void>>
): Promise<void> => {
  const then = (p: Promise<void>, c: () => Promise<void> | undefined) => p.then(c);
  try {
    const setupProducer = {
      then: (fun: SetupFun<Model, Real, Promise<void>>) => {
        const out = s();
        if (isAsyncSetup(out)) return out.then(fun);
        else return fun(out);
      }
    };
    return await genericModelRun(setupProducer, cmds, Promise.resolve(), then);
  } catch (err) {
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
  s: Setup<Model, Real> | AsyncSetup<Model, Real>,
  cmds: Iterable<AsyncCommand<Model, Real>> | CommandsIterable<Model, Real, Promise<void>>
): Promise<void> => {
  await internalAsyncModelRun(s, cmds);
};
