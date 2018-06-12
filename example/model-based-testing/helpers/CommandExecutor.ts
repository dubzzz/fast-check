import { Command } from './Command';

type Setup<Model, Real> = () => { model: Model; real: Real };
export const CommandExecutor = <Model, Real>(s: Setup<Model, Real>, cmds: Command<Model, Real>[]): void => {
  const { model, real } = s();
  for (const c of cmds) {
    if (c.checkPreconditions(model)) {
      c.run(model, real);
      c.apply(model);
    }
  }
};
