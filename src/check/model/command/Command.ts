import { ICommand } from './ICommand';

export interface Command<Model extends object, Real> extends ICommand<Model, Real, void> {}
