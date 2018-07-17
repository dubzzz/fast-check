import { ICommand } from './ICommand';

export interface AsyncCommand<Model extends object, Real> extends ICommand<Model, Real, Promise<void>> {}
