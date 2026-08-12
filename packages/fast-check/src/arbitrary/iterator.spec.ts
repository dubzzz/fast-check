import * as fc from 'fast-check';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { iterator } from './iterator.js';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers.js';

import * as IteratorArbitraryMock from './_internals/IteratorArbitrary.js';

function beforeEachHook() {
  vi.resetModules();
  vi.restoreAllMocks();
}
beforeEach(beforeEachHook);

describe('iterator', () => {
  it('should instantiate IteratorArbitrary(arb, true, 0, 10, Number.POSITIVE_INFINITY) for iterator(arb)', () => {
    // Arrange
    const { instance: sourceArbitrary } = fakeArbitrary();
    const { instance } = fakeArbitrary();
    const IteratorArbitrary = vi.spyOn(IteratorArbitraryMock, 'IteratorArbitrary');
    IteratorArbitrary.mockImplementation(function () {
      return instance as IteratorArbitraryMock.IteratorArbitrary<unknown>;
    });

    // Act
    const arb = iterator(sourceArbitrary);

    // Assert
    expect(IteratorArbitrary).toHaveBeenCalledWith(sourceArbitrary, true, 0, 10, Number.POSITIVE_INFINITY);
    expect(arb).toBe(instance);
  });

  it('should instantiate IteratorArbitrary(arb, !noHistory, ...) for iterator(arb, { noHistory })', async () => {
    await fc.assert(
      fc.asyncProperty(fc.boolean(), (history) => {
        // Arrange
        const { instance: sourceArbitrary } = fakeArbitrary();
        const { instance } = fakeArbitrary();
        const IteratorArbitrary = vi.spyOn(IteratorArbitraryMock, 'IteratorArbitrary');
        IteratorArbitrary.mockImplementation(function () {
          return instance as IteratorArbitraryMock.IteratorArbitrary<unknown>;
        });

        // Act
        const arb = iterator(sourceArbitrary, { noHistory: !history });

        // Assert
        expect(IteratorArbitrary).toHaveBeenCalledWith(sourceArbitrary, history, 0, 10, Number.POSITIVE_INFINITY);
        expect(arb).toBe(instance);
      }),
    );
  });

  it.each`
    constraints                                                         | expectedMinLength           | expectedMaxGeneratedLength  | expectedMaxLength           | description
    ${{}}                                                               | ${0}                        | ${10}                       | ${Number.POSITIVE_INFINITY} | ${'never-ending iterators allowed by default'}
    ${{ noDefaultInfinity: true }}                                      | ${0}                        | ${10}                       | ${Number.MAX_SAFE_INTEGER}  | ${'only finite iterators when noDefaultInfinity'}
    ${{ maxLength: 5 }}                                                 | ${0}                        | ${5}                        | ${5}                        | ${'only finite iterators when finite maxLength'}
    ${{ maxLength: 100 }}                                               | ${0}                        | ${10}                       | ${100}                      | ${'maxGeneratedLength still driven by size when maxLength is large'}
    ${{ maxLength: Number.POSITIVE_INFINITY, noDefaultInfinity: true }} | ${0}                        | ${10}                       | ${Number.POSITIVE_INFINITY} | ${'explicit infinite maxLength wins over noDefaultInfinity'}
    ${{ minLength: 4 }}                                                 | ${4}                        | ${18}                       | ${Number.POSITIVE_INFINITY} | ${'maxGeneratedLength computed out of minLength'}
    ${{ minLength: 4, maxLength: 6 }}                                   | ${4}                        | ${6}                        | ${6}                        | ${'maxGeneratedLength capped by maxLength'}
    ${{ minLength: Number.POSITIVE_INFINITY }}                          | ${Number.POSITIVE_INFINITY} | ${Number.POSITIVE_INFINITY} | ${Number.POSITIVE_INFINITY} | ${'only never-ending iterators when infinite minLength'}
    ${{ size: 'medium' }}                                               | ${0}                        | ${100}                      | ${Number.POSITIVE_INFINITY} | ${'maxGeneratedLength driven by size'}
    ${{ size: 'max' }}                                                  | ${0}                        | ${Number.MAX_SAFE_INTEGER}  | ${Number.POSITIVE_INFINITY} | ${'maxGeneratedLength up-to Number.MAX_SAFE_INTEGER for size max'}
    ${{ size: 'max', maxLength: 50 }}                                   | ${0}                        | ${50}                       | ${50}                       | ${'maxGeneratedLength up-to maxLength for size max'}
  `(
    'should instantiate IteratorArbitrary with $expectedMinLength, $expectedMaxGeneratedLength, $expectedMaxLength ($description)',
    ({ constraints, expectedMinLength, expectedMaxGeneratedLength, expectedMaxLength }) => {
      // Arrange
      const { instance: sourceArbitrary } = fakeArbitrary();
      const { instance } = fakeArbitrary();
      const IteratorArbitrary = vi.spyOn(IteratorArbitraryMock, 'IteratorArbitrary');
      IteratorArbitrary.mockImplementation(function () {
        return instance as IteratorArbitraryMock.IteratorArbitrary<unknown>;
      });

      // Act
      const arb = iterator(sourceArbitrary, constraints);

      // Assert
      expect(IteratorArbitrary).toHaveBeenCalledWith(
        sourceArbitrary,
        true,
        expectedMinLength,
        expectedMaxGeneratedLength,
        expectedMaxLength,
      );
      expect(arb).toBe(instance);
    },
  );

  it.each`
    constraints                                               | description
    ${{ minLength: -1 }}                                      | ${'negative minLength'}
    ${{ minLength: 1.5 }}                                     | ${'non-integer minLength'}
    ${{ minLength: Number.NaN }}                              | ${'NaN minLength'}
    ${{ maxLength: -1 }}                                      | ${'negative maxLength'}
    ${{ maxLength: 1.5 }}                                     | ${'non-integer maxLength'}
    ${{ maxLength: Number.NaN }}                              | ${'NaN maxLength'}
    ${{ minLength: 5, maxLength: 2 }}                         | ${'minLength greater than maxLength'}
    ${{ minLength: Number.POSITIVE_INFINITY, maxLength: 10 }} | ${'infinite minLength with finite maxLength'}
  `('should throw on invalid constraints ($description)', ({ constraints }) => {
    // Arrange
    const { instance: sourceArbitrary } = fakeArbitrary();

    // Act / Assert
    expect(() => iterator(sourceArbitrary, constraints)).toThrowError();
  });
});
