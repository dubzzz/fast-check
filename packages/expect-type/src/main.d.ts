import { IsSame, Extends } from './internals';
export declare function expectType<TExpectedType>(): <TReal>(
  arg: TReal,
  ...noArgs: IsSame<TExpectedType, TReal> extends true ? [string] : [{ expected: TExpectedType; got: TReal }]
) => void;
export declare function expectTypeAssignable<TExpectedType>(): <TReal>(
  arg: TReal,
  ...noArgs: Extends<TReal, TExpectedType> extends true ? [string] : [{ expected: TExpectedType; got: TReal }]
) => void;
