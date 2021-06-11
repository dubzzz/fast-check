import { AsyncCommand } from './command/AsyncCommand';
import { Command } from './command/Command';
import { ICommand } from './command/ICommand';
import { Scheduler } from '../../arbitrary/scheduler';
import { scheduleCommands } from './commands/ScheduledCommand';

/**
 * Synchronous definition of model and real
 * @remarks Since 2.2.0
 * @public
 */
export type ModelRunSetup<Model, Real> = () => { model: Model; real: Real };

/**
 * Asynchronous definition of model and real
 * @remarks Since 2.2.0
 * @public
 */
export type ModelRunAsyncSetup<Model, Real> = () => Promise<{ model: Model; real: Real }>;

/** @internal */
type SetupFun<Model, Real, P> = (s: { model: Model; real: Real }) => P;
/** @internal */
interface SetupProducer<Model, Real, P> {
  then: (fun: SetupFun<Model, Real, P>) => P;
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/ban-types
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
// eslint-disable-next-line @typescript-eslint/ban-types
const internalModelRun = <Model extends object, Real>(
  s: ModelRunSetup<Model, Real>,
  cmds: Iterable<Command<Model, Real>>
): void => {
  const then = (_p: undefined, c: () => undefined) => c();
  const setupProducer: SetupProducer<Model, Real, undefined> = {
    then: (fun: SetupFun<Model, Real, void>) => {
      fun(s());
      return undefined;
    },
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
  s: ReturnType<ModelRunSetup<Model, Real>> | ReturnType<ModelRunAsyncSetup<Model, Real>>
): s is ReturnType<ModelRunAsyncSetup<Model, Real>> => {
  return typeof (s as any).then === 'function';
};

/** @internal */
// eslint-disable-next-line @typescript-eslint/ban-types
const internalAsyncModelRun = async <Model extends object, Real, CheckAsync extends boolean>(
  s: ModelRunSetup<Model, Real> | ModelRunAsyncSetup<Model, Real>,
  cmds: Iterable<AsyncCommand<Model, Real, CheckAsync>>,
  defaultPromise = Promise.resolve()
): Promise<void> => {
  const then = (p: Promise<void>, c: () => Promise<void> | undefined) => p.then(c);
  const setupProducer = {
    then: (fun: SetupFun<Model, Real, Promise<void>>) => {
      const out = s();
      if (isAsyncSetup(out)) return out.then(fun);
      else return fun(out);
    },
  };
  const runAsync = async (cmd: AsyncCommand<Model, Real, CheckAsync>, m: Model, r: Real) => {
    if (await cmd.check(m)) await cmd.run(m, r);
  };
  return await genericModelRun(setupProducer, cmds, defaultPromise, runAsync, then);
};

/**
 * Run synchronous commands over a `Model` and the `Real` system
 *
 * Throw in case of inconsistency
 *
 * @param s - Initial state provider
 * @param cmds - Synchronous commands to be executed
 *
 * @remarks Since 1.5.0
 * @public
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function modelRun<Model extends object, Real, InitialModel extends Model>(
  s: ModelRunSetup<InitialModel, Real>,
  cmds: Iterable<Command<Model, Real>>
): void {
  internalModelRun(s, cmds);
}

/**
 * Run asynchronous commands over a `Model` and the `Real` system
 *
 * Throw in case of inconsistency
 *
 * @param s - Initial state provider
 * @param cmds - Asynchronous commands to be executed
 *
 * @remarks Since 1.5.0
 * @public
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export async function asyncModelRun<Model extends object, Real, CheckAsync extends boolean, InitialModel extends Model>(
  s: ModelRunSetup<InitialModel, Real> | ModelRunAsyncSetup<InitialModel, Real>,
  cmds: Iterable<AsyncCommand<Model, Real, CheckAsync>>
): Promise<void> {
  await internalAsyncModelRun(s, cmds);
}

/**
 * Run asynchronous and scheduled commands over a `Model` and the `Real` system
 *
 * Throw in case of inconsistency
 *
 * @param scheduler - Scheduler
 * @param s - Initial state provider
 * @param cmds - Asynchronous commands to be executed
 *
 * @remarks Since 1.24.0
 * @public
 */
export async function scheduledModelRun<
  // eslint-disable-next-line @typescript-eslint/ban-types
  Model extends object,
  Real,
  CheckAsync extends boolean,
  InitialModel extends Model
>(
  scheduler: Scheduler,
  s: ModelRunSetup<InitialModel, Real> | ModelRunAsyncSetup<InitialModel, Real>,
  cmds: Iterable<AsyncCommand<Model, Real, CheckAsync>>
): Promise<void> {
  const scheduledCommands = scheduleCommands(scheduler, cmds);
  const out = internalAsyncModelRun(s, scheduledCommands, scheduler.schedule(Promise.resolve(), 'startModel'));
  await scheduler.waitAll();
  await out;
}
