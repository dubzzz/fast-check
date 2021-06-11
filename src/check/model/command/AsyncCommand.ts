import { ICommand } from './ICommand';

/**
 * Interface that should be implemented in order to define
 * an asynchronous command
 *
 * @remarks Since 1.5.0
 * @public
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export interface AsyncCommand<Model extends object, Real, CheckAsync extends boolean = false>
  extends ICommand<Model, Real, Promise<void>, CheckAsync> {}
