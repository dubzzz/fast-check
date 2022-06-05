import { ICommand } from './ICommand';

/**
 * Interface that should be implemented in order to define
 * a synchronous command
 *
 * @remarks Since 1.5.0
 * @public
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export interface Command<Model extends object, Real> extends ICommand<Model, Real, void> {}
