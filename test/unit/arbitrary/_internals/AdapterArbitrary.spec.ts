import { adapter, AdapterOutput } from '../../../../src/arbitrary/_internals/AdapterArbitrary';
import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';
import { fakeNextArbitrary } from '../__test-helpers__/NextArbitraryHelpers';
import { fakeRandom } from '../__test-helpers__/RandomHelpers';
import { Stream } from '../../../../src/stream/Stream';
import fc from '../../../../lib/fast-check';

describe('AdapterArbitrary', () => {
  describe('generate', () => {
    it('should directly pass the values not needing any adaptation', () => {
      fc.assert(
        fc.property(
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.anything(),
          fc.anything(),
          (biasFactor, v, c) => {
            // Arrange
            const value = new NextValue(v, c);
            const { instance, generate, shrink, canShrinkWithoutContext } = fakeNextArbitrary();
            generate.mockReturnValueOnce(value);
            const { instance: mrng } = fakeRandom();
            const adapterFunction = jest
              .fn<AdapterOutput<any>, [any]>()
              .mockImplementation((v) => ({ adapted: false, value: v }));

            // Act
            const arb = adapter(instance, adapterFunction);
            const g = arb.generate(mrng, biasFactor);

            // Assert
            expect(g).toBe(value);
            expect(generate).toHaveBeenCalledWith(mrng, biasFactor);
            expect(adapterFunction).toHaveBeenCalledWith(v);
            expect(shrink).not.toHaveBeenCalled();
            expect(canShrinkWithoutContext).not.toHaveBeenCalled();
          }
        )
      );
    });

    it('should return an adapted value when needing adaptations', () => {
      fc.assert(
        fc.property(
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.anything(),
          fc.anything(),
          fc.anything(),
          (biasFactor, v, c, vAdapted) => {
            // Arrange
            const value = new NextValue(v, c);
            const { instance, generate, shrink, canShrinkWithoutContext } = fakeNextArbitrary();
            generate.mockReturnValueOnce(value);
            const { instance: mrng } = fakeRandom();
            const adapterFunction = jest
              .fn<AdapterOutput<any>, [any]>()
              .mockImplementation(() => ({ adapted: true, value: vAdapted }));

            // Act
            const arb = adapter(instance, adapterFunction);
            const g = arb.generate(mrng, biasFactor);

            // Assert
            expect(g).not.toBe(value);
            expect(g.value_).toBe(vAdapted);
            expect(generate).toHaveBeenCalledWith(mrng, biasFactor);
            expect(adapterFunction).toHaveBeenCalledWith(v);
            expect(shrink).not.toHaveBeenCalled();
            expect(canShrinkWithoutContext).not.toHaveBeenCalled();
          }
        )
      );
    });
  });

  describe('canShrinkWithoutContext', () => {
    it.each`
      canShrink | hasToAdapt
      ${false}  | ${false}
      ${true}   | ${false}
      ${false}  | ${true}
      ${true}   | ${true}
    `(
      'should only be able to shrink ithout context if underlying can shrink and adapter does not adapt (canShrink=$canShrink, hasToAdapt=$hasToAdapt)',
      ({ canShrink, hasToAdapt }) => {
        // Arrange
        const vA = Symbol();
        const { instance, canShrinkWithoutContext } = fakeNextArbitrary();
        canShrinkWithoutContext.mockReturnValueOnce(canShrink);
        const adapterFunction = jest
          .fn<AdapterOutput<any>, [any]>()
          .mockImplementation(() => ({ adapted: hasToAdapt, value: vA }));

        // Act
        const arb = adapter(instance, adapterFunction);
        const out = arb.canShrinkWithoutContext(vA);

        // Assert
        expect(out).toBe(canShrink && !hasToAdapt);
      }
    );
  });

  describe('shrink', () => {
    it('should be able to shrink any value it generated if not adapted or shrinkable adapted', () => {
      fc.assert(
        fc.property(
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.anything(),
          fc.anything(),
          fc.record({ adapted: fc.boolean(), value: fc.anything() }),
          fc.anything(),
          fc.anything(),
          fc.record({ adapted: fc.boolean(), value: fc.anything() }),
          fc.anything(),
          fc.anything(),
          fc.record({ adapted: fc.boolean(), value: fc.anything() }),
          fc.boolean(),
          (biasFactor, vA, cA, adaptedA, vAA, cAA, adaptedAA, vAB, cAB, adaptedAB, canShrinkIfAdapted) => {
            // Arrange
            fc.pre([vAA, vAB].findIndex((v) => v === vA) === -1);
            fc.pre([vA, vAB].findIndex((v) => v === vAA) === -1);
            fc.pre([vA, vAA].findIndex((v) => v === vAB) === -1);
            const valueA = new NextValue(vA, cA);
            const valueAA = new NextValue(vAA, cAA);
            const valueAB = new NextValue(vAB, cAB);
            const { instance, generate, shrink, canShrinkWithoutContext } = fakeNextArbitrary();
            generate.mockReturnValueOnce(valueA);
            shrink.mockReturnValueOnce(Stream.of(valueAA, valueAB));
            canShrinkWithoutContext.mockReturnValue(canShrinkIfAdapted);
            const { instance: mrng } = fakeRandom();
            const adapterFunction = jest
              .fn<AdapterOutput<any>, [any]>()
              .mockImplementation((v) => (v === vA ? adaptedA : v === vAA ? adaptedAA : adaptedAB));

            // Act
            const arb = adapter(instance, adapterFunction);
            const g = arb.generate(mrng, biasFactor);
            const shrinks = [...arb.shrink(g.value, g.context)];

            // Assert
            expect(generate).toHaveBeenCalledWith(mrng, biasFactor);
            if (!adaptedA.adapted || canShrinkIfAdapted) {
              expect(shrinks).toHaveLength(2);
              if (adaptedAA.adapted) {
                expect(shrinks[0].value_).toBe(adaptedAA.value);
              } else {
                expect(shrinks[0]).toBe(valueAA);
              }
              if (adaptedAB.adapted) {
                expect(shrinks[1].value_).toBe(adaptedAB.value);
              } else {
                expect(shrinks[1]).toBe(valueAB);
              }
              if (adaptedA.adapted) {
                expect(shrink).toHaveBeenCalledWith(adaptedA.value, undefined);
                expect(canShrinkWithoutContext).toHaveBeenCalledWith(adaptedA.value);
              } else {
                expect(shrink).toHaveBeenCalledWith(vA, cA);
                expect(canShrinkWithoutContext).not.toHaveBeenCalled();
              }
            } else {
              expect(shrinks).toHaveLength(0);
              expect(shrink).not.toHaveBeenCalled();
              expect(canShrinkWithoutContext).toHaveBeenCalledWith(adaptedA.value); // returned false
            }
          }
        )
      );
    });

    it('should be able to shrink any value it shrunk if not adapted or shrinkable adapted', () => {
      fc.assert(
        fc.property(
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.anything(),
          fc.anything(),
          fc.record({ adapted: fc.boolean(), value: fc.anything() }),
          fc.anything(),
          fc.anything(),
          fc.record({ adapted: fc.boolean(), value: fc.anything() }),
          fc.anything(),
          fc.anything(),
          fc.record({ adapted: fc.boolean(), value: fc.anything() }),
          fc.anything(),
          fc.anything(),
          fc.record({ adapted: fc.boolean(), value: fc.anything() }),
          fc.anything(),
          fc.anything(),
          fc.record({ adapted: fc.boolean(), value: fc.anything() }),
          fc.boolean(),
          (
            biasFactor,
            vA,
            cA,
            adaptedA,
            vAA,
            cAA,
            adaptedAA,
            vAB,
            cAB,
            adaptedAB,
            vAC,
            cAC,
            adaptedAC,
            vABC,
            cABC,
            adaptedABC,
            canShrinkIfAdapted
          ) => {
            // Arrange
            fc.pre([vAA, vAB, vAC, vABC].findIndex((v) => v === vA) === -1);
            fc.pre([vA, vAB, vAC, vABC].findIndex((v) => v === vAA) === -1);
            fc.pre([vA, vAA, vAC, vABC].findIndex((v) => v === vAB) === -1);
            fc.pre([vA, vAA, vAB, vABC].findIndex((v) => v === vAC) === -1);
            fc.pre([vA, vAA, vAB, vAC].findIndex((v) => v === vABC) === -1);
            const valueA = new NextValue(vA, cA);
            const valueAA = new NextValue(vAA, cAA);
            const valueAB = new NextValue(vAB, cAB);
            const valueAC = new NextValue(vAC, cAC);
            const valueABC = new NextValue(vABC, cABC);
            const { instance, generate, shrink, canShrinkWithoutContext } = fakeNextArbitrary();
            generate.mockReturnValueOnce(valueA);
            shrink.mockReturnValueOnce(Stream.of(valueAA, valueAB, valueAC)).mockReturnValueOnce(Stream.of(valueABC));
            canShrinkWithoutContext.mockImplementation((v) => v === valueA || canShrinkIfAdapted);
            const { instance: mrng } = fakeRandom();
            const adapterFunction = jest
              .fn<AdapterOutput<any>, [any]>()
              .mockImplementation((v) =>
                v === vA ? adaptedA : v === vAA ? adaptedAA : v === vAB ? adaptedAB : v === vAC ? adaptedAC : adaptedABC
              );

            // Act
            const arb = adapter(instance, adapterFunction);
            const g = arb.generate(mrng, biasFactor);
            const g2 = [...arb.shrink(g.value, g.context)][1];
            const shrinks = [...arb.shrink(g2.value, g2.context)];

            // Assert
            expect(generate).toHaveBeenCalledWith(mrng, biasFactor);
            if (adaptedA.adapted) {
              expect(shrink).toHaveBeenCalledWith(adaptedA.value, undefined);
              expect(canShrinkWithoutContext).toHaveBeenCalledWith(adaptedA.value);
            } else {
              expect(shrink).toHaveBeenCalledWith(vA, cA);
              expect(canShrinkWithoutContext).not.toHaveBeenCalledWith(adaptedA.value);
            }
            expect(canShrinkWithoutContext).not.toHaveBeenCalledWith(vA);
            if (!adaptedAB.adapted || canShrinkIfAdapted) {
              expect(shrinks).toHaveLength(1);
              if (adaptedABC.adapted) {
                expect(shrinks[0].value_).toBe(adaptedABC.value);
              } else {
                expect(shrinks[0]).toBe(valueABC);
              }
              if (adaptedAB.adapted) {
                expect(shrink).toHaveBeenCalledWith(adaptedAB.value, undefined);
                expect(canShrinkWithoutContext).toHaveBeenCalledWith(adaptedAB.value);
              } else {
                expect(shrink).toHaveBeenCalledWith(vAB, cAB);
                expect(canShrinkWithoutContext).not.toHaveBeenCalledWith(adaptedAB.value);
              }
              expect(canShrinkWithoutContext).not.toHaveBeenCalledWith(vAB);
            } else {
              expect(shrinks).toHaveLength(0);
              expect(shrink).not.toHaveBeenCalledWith(adaptedAB.value, undefined);
              expect(shrink).not.toHaveBeenCalledWith(vAB, cAB);
              expect(canShrinkWithoutContext).toHaveBeenCalledWith(adaptedAB.value);
            }
          }
        )
      );
    });

    it('should forward missing context as-is to the underlying arbitrary', () => {
      fc.assert(
        fc.property(
          fc.anything(),
          fc.anything(),
          fc.anything(),
          fc.record({ adapted: fc.boolean(), value: fc.anything() }),
          fc.anything(),
          fc.anything(),
          fc.record({ adapted: fc.boolean(), value: fc.anything() }),
          (toShrinkvalue, vAA, cAA, adaptedAA, vAB, cAB, adaptedAB) => {
            // Arrange
            fc.pre(vAA !== vAB);
            const valueAA = new NextValue(vAA, cAA);
            const valueAB = new NextValue(vAB, cAB);
            const { instance, generate, shrink, canShrinkWithoutContext } = fakeNextArbitrary();
            shrink.mockReturnValueOnce(Stream.of(valueAA, valueAB));
            const adapterFunction = jest
              .fn<AdapterOutput<any>, [any]>()
              .mockImplementation((v) => (v === vAA ? adaptedAA : adaptedAB));

            // Act
            const arb = adapter(instance, adapterFunction);
            const shrinks = [...arb.shrink(toShrinkvalue, undefined)];

            // Assert
            expect(shrinks).toHaveLength(2);
            if (adaptedAA.adapted) {
              expect(shrinks[0].value_).toBe(adaptedAA.value);
            } else {
              expect(shrinks[0]).toBe(valueAA);
            }
            if (adaptedAB.adapted) {
              expect(shrinks[1].value_).toBe(adaptedAB.value);
            } else {
              expect(shrinks[1]).toBe(valueAB);
            }
            expect(generate).not.toHaveBeenCalled();
            expect(shrink).toHaveBeenCalledWith(toShrinkvalue, undefined);
            expect(canShrinkWithoutContext).not.toHaveBeenCalled();
          }
        )
      );
    });
  });
});
