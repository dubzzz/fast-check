import { ICommand } from './ICommand';

export interface AsyncCommand<Model extends object, Real, CheckAsync extends boolean = false>
  extends ICommand<Model, Real, Promise<void>, CheckAsync> {}
