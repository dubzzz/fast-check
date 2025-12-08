import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from '../__test-helpers__/ArbitraryAssertions';
import type { EntityRelations, Relationship } from '../../../../src/arbitrary/_internals/interfaces/EntityGraphTypes';
import { onTheFlyLinksForEntityGraph } from '../../../../src/arbitrary/_internals/OnTheFlyLinksForEntityGraphArbitrary';
import type { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';

type UnArbitrary<T> = T extends Arbitrary<infer U> ? U : never;

const withNullPrototype = <T>(value: T): T => Object.assign(Object.create(null), value);

describe('onTheFlyLinksForEntityGraph (integration)', () => {
  type Kind = 'kind-a' | 'kind-b' | 'kind-c' | 'kind-d';
  type EntityFields = Record<Kind, unknown>; // no need for more accurate type
  type Extra = { configurations: EntityRelations<EntityFields>; defaultEntities: Kind[] };

  const allKinds = ['kind-a', 'kind-b', 'kind-c', 'kind-d'] as const;
  const extraParametersOneEntityRelations: fc.Arbitrary<EntityRelations<EntityFields>[Kind]> = fc.dictionary(
    fc.string(),
    fc.oneof(
      fc.record<Relationship<Kind>>({
        arity: fc.constantFrom('0-1', '1', 'many'),
        type: fc.constantFrom(...allKinds),
      }),
    ),
    { size: '-1' },
  );
  const extraParameters: fc.Arbitrary<Extra> = fc.record({
    configurations: fc.record(Object.fromEntries(allKinds.map((kind) => [kind, extraParametersOneEntityRelations]))),
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
