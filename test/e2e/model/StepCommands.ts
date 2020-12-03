import * as fc from '../../../src/fast-check';

type M2 = {
  current: { stepId: number };
  validSteps: number[];
};
type R2 = unknown;

export class SuccessCommand implements fc.Command<M2, R2> {
  check = (m: Readonly<M2>): boolean => m.validSteps.includes(m.current.stepId++);
  run = (_m: M2, _r: R2): void => {};
  toString = (): string => 'success';
}
export class FailureCommand implements fc.Command<M2, R2> {
  check = (m: Readonly<M2>): boolean => m.validSteps.includes(m.current.stepId++);
  run = (_m: M2, _r: R2): void => {
    throw 'failure';
  };
  toString = (): string => 'failure';
}
