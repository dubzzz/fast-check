import { describe, it, expect } from 'vitest';
import fc, { stringify } from 'fast-check';
import { string } from '../../../src/arbitrary/string';
import { entityGraph } from '../../../src/arbitrary/entityGraph';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/ArbitraryAssertions';
import type { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';

type UnArbitrary<T> = T extends Arbitrary<infer U> ? U : never;

const expectUndefined = expect.toSatisfy((v) => v === undefined, 'be undefined');

describe('entityGraph (integration)', () => {
  describe('organization', () => {
    type Extra = { withZeroOrOne: boolean; withExactlyOne: boolean; withMany: boolean };
    const extraParameters: fc.Arbitrary<Extra> = fc.record({
      withZeroOrOne: fc.boolean(),
      withExactlyOne: fc.boolean(),
      withMany: fc.boolean(),
    });

    const entityGraphBuilder = (extra: Extra) => {
      return entityGraph(
        {
          employee: { firstName: string(), lastName: string() },
          team: { name: string() },
          department: { name: string() },
          competency: { name: string() },
        },
        {
          employee: {
            ...(extra.withZeroOrOne ? { manager: { arity: '0-1', type: 'employee' } } : {}),
            ...(extra.withExactlyOne ? { team: { arity: '1', type: 'team' } } : {}),
            ...(extra.withMany ? { competencies: { arity: 'many', type: 'competency' } } : {}),
          },
          team: {
            ...(extra.withExactlyOne ? { department: { arity: '1', type: 'department' } } : {}),
          },
          department: {},
          competency: {},
        },
        {
          noNullPrototype: true,
        },
      );
    };

    const isEqual = (
      value1: UnArbitrary<ReturnType<typeof entityGraphBuilder>>,
      value2: UnArbitrary<ReturnType<typeof entityGraphBuilder>>,
      _extra: Extra,
    ) => {
      // WARNING:
      // Expecting toStrictEqual on cyclic values does not seem to be well supported.
      // It may lead to infinite loops.
      expect(Object.keys(value2)).toEqual(Object.keys(value1));
      expect(stringify(value2)).toBe(stringify(value1));
    };

    const isCorrect = (value: UnArbitrary<ReturnType<typeof entityGraphBuilder>>, extra: Extra) => {
      const allEmployees = new Set(value.employee);
      const allTeams = new Set(value.team);
      const allDepartments = new Set(value.department);
      const allCompetencies = new Set(value.competency);
      // Checking basic structure
      expect(value).toStrictEqual({
        employee: expect.any(Array),
        team: expect.any(Array),
        department: expect.any(Array),
        competency: expect.any(Array),
      });
      // Checking employees
      for (const employee of value.employee) {
        // Basic structure
        expect(employee).toStrictEqual({
          firstName: expect.any(String),
          lastName: expect.any(String),
          ...(extra.withZeroOrOne ? { manager: expect.toBeOneOf([expectUndefined, expect.any(Object)]) } : {}),
          ...(extra.withExactlyOne ? { team: expect.any(Object) } : {}),
          ...(extra.withMany ? { competencies: expect.any(Array) } : {}),
        });
        // Cross-references
        if ('manager' in employee) {
          expect(employee.manager).toSatisfy(
            (manager) => manager === undefined || allEmployees.has(manager),
            'manager from allEmployees',
          );
        }
        if ('team' in employee) {
          expect(employee.team).toSatisfy((team) => allTeams.has(team), 'team from allTeams');
        }
        if ('competencies' in employee) {
          for (const competency of employee.competencies as any) {
            expect(competency).toSatisfy(
              (competency) => allCompetencies.has(competency),
              'compentency from allCompetencies',
            );
          }
        }
      }
      // Checking teams
      for (const team of value.team) {
        // Basic structure
        expect(team).toStrictEqual({
          name: expect.any(String),
          ...(extra.withExactlyOne ? { department: expect.any(Object) } : {}),
        });
        // Cross-references
        if ('department' in team) {
          expect(team.department).toSatisfy(
            (department) => allDepartments.has(department),
            'department from allDepartments',
          );
        }
      }
      // Checking departments
      for (const department of value.department) {
        // Basic structure
        expect(department).toStrictEqual({
          name: expect.any(String),
        });
      }
      // Checking competencies
      for (const competency of value.competency) {
        // Basic structure
        expect(competency).toStrictEqual({
          name: expect.any(String),
        });
      }
      return true;
    };

    it('should produce the same values given the same seed', () => {
      assertProduceSameValueGivenSameSeed(entityGraphBuilder, { isEqual, extraParameters });
    });

    it('should only produce correct values', () => {
      assertProduceCorrectValues(entityGraphBuilder, isCorrect, { extraParameters });
    });
  });

  describe('graph', () => {
    type Extra = {};
    const extraParameters: fc.Arbitrary<Extra> = fc.record({});

    const graphBuilder = (_extra: Extra) => {
      return entityGraph(
        { node: { id: string() } },
        { node: { linkTo: { arity: 'many', type: 'node' } } },
        { noNullPrototype: true },
      );
    };

    const isEqual = (
      value1: UnArbitrary<ReturnType<typeof graphBuilder>>,
      value2: UnArbitrary<ReturnType<typeof graphBuilder>>,
      _extra: Extra,
    ) => {
      // WARNING:
      // Expecting toStrictEqual on cyclic values does not seem to be well supported.
      // It may lead to infinite loops.
      expect(Object.keys(value2)).toEqual(Object.keys(value1));
      const toId = (node: UnArbitrary<ReturnType<typeof graphBuilder>>['node'][number]) => node.id;
      expect(value2.node.map(toId)).toEqual(value1.node.map(toId));
      const toLinkedIds = (node: UnArbitrary<ReturnType<typeof graphBuilder>>['node'][number]) => node.linkTo.map(toId);
      expect(value2.node.map(toLinkedIds)).toEqual(value1.node.map(toLinkedIds));
      expect(stringify(value2)).toBe(stringify(value1));
    };

    const isCorrect = (value: UnArbitrary<ReturnType<typeof graphBuilder>>, _extra: Extra) => {
      const allNodes = new Set(value.node);
      // Checking basic structure
      expect(value).toStrictEqual({ node: expect.any(Array) });
      // Checking nodes
      for (const node of value.node) {
        // Basic structure
        expect(node).toStrictEqual({ id: expect.any(String), linkTo: expect.any(Array) });
        // Cross-references
        for (const subNode of node.linkTo) {
          expect(subNode).toSatisfy((subNode) => allNodes.has(subNode), 'subNode from allNodes');
        }
      }
      return true;
    };

    it('should produce the same values given the same seed', () => {
      assertProduceSameValueGivenSameSeed(graphBuilder, { isEqual, extraParameters });
    });

    it('should only produce correct values', () => {
      assertProduceCorrectValues(graphBuilder, isCorrect, { extraParameters });
    });
  });
});
