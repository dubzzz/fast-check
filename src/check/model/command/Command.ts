import { ICommand } from './ICommand';

/**
 * Interface that should be implemented in order to define
 * a synchronous command
 *
 * @public
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export interface Command<Model extends object, Real> extends ICommand<Model, Real, void> {}
