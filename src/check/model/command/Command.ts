import { ICommand } from './ICommand';

// eslint-disable-next-line @typescript-eslint/ban-types
export interface Command<Model extends object, Real> extends ICommand<Model, Real, void> {}
