import fc from 'fast-check';
import prand from 'pure-rand';

import { ArrayArbitrary } from '../../../../src/arbitrary/_internals/ArrayArbitrary';
import { Value } from '../../../../src/check/arbitrary/definition/Value';
import { MaxLengthUpperBound } from '../../../../src/arbitrary/_internals/helpers/MaxLengthFromMinLength';
import { CustomSet } from '../../../../src/arbitrary/_internals/interfaces/CustomSet';
import { Stream } from '../../../../src/stream/Stream';
import { cloneMethod, hasCloneMethod } from '../../../../src/check/symbols';
import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { Random } from '../../../../src/random/generator/Random';

import * as IntegerMock from '../../../../src/arbitrary/integer';
import { fakeArbitrary } from '../__test-helpers__/ArbitraryHelpers';
import { fakeRandom } from '../__test-helpers__/RandomHelpers';
import { buildShrinkTree, walkTree } from '../__test-helpers__/ShrinkTree';
import * as DepthContextMock from '../../../../src/arbitrary/_internals/helpers/DepthContext';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('ArrayArbitrary', () => {
  describe('generate', () => {
    it('should concat all the generated values together when no set constraints ', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(fc.anything(), fc.anything())),
          fc.nat(),
          fc.nat(MaxLengthUpperBound),
          fc.nat(MaxLengthUpperBound),
          fc.anything(),
          (generatedValues, seed, aLength, bLength, integerContext) => {
            // Arrange
            const { acceptedValues, instance, generate } = prepareSetBuilderData(generatedValues, false);
            const { minLength, maxGeneratedLength, maxLength } = extractLengths(seed, aLength, bLength, acceptedValues);
            const { instance: integerInstance, generate: generateInteger } = fakeArbitrary();
            generateInteger.mockReturnValue(new Value(acceptedValues.size, integerContext));
            const integer = jest.spyOn(IntegerMock, 'integer');
            integer.mockReturnValue(integerInstance);
            const { instance: mrng } = fakeRandom();

            // Act
            const arb = new ArrayArbitrary(instance, minLength, maxGeneratedLength, maxLength, undefined);
            const g = arb.generate(mrng, undefined);

            // Assert
            expect(g.hasToBeCloned).toBe(false);
            expect(g.value).toEqual([...acceptedValues].map((v) => v.value));
            expect(integer).toHaveBeenCalledTimes(1);
            expect(integer).toHaveBeenCalledWith({ min: minLength, max: maxGeneratedLength });
            expect(generateInteger).toHaveBeenCalledTimes(1);
            expect(generateInteger).toHaveBeenCalledWith(mrng, undefined);
            expect(generate).toHaveBeenCalledTimes(acceptedValues.size);
            for (const call of generate.mock.calls) {
              expect(call).toEqual([mrng, undefined]);
            }
          }
        )
      );
    });

    it("should not concat all the values together in case they don't follow set contraints", () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(fc.anything(), fc.anything(), fc.boolean())),
          fc.nat(),
          fc.nat(MaxLengthUpperBound),
          fc.nat(MaxLengthUpperBound),
          fc.anything(),
          (generatedValues, seed, aLength, bLength, integerContext) => {
            // Arrange
            const { acceptedValues, instance, generate, setBuilder } = prepareSetBuilderData(generatedValues, false);
            const { minLength, maxGeneratedLength, maxLength } = extractLengths(seed, aLength, bLength, acceptedValues);
            const { instance: integerInstance, generate: generateInteger } = fakeArbitrary();
            generateInteger.mockReturnValue(new Value(acceptedValues.size, integerContext));
            const integer = jest.spyOn(IntegerMock, 'integer');
            integer.mockReturnValue(integerInstance);
            const { instance: mrng } = fakeRandom();

            // Act
            const arb = new ArrayArbitrary(instance, minLength, maxGeneratedLength, maxLength, undefined, setBuilder);
            const g = arb.generate(mrng, undefined);

            // Assert
            expect(g.hasToBeCloned).toBe(false);
            // In the case of set the generated value might be smaller
            // The generator is allowed to stop whenever it considers at already tried to many times (maxGeneratedLength times)
            expect(g.value).toEqual([...acceptedValues].map((v) => v.value).slice(0, g.value.length));
            expect(integer).toHaveBeenCalledTimes(1);
            expect(integer).toHaveBeenCalledWith({ min: minLength, max: maxGeneratedLength });
            expect(generateInteger).toHaveBeenCalledTimes(1);
            expect(generateInteger).toHaveBeenCalledWith(mrng, undefined);
            expect(setBuilder).toHaveBeenCalledTimes(1);
            for (const call of generate.mock.calls) {
              expect(call).toEqual([mrng, undefined]);
            }
          }
        )
      );
    });

    it("should always pass bias to values' arbitrary when minLength equals maxGeneratedLength", () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(fc.anything(), fc.anything(), fc.boolean())),
          fc.nat(),
          fc.nat(MaxLengthUpperBound),
          fc.anything(),
          fc.integer({ min: 2 }),
          fc.boolean(),
          (generatedValues, seed, aLength, integerContext, biasFactor, withSetBuilder) => {
            // Arrange
            const { acceptedValues, instance, setBuilder, generate } = prepareSetBuilderData(
              generatedValues,
              !withSetBuilder
            );
            const { minLength, maxLength } = extractLengths(seed, aLength, aLength, acceptedValues);
            const { instance: integerInstance, generate: generateInteger } = fakeArbitrary();
            generateInteger.mockReturnValue(new Value(minLength, integerContext));
            const integer = jest.spyOn(IntegerMock, 'integer');
            integer.mockReturnValue(integerInstance);
            const { instance: mrng } = fakeRandom();

            // Act
            const arb = new ArrayArbitrary(
              instance,
              minLength,
              minLength,
              maxLength,
              undefined,
              withSetBuilder ? setBuilder : undefined
            );
            const g = arb.generate(mrng, biasFactor);

            // Assert
            expect(g.hasToBeCloned).toBe(false);
            if (!withSetBuilder) {
              // In the case of set the generated value might be smaller
              // The generator is allowed to stop whenever it considers at already tried to many times (maxGeneratedLength times)
              expect(g.value).toEqual([...acceptedValues].map((v) => v.value).slice(0, minLength));
            } else {
              expect(g.value).toEqual(
                [...acceptedValues].map((v) => v.value).slice(0, Math.min(g.value.length, minLength))
              );
            }
            expect(integer).toHaveBeenCalledTimes(1);
            expect(integer).toHaveBeenCalledWith({ min: minLength, max: minLength });
            expect(generateInteger).toHaveBeenCalledTimes(1);
            expect(generateInteger).toHaveBeenCalledWith(mrng, undefined); // no need to bias it
            expect(setBuilder).toHaveBeenCalledTimes(withSetBuilder ? 1 : 0);
            expect(generate.mock.calls.length).toBeGreaterThanOrEqual(minLength);
            for (const call of generate.mock.calls) {
              expect(call).toEqual([mrng, biasFactor]); // but bias all sub-values
            }
          }
        )
      );
    });

    it('should bias depth the same way for any child and reset it at the end', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(fc.anything(), fc.anything(), fc.boolean())),
          fc.nat(),
          fc.nat(MaxLengthUpperBound),
          fc.nat(MaxLengthUpperBound),
          fc.anything(),
          fc.integer({ min: 2 }),
          fc.boolean(),
          (generatedValues, seed, aLength, bLength, integerContext, biasFactor, withSetBuilder) => {
            // Arrange
            const getDepthContextFor = jest.spyOn(DepthContextMock, 'getDepthContextFor');
            const depthContext = { depth: 0 };
            getDepthContextFor.mockReturnValue(depthContext);
            const seenDepths = new Set<number>();
            const { acceptedValues, instance, generate, setBuilder } = prepareSetBuilderData(
              generatedValues,
              !withSetBuilder,
              () => {
                seenDepths.add(depthContext.depth);
              }
            );
            const { minLength, maxGeneratedLength, maxLength } = extractLengths(seed, aLength, bLength, acceptedValues);
            const { instance: integerInstance, generate: generateInteger } = fakeArbitrary();
            generateInteger.mockReturnValue(new Value(minLength, integerContext));
            const integer = jest.spyOn(IntegerMock, 'integer');
            integer.mockReturnValue(integerInstance);
            const { instance: mrng } = fakeRandom();

            // Act
            const arb = new ArrayArbitrary(
              instance,
              minLength,
              maxGeneratedLength,
              maxLength,
              undefined,
              withSetBuilder ? setBuilder : undefined
            );
            arb.generate(mrng, biasFactor);

            // Assert
            expect(getDepthContextFor).toHaveBeenCalledTimes(1); // only array calls it in the test
            expect(depthContext.depth).toBe(0); // properly reset
            if (generate.mock.calls.length !== 0) {
              expect([...seenDepths]).toHaveLength(1); // always called with same depth
            } else {
              expect([...seenDepths]).toHaveLength(0); // never called on items
            }
          }
        )
      );
    });

    it('should produce a cloneable instance if provided one cloneable underlying', () => {
      // Arrange
      const { instance, generate } = fakeArbitrary<string[]>();
      generate
        .mockReturnValueOnce(new Value(['a'], undefined))
        .mockReturnValueOnce(new Value(Object.defineProperty(['b'], cloneMethod, { value: jest.fn() }), undefined))
        .mockReturnValueOnce(new Value(['c'], undefined))
        .mockReturnValueOnce(new Value(['d'], undefined));
      const { instance: integerInstance, generate: generateInteger } = fakeArbitrary();
      generateInteger.mockReturnValue(new Value(4, undefined));
      const integer = jest.spyOn(IntegerMock, 'integer');
      integer.mockReturnValue(integerInstance);
      const { instance: mrng } = fakeRandom();

      // Act
      const arb = new ArrayArbitrary(instance, 0, 10, 100, undefined);
      const g = arb.generate(mrng, undefined);

      // Assert
      expect(g.hasToBeCloned).toBe(true);
      expect(hasCloneMethod(g.value)).toBe(true);
      expect(g.value_).not.toEqual([['a'], ['b'], ['c'], ['d']]); // 2nd item is not just ['b']
      expect(g.value_.map((v) => [...v])).toEqual([['a'], ['b'], ['c'], ['d']]);
    });

    it('should not clone cloneable on generate', () => {
      // Arrange
      const cloneMethodImpl = jest.fn();
      const { instance, generate } = fakeArbitrary<string[]>();
      generate
        .mockReturnValueOnce(new Value(['a'], undefined))
        .mockReturnValueOnce(
          new Value(Object.defineProperty(['b'], cloneMethod, { value: cloneMethodImpl }), undefined)
        )
        .mockReturnValueOnce(new Value(['c'], undefined))
        .mockReturnValueOnce(new Value(['d'], undefined));
      const { instance: integerInstance, generate: generateInteger } = fakeArbitrary();
      generateInteger.mockReturnValue(new Value(4, undefined));
      const integer = jest.spyOn(IntegerMock, 'integer');
      integer.mockReturnValue(integerInstance);
      const { instance: mrng } = fakeRandom();

      // Act
      const arb = new ArrayArbitrary(instance, 0, 10, 100, undefined);
      const g = arb.generate(mrng, undefined);

      // Assert
      expect(cloneMethodImpl).not.toHaveBeenCalled();
      g.value; // not calling clone as this is the first access
      expect(cloneMethodImpl).not.toHaveBeenCalled();
      g.value; // calling clone as this is the second access
      expect(cloneMethodImpl).toHaveBeenCalledTimes(1);
      g.value; // calling clone (again) as this is the third access
      expect(cloneMethodImpl).toHaveBeenCalledTimes(2);
      g.value_; // not calling clone as we access value_ not value
      expect(cloneMethodImpl).toHaveBeenCalledTimes(2);
    });
  });

  describe('canShrinkWithoutContext', () => {
    it('should reject any array not matching the requirements on length', () => {
      fc.assert(
        fc.property(
          fc.array(fc.anything()),
          fc.boolean(),
          fc.nat(MaxLengthUpperBound),
          fc.nat(MaxLengthUpperBound),
          fc.nat(MaxLengthUpperBound),
          (value, withSetBuilder, aLength, bLength, cLength) => {
            // Arrange
            const [minLength, maxGeneratedLength, maxLength] = [aLength, bLength, cLength].sort((a, b) => a - b);
            fc.pre(value.length < minLength || value.length > maxLength);
            const { instance, canShrinkWithoutContext } = fakeArbitrary();
            const data: any[] = [];
            const customSet: CustomSet<Value<any>> = {
              size: () => data.length,
              getData: () => data,
              tryAdd: (vTest) => {
                data.push(vTest.value_);
                return true;
              },
            };
            const setBuilder = jest.fn();
            setBuilder.mockReturnValue(customSet);

            // Act
            const arb = new ArrayArbitrary(
              instance,
              minLength,
              maxGeneratedLength,
              maxLength,
              undefined,
              withSetBuilder ? setBuilder : undefined
            );
            const out = arb.canShrinkWithoutContext(value);

            // Assert
            expect(out).toBe(false);
            expect(canShrinkWithoutContext).not.toHaveBeenCalled();
            expect(setBuilder).not.toHaveBeenCalled();
          }
        )
      );
    });

    it('should reject any array with at least one entry rejected by the sub-arbitrary', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.tuple(fc.anything(), fc.boolean()), {
            minLength: 1,
            selector: (v) => v[0],
            comparator: 'SameValue',
          }),
          fc.boolean(),
          fc.nat(MaxLengthUpperBound),
          fc.nat(MaxLengthUpperBound),
          fc.nat(MaxLengthUpperBound),
          (value, withSetBuilder, offsetMin, offsetMax, maxGeneratedLength) => {
            // Arrange
            fc.pre(value.some((v) => !v[1]));
            const minLength = Math.min(Math.max(0, value.length - offsetMin), maxGeneratedLength);
            const maxLength = Math.max(Math.min(MaxLengthUpperBound, value.length + offsetMax), maxGeneratedLength);
            const { instance, canShrinkWithoutContext } = fakeArbitrary();
            canShrinkWithoutContext.mockImplementation((vTest) => value.find((v) => Object.is(v[0], vTest))![1]);
            const data: any[] = [];
            const customSet: CustomSet<Value<any>> = {
              size: () => data.length,
              getData: () => data,
              tryAdd: (vTest) => {
                data.push(vTest.value_);
                return true;
              },
            };
            const setBuilder = jest.fn();
            setBuilder.mockReturnValue(customSet);

            // Act
            const arb = new ArrayArbitrary(
              instance,
              minLength,
              maxGeneratedLength,
              maxLength,
              undefined,
              withSetBuilder ? setBuilder : undefined
            );
            const out = arb.canShrinkWithoutContext(value.map((v) => v[0]));

            // Assert
            expect(out).toBe(false);
            expect(canShrinkWithoutContext).toHaveBeenCalled();
          }
        )
      );
    });

    it('should reject any array not matching requirements for set constraints', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.tuple(fc.anything(), fc.boolean()), {
            minLength: 1,
            selector: (v) => v[0],
            comparator: 'SameValue',
          }),
          fc.nat(MaxLengthUpperBound),
          fc.nat(MaxLengthUpperBound),
          fc.nat(MaxLengthUpperBound),
          (value, offsetMin, offsetMax, maxGeneratedLength) => {
            // Arrange
            fc.pre(value.some((v) => !v[1]));
            const minLength = Math.min(Math.max(0, value.length - offsetMin), maxGeneratedLength);
            const maxLength = Math.max(Math.min(MaxLengthUpperBound, value.length + offsetMax), maxGeneratedLength);
            const { instance, canShrinkWithoutContext } = fakeArbitrary();
            canShrinkWithoutContext.mockReturnValue(true);
            const data: any[] = [];
            const customSet: CustomSet<Value<any>> = {
              size: () => data.length,
              getData: () => data,
              tryAdd: (vTest) => {
                if (value.find((v) => Object.is(v[0], vTest.value_))![1]) {
                  data.push(vTest.value_);
                  return true;
                }
                return false;
              },
            };
            const setBuilder = jest.fn();
            setBuilder.mockReturnValue(customSet);

            // Act
            const arb = new ArrayArbitrary(instance, minLength, maxGeneratedLength, maxLength, undefined, setBuilder);
            const out = arb.canShrinkWithoutContext(value.map((v) => v[0]));

            // Assert
            expect(out).toBe(false);
            expect(canShrinkWithoutContext).toHaveBeenCalled();
            expect(setBuilder).toHaveBeenCalled();
          }
        )
      );
    });

    it('should reject any sparse array', () => {
      fc.assert(
        fc.property(
          fc.sparseArray(fc.anything()),
          fc.boolean(),
          fc.nat(MaxLengthUpperBound),
          fc.nat(MaxLengthUpperBound),
          fc.nat(MaxLengthUpperBound),
          (value, withSetBuilder, offsetMin, offsetMax, maxGeneratedLength) => {
            // Arrange
            fc.pre(value.length !== Object.keys(value).length);
            const minLength = Math.min(Math.max(0, value.length - offsetMin), maxGeneratedLength);
            const maxLength = Math.max(Math.min(MaxLengthUpperBound, value.length + offsetMax), maxGeneratedLength);
            const { instance, canShrinkWithoutContext } = fakeArbitrary();
            canShrinkWithoutContext.mockReturnValue(true);
            const data: any[] = [];
            const customSet: CustomSet<Value<any>> = {
              size: () => data.length,
              getData: () => data,
              tryAdd: (vTest) => {
                data.push(vTest.value_);
                return true;
              },
            };
            const setBuilder = jest.fn();
            setBuilder.mockReturnValue(customSet);

            // Act
            const arb = new ArrayArbitrary(
              instance,
              minLength,
              maxGeneratedLength,
              maxLength,
              undefined,
              withSetBuilder ? setBuilder : undefined
            );
            const out = arb.canShrinkWithoutContext(value);

            // Assert
            expect(out).toBe(false);
          }
        )
      );
    });

    it('should accept all other arrays', () => {
      fc.assert(
        fc.property(
          fc.array(fc.anything()),
          fc.boolean(),
          fc.nat(MaxLengthUpperBound),
          fc.nat(MaxLengthUpperBound),
          fc.nat(MaxLengthUpperBound),
          (value, withSetBuilder, offsetMin, offsetMax, maxGeneratedLength) => {
            // Arrange
            const minLength = Math.min(Math.max(0, value.length - offsetMin), maxGeneratedLength);
            const maxLength = Math.max(Math.min(MaxLengthUpperBound, value.length + offsetMax), maxGeneratedLength);
            const { instance, canShrinkWithoutContext } = fakeArbitrary();
            canShrinkWithoutContext.mockReturnValue(true);
            const data: any[] = [];
            const customSet: CustomSet<Value<any>> = {
              size: () => data.length,
              getData: () => data,
              tryAdd: (vTest) => {
                data.push(vTest.value_);
                return true;
              },
            };
            const setBuilder = jest.fn();
            setBuilder.mockReturnValue(customSet);

            // Act
            const arb = new ArrayArbitrary(
              instance,
              minLength,
              maxGeneratedLength,
              maxLength,
              undefined,
              withSetBuilder ? setBuilder : undefined
            );
            const out = arb.canShrinkWithoutContext(value);

            // Assert
            expect(out).toBe(true);
          }
        )
      );
    });
  });
});

