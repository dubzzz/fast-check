import * as fc from '../../../lib/fast-check';
import { option, OptionConstraints } from '../../../src/arbitrary/option';
import { fakeNextArbitrary } from '../check/arbitrary/generic/NextArbitraryHelpers';
import { convertFromNext } from '../../../src/check/arbitrary/definition/Converters';
import * as FrequencyArbitraryMock from '../../../src/arbitrary/_internals/FrequencyArbitrary';
import * as ConstantArbitraryMock from '../../../src/check/arbitrary/ConstantArbitrary';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('option', () => {
  it('should call FrequencyArbitrary.from with the right parameters when called with constraints', () =>
    fc.assert(
      fc.property(
        fc.record(
          {
            depthIdentifier: fc.string(),
            depthFactor: fc.double({ min: 0.01, noDefaultInfinity: true, noNaN: true }),
            maxDepth: fc.nat(),
            freq: fc.nat(),
            nil: fc.anything(),
          },
          { requiredKeys: [] }
        ),
        (constraints: Partial<OptionConstraints<unknown>>) => {
          // Arrange
          const expectedArb = convertFromNext(fakeNextArbitrary().instance);
          const fromOld = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'fromOld');
          fromOld.mockReturnValue(expectedArb);
          const expectedConstantArb = convertFromNext(fakeNextArbitrary().instance);
          const constant = jest.spyOn(ConstantArbitraryMock, 'constant');
          constant.mockReturnValue(expectedConstantArb);
          const { instance: nextArb } = fakeNextArbitrary();
          const arb = convertFromNext(nextArb);

          // Act
          const out = option(arb, constraints);

          // Assert
          expect(constant).toHaveBeenCalledWith('nil' in constraints ? constraints.nil : null);
          expect(fromOld).toHaveBeenCalledWith(
            [
              { arbitrary: expectedConstantArb, weight: 1 },
              { arbitrary: arb, weight: 'freq' in constraints ? constraints.freq! : 5 },
            ],
            {
              withCrossShrink: true,
              depthFactor: constraints.depthFactor,
              maxDepth: constraints.maxDepth,
              depthIdentifier: constraints.depthIdentifier,
            },
            'fc.option'
          );
          expect(out).toBe(expectedArb);
        }
      )
    ));

  it('should call FrequencyArbitrary.from with the right parameters when called without constraints', () => {
    // Arrange
    const expectedArb = convertFromNext(fakeNextArbitrary().instance);
    const fromOld = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'fromOld');
    fromOld.mockReturnValue(expectedArb);
    const expectedConstantArb = convertFromNext(fakeNextArbitrary().instance);
    const constant = jest.spyOn(ConstantArbitraryMock, 'constant');
    constant.mockReturnValue(expectedConstantArb);
    const { instance: nextArb } = fakeNextArbitrary();
    const arb = convertFromNext(nextArb);

    // Act
    const out = option(arb);

    // Assert
    expect(constant).toHaveBeenCalledWith(null);
    expect(fromOld).toHaveBeenCalledWith(
      [
        { arbitrary: expectedConstantArb, weight: 1 },
        { arbitrary: arb, weight: 5 },
      ],
      {
        withCrossShrink: true,
        depthFactor: undefined,
        maxDepth: undefined,
        depthIdentifier: undefined,
      },
      'fc.option'
    );
    expect(out).toBe(expectedArb);
  });
  it('[legacy] should call FrequencyArbitrary.from with the right parameters when called with only freq', () =>
    fc.assert(
      fc.property(fc.nat(), (freq) => {
        // Arrange
        const expectedArb = convertFromNext(fakeNextArbitrary().instance);
        const fromOld = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'fromOld');
        fromOld.mockReturnValue(expectedArb);
        const expectedConstantArb = convertFromNext(fakeNextArbitrary().instance);
        const constant = jest.spyOn(ConstantArbitraryMock, 'constant');
        constant.mockReturnValue(expectedConstantArb);
        const { instance: nextArb } = fakeNextArbitrary();
        const arb = convertFromNext(nextArb);

        // Act
        const out = option(arb, freq);

        // Assert
        expect(constant).toHaveBeenCalledWith(null);
        expect(fromOld).toHaveBeenCalledWith(
          [
            { arbitrary: expectedConstantArb, weight: 1 },
            { arbitrary: arb, weight: freq },
          ],
          {
            withCrossShrink: true,
            depthFactor: undefined,
            maxDepth: undefined,
            depthIdentifier: undefined,
          },
          'fc.option'
        );
        expect(out).toBe(expectedArb);
      })
    ));
});
