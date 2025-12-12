import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from '../__test-helpers__/ArbitraryAssertions.js';
import type {
  EntityRelations,
  Relationship,
} from '../../../../src/arbitrary/_internals/interfaces/EntityGraphTypes.js';
import { onTheFlyLinksForEntityGraph } from '../../../../src/arbitrary/_internals/OnTheFlyLinksForEntityGraphArbitrary.js';
import type { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary.js';

type UnArbitrary<T> = T extends Arbitrary<infer U> ? U : never;

const withNullPrototype = <T>(value: T): T => Object.assign(Object.create(null), value);

describe('onTheFlyLinksForEntityGraph (integration)', () => {
  // Remark: kind-e is always referred to with an exclusive strategy
  type Kind = 'kind-a' | 'kind-b' | 'kind-c' | 'kind-d' | 'kind-e';
  type EntityFields = Record<Kind, unknown>; // no need for more accurate type
  type Extra = { configurations: EntityRelations<EntityFields>; defaultEntities: Kind[] };

  const allKinds = ['kind-a', 'kind-b', 'kind-c', 'kind-d', 'kind-e'] as const;
  const extraParametersOneEntityRelations = (kind: Kind): fc.Arbitrary<EntityRelations<EntityFields>[Kind]> =>
    fc.dictionary(
      fc.string(),
      fc.oneof(
        {
          arbitrary: fc
            .record<Relationship<Kind>>({
              arity: fc.constantFrom('0-1', '1', 'many'),
              type: fc.constantFrom(...allKinds),
              strategy: fc.constantFrom(undefined, 'any'),
            })
            .map((rel): Relationship<Kind> => (rel.type === 'kind-e' ? { ...rel, strategy: 'exclusive' } : rel)),
          weight: allKinds.length,
        },
        {
          arbitrary: fc.record<Relationship<Kind>>({
            arity: fc.constant('0-1'), // arity of 1 forbidden for successor, arity of many is allowed but may lead to very deep structures
            type: fc.constant(kind),
            strategy: fc.constant('successor'),
          }),
          weight: 1,
        },
      ),
      { size: '-1' },
    );
  const extraParameters: fc.Arbitrary<Extra> = fc.record({
    configurations: fc.record(
      Object.fromEntries(
        allKinds.map((kind) =>
          kind === 'kind-e' ? [kind, fc.constant({})] : [kind, extraParametersOneEntityRelations(kind)],
        ),
      ),
    ),
    defaultEntities: fc.array(fc.constantFrom(...allKinds)),
  });

  const isCorrect = (value: UnArbitrary<ReturnType<typeof onTheFlyLinksForEntityGraphBuilder>>, extra: Extra) => {
    // At least as many entities as requested via defaultEntities
    for (const kind of allKinds) {
      const expectAtLeast = extra.defaultEntities.filter((e) => e === kind).length;
      expect(
        value[kind].length,
        `the number of entities of type ${kind} should be >= than the number being requested via defaultEntities`,
      ).toBeGreaterThanOrEqual(expectAtLeast);
    }
    // Valid links leading to existing entries
    for (const kind of allKinds) {
      const requestedConfiguration = extra.configurations[kind];
      const expectedStructureSoft = Object.fromEntries(
        Object.entries(requestedConfiguration).map(([name, relation]) => [
          name,
          {
            type: relation.type,
            index: expect.toSatisfy(
              (index: number[] | number | undefined) =>
                index === undefined || typeof index === 'number' || Array.isArray(index),
              'legit index: undefiend or number or number[]',
            ),
          },
        ]),
      );
      const expectedStructureComplete = Object.fromEntries(
        Object.entries(requestedConfiguration).map(([name, relation]) => [
          name,
          relation.arity === '0-1'
            ? {
                type: relation.type,
                index: expect.toSatisfy(
                  (index: number | undefined) => index === undefined || value[relation.type][index] !== undefined,
                  'valid index: either undefined or within the range',
                ),
              }
            : relation.arity === '1'
              ? {
                  type: relation.type,
                  index: expect.toSatisfy(
                    (index: number) => value[relation.type][index] !== undefined,
                    'valid index: within the range',
                  ),
                }
              : {
                  type: relation.type,
                  index: expect.toSatisfy((indices: number[]) =>
                    indices.every((index) => value[relation.type][index] !== undefined),
                  ),
                },
        ]),
      );
      for (const entity of value[kind]) {
        expect(entity).toStrictEqual(withNullPrototype(expectedStructureSoft));
        expect(entity).toStrictEqual(withNullPrototype(expectedStructureComplete));
      }
    }
    // Properly implement strategy successor when requested
    for (const kind of allKinds) {
      const requestedConfiguration = extra.configurations[kind];
      for (const fieldName in requestedConfiguration) {
        const relation = requestedConfiguration[fieldName];
        if (relation.strategy !== 'successor') {
          continue;
        }
        for (let entityIndex = 0; entityIndex !== value[kind].length; ++entityIndex) {
          const entity = value[kind][entityIndex];
          const fieldIndices: number[] =
            entity[fieldName].index === undefined
              ? []
              : typeof entity[fieldName].index === 'number'
                ? [entity[fieldName].index]
                : entity[fieldName].index;
          expect(fieldIndices).toSatisfy(
            (fieldIndices: number[]) => fieldIndices.every((index) => index > entityIndex),
            `all indices for ${kind}[${JSON.stringify(fieldName)}] must be >${entityIndex} for the entity at index ${entityIndex}`,
          );
        }
      }
    }
    // Properly implement strategy exclusive when requested
    // by design of this test: any entity of kind-e
    const referencesToKindE: number[] = [];
    for (const kind of allKinds) {
      const requestedConfiguration = extra.configurations[kind];
      for (const fieldName in requestedConfiguration) {
        const relation = requestedConfiguration[fieldName];
        if (relation.strategy !== 'exclusive') {
          continue;
        }
        for (const entity of value[kind]) {
          const fieldIndices: number[] =
            entity[fieldName].index === undefined
              ? []
              : typeof entity[fieldName].index === 'number'
                ? [entity[fieldName].index]
                : entity[fieldName].index;
          for (const index of fieldIndices) {
            referencesToKindE.push(index);
          }
        }
      }
    }
    expect(referencesToKindE, 'strategy exclusive properly applied').toHaveLength(new Set(referencesToKindE).size);
  };

  const onTheFlyLinksForEntityGraphBuilder = (extra: Extra) =>
    onTheFlyLinksForEntityGraph(extra.configurations, extra.defaultEntities);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(onTheFlyLinksForEntityGraphBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(onTheFlyLinksForEntityGraphBuilder, isCorrect, { extraParameters });
  });
});
