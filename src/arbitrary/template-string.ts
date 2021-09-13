import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import { constant } from './constant';
import { TupleArbitrary } from './_internals/TupleArbitrary';
export { StringSharedConstraints } from './_internals/helpers/StringConstraintsExtractor';

/**
 * Zip the inputs of a tagged template and transform them with a function.
 * @remarks `first` is assumed to always have one more item than `second`
 */
const zipTemplateAndMap =
  <A, B>(fn: (a: A) => B) =>
  (first: Array<A>, second: Array<A>): Array<B> => {
    const sum = [] as Array<B>;
    for (let i = 0; i < second.length; i++) {
      sum.push(fn(first[i]));
      sum.push(fn(second[i]));
    }
    sum.push(fn(first[first.length - 1]));
    return sum;
  };

const constantArb = <T>(arb: T) => constant(arb);
const interpolate = (val: unknown) => `${val}`;
const joinStrings = (strings: Array<string>) => strings.join('');

const zipStrings = zipTemplateAndMap(<T>(arb: Arbitrary<T>) => convertToNext(arb.map(interpolate)));

/**
 * For strings produced by interpolating the provided `arbs`
 * @public
 */
export function templateString(strings: TemplateStringsArray, ...arbs: Array<Arbitrary<unknown>>): Arbitrary<string> {
  const nextArbs = zipStrings(strings.map(constantArb), arbs);
  return convertFromNext(new TupleArbitrary(nextArbs).map(joinStrings));
}