describe('ArrayArbitrary (integration)', () => {
  it('should not re-use twice the same instance of cloneable', () => {
    // Arrange
    const alreadySeenCloneable = new Set<unknown>();
    const mrng = new Random(prand.mersenne(0));
    const arb = new ArrayArbitrary(new CloneableArbitrary(), 0, 5, 100, undefined); // 0 to 5 generated items

    // Act
    let g = arb.generate(mrng, undefined);
    while (g.value.length !== 3) {
      // 3 allows to shrink something large enough but not too large
      // walking through the tree when >3 takes much longer
      g = arb.generate(mrng, undefined);
    }
    const treeA = buildShrinkTree(arb, g);
    const treeB = buildShrinkTree(arb, g);

    // Assert
    walkTree(treeA, (cloneable) => {
      expect(alreadySeenCloneable.has(cloneable)).toBe(false);
      alreadySeenCloneable.add(cloneable);
      for (const subCloneable of cloneable) {
        expect(alreadySeenCloneable.has(subCloneable)).toBe(false);
        alreadySeenCloneable.add(subCloneable);
      }
    });
    walkTree(treeB, (cloneable) => {
      expect(alreadySeenCloneable.has(cloneable)).toBe(false);
      alreadySeenCloneable.add(cloneable);
      for (const subCloneable of cloneable) {
        expect(alreadySeenCloneable.has(subCloneable)).toBe(false);
        alreadySeenCloneable.add(subCloneable);
      }
    });
  });
});

