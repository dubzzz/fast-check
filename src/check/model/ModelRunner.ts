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

/** @internal */
const genericModelRun = <Model extends object, Real, P, CheckAsync extends boolean>(
  s: SetupProducer<Model, Real, P>,
  cmds: Iterable<ICommand<Model, Real, P, CheckAsync>>,
  initialValue: P,
  runCmd: (cmd: ICommand<Model, Real, P, CheckAsync>, m: Model, r: Real) => P,
  then: (p: P, c: () => P | undefined) => P
): P => {
  return s.then((o: { model: Model; real: Real }) => {
    const { model, real } = o;
    let state = initialValue;
    for (const c of cmds) {
      state = then(state, () => {
        // No need to check incoming state
        // as c.run "throws" in case of exception
        return runCmd(c, model, real);
      });
    }
    return state;
  });
};

/** @internal */
const internalModelRun = <Model extends object, Real>(
  s: Setup<Model, Real>,
  cmds: Iterable<Command<Model, Real>> | CommandsIterable<Model, Real, undefined>
): void => {
  const then = (p: undefined, c: () => undefined) => c();
  const setupProducer: SetupProducer<Model, Real, undefined> = {
    then: (fun: SetupFun<Model, Real, void>) => {
      fun(s());
      return undefined;
    }
  };
  const runSync = (cmd: Command<Model, Real>, m: Model, r: Real) => {
    if (cmd.check(m)) cmd.run(m, r);
    return undefined;
  };
  return genericModelRun(
    setupProducer,
    cmds as Iterable<ICommand<Model, Real, undefined, false>>,
    undefined,
    runSync,
    then
  );
};

/** @internal */
const isAsyncSetup = <Model, Real>(
  s: ReturnType<Setup<Model, Real>> | ReturnType<AsyncSetup<Model, Real>>
): s is ReturnType<AsyncSetup<Model, Real>> => {
  return typeof (s as any).then === 'function';
};

/** @internal */
const internalAsyncModelRun = async <Model extends object, Real, CheckAsync extends boolean>(
  s: Setup<Model, Real> | AsyncSetup<Model, Real>,
  cmds: Iterable<AsyncCommand<Model, Real, CheckAsync>> | CommandsIterable<Model, Real, Promise<void>, CheckAsync>
): Promise<void> => {
  const then = (p: Promise<void>, c: () => Promise<void> | undefined) => p.then(c);
  const setupProducer = {
    then: (fun: SetupFun<Model, Real, Promise<void>>) => {
      const out = s();
      if (isAsyncSetup(out)) return out.then(fun);
      else return fun(out);
    }
  };
  const runAsync = async (cmd: AsyncCommand<Model, Real, CheckAsync>, m: Model, r: Real) => {
    if (await cmd.check(m)) await cmd.run(m, r);
  };
  return await genericModelRun(setupProducer, cmds, Promise.resolve(), runAsync, then);
};

/**
 * Run synchronous commands over a `Model` and the `Real` system
 *
 * Throw in case of inconsistency
 *
 * @param s Initial state provider
 * @param cmds Synchronous commands to be executed
 */
export const modelRun = <Model extends object, Real, InitialModel extends Model>(
  s: Setup<InitialModel, Real>,
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
export const asyncModelRun = async <Model extends object, Real, CheckAsync extends boolean, InitialModel extends Model>(
  s: Setup<InitialModel, Real> | AsyncSetup<InitialModel, Real>,
  cmds: Iterable<AsyncCommand<Model, Real, CheckAsync>> | CommandsIterable<Model, Real, Promise<void>, CheckAsync>
): Promise<void> => {
  await internalAsyncModelRun(s, cmds);
};
