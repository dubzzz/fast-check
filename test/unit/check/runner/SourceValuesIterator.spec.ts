import * as fc from '../../../../lib/fast-check';

import { SourceValuesIterator } from '../../../../src/check/runner/SourceValuesIterator';

function iota() {
  function* g() {
    let idx = 0;
    while (true) yield idx++;
  }
  return new fc.Stream(g());
}
function iotaN(n: number) {
  return iota().take(n);
}

function source() {
  return iota()
    .map((v) => () => v)
    [Symbol.iterator]();
}
function sourceN(n: number) {
  return iotaN(n)
    .map((v) => () => v)
    [Symbol.iterator]();
}

function simulateSkips(svIt: SourceValuesIterator<number>, skippedValues: number[]) {
  const svValues = [];
  for (const v of svIt) {
    if (skippedValues.includes(v)) svIt.skippedOne();
    else svValues.push(v);
  }
  return svValues;
}

describe('SourceValuesIterator', () => {
  it('Should only call the produce method when iterating on the value', () =>
    fc.assert(
      fc.property(fc.nat(100), (askedValues) => {
        const generatedValues: number[] = [];
        const initialValues = iota()
          .map((v) => () => {
            generatedValues.push(v);
            return v;
          })
          [Symbol.iterator]();
        const svIt = new SourceValuesIterator(initialValues, askedValues, 0);
        const svValues = [...svIt];

        expect(generatedValues).toHaveLength(askedValues);
        expect(generatedValues).toEqual(svValues);
      })
    ));
  describe('Not enough skipped values', () => {
    it('Should return the first eligible askedValues values if infinite source', () =>
      fc.assert(
        fc.property(fc.nat(100), fc.uniqueArray(fc.nat(100)), (askedValues, skippedValues) => {
          const svIt = new SourceValuesIterator(source(), askedValues, skippedValues.length);
          const svValues = simulateSkips(svIt, skippedValues);

          const expectedValues = [
            ...iota()
              .filter((v) => !skippedValues.includes(v))
              .take(askedValues),
          ];
          expect(svValues).toHaveLength(askedValues);
          expect(svValues).toEqual(expectedValues);
        })
      ));
    it('Should return the first eligible askedValues values if larger source', () =>
      fc.assert(
        fc.property(
          fc.nat(100),
          fc.nat(100),
          fc.uniqueArray(fc.nat(100)),
          (askedValues, additionalValuesInSource, skippedValues) => {
            const initialValues = sourceN(askedValues + additionalValuesInSource + skippedValues.length);
            const svIt = new SourceValuesIterator(initialValues, askedValues, skippedValues.length);
            const svValues = simulateSkips(svIt, skippedValues);

            const expectedValues = [
              ...iota()
                .filter((v) => !skippedValues.includes(v))
                .take(askedValues),
            ];
            expect(svValues).toHaveLength(askedValues);
            expect(svValues).toEqual(expectedValues);
          }
        )
      ));
    it('Should return the first eligible values among sourceValues values if smaller source', () =>
      fc.assert(
        fc.property(
          fc.nat(100),
          fc.nat(100),
          fc.uniqueArray(fc.nat(100)),
          (sourceValues, additionalAskedValues, skippedValues) => {
            const askedValues = sourceValues + additionalAskedValues;
            const svIt = new SourceValuesIterator(sourceN(sourceValues), askedValues, skippedValues.length);
            const svValues = simulateSkips(svIt, skippedValues);

            const numSkippedValues = skippedValues.filter((v) => v < sourceValues).length;
            const expectedValues = [
              ...iota()
                .take(sourceValues)
                .filter((v) => !skippedValues.includes(v)),
            ];
            expect(svValues).toHaveLength(sourceValues - numSkippedValues);
            expect(svValues).toEqual(expectedValues);
          }
        )
      ));
  });
  describe('Too many skipped values', () => {
    it('Should stop as soon as it passes maxSkips skipped values', () =>
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.nat(100), { minLength: 1, maxLength: 20 }),
          fc.integer(1, 100),
          (skippedValues, missingValues) => {
            const lastSkip = skippedValues.reduce((prev, cur) => (prev > cur ? prev : cur), 0);
            const askedValues = lastSkip + 1 - skippedValues.length + missingValues;
            const svIt = new SourceValuesIterator(source(), askedValues, skippedValues.length - 1);
            const svValues = simulateSkips(svIt, skippedValues);

            const expectedValues = [...iotaN(lastSkip).filter((v) => !skippedValues.includes(v))];
            expect(svValues).toEqual(expectedValues);
          }
        )
      ));
  });
});