// Helpers

function prepareSetBuilderData(
  generatedValues: [value: any, context: any, rejected?: boolean][],
  acceptAll: boolean,
  onGenerateHook?: () => void
) {
  const acceptedValues = new Set<Value<any>>();
  const { instance, generate } = fakeArbitrary();
  for (const v of generatedValues) {
    const value = new Value(v[0], v[1]);
    const rejected = v[2];
    if (!rejected || acceptAll) {
      acceptedValues.add(value);
    }
    generate.mockImplementationOnce(() => {
      if (onGenerateHook !== undefined) {
        onGenerateHook();
      }
      return value;
    });
  }
  const data: any[] = [];
  const customSet: CustomSet<Value<any>> = {
    size: () => data.length,
    getData: () => data,
    tryAdd: (value) => {
      if (acceptedValues.has(value)) {
        data.push(value);
        return true;
      }
      return false;
    },
  };
  const setBuilder = jest.fn();
  setBuilder.mockReturnValue(customSet);
  return { acceptedValues, instance, generate, setBuilder };
}

function extractLengths(minLengthSeed: number, aLength: number, bLength: number, acceptedValues: Set<unknown>) {
  const minLength = minLengthSeed % (acceptedValues.size || 1);
  const [maxGeneratedLength, maxLength] = aLength < bLength ? [aLength, bLength] : [bLength, aLength];
  fc.pre(maxGeneratedLength >= acceptedValues.size);
  return { minLength, maxGeneratedLength, maxLength };
}

class CloneableArbitrary extends Arbitrary<number[]> {
  private instance() {
    return Object.defineProperty([], cloneMethod, { value: () => this.instance() });
  }
  generate(_mrng: Random): Value<number[]> {
    return new Value(this.instance(), { shrunkOnce: false });
  }
  canShrinkWithoutContext(_value: unknown): _value is number[] {
    throw new Error('No call expected in that scenario');
  }
  shrink(value: number[], context?: unknown): Stream<Value<number[]>> {
    if (typeof context !== 'object' || context === null || !('shrunkOnce' in context)) {
      throw new Error('Invalid context for CloneableArbitrary');
    }
    const safeContext = context as { shrunkOnce: boolean };
    if (safeContext.shrunkOnce) {
      return Stream.nil();
    }
    return Stream.of(new Value(this.instance(), { shrunkOnce: true }));
  }
}
