import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';

/** @internal */
function toBoxedMapper(v: unknown): unknown {
  switch (typeof v) {
    case 'boolean':
      // tslint:disable-next-line:no-construct
      return new Boolean(v);
    case 'number':
      // tslint:disable-next-line:no-construct
      return new Number(v);
    case 'string':
      // tslint:disable-next-line:no-construct
      return new String(v);
    default:
      return v;
  }
}

/** @internal */
export function boxedArbitraryBuilder(arb: Arbitrary<unknown>): Arbitrary<unknown> {
  return arb.map(toBoxedMapper);
}
