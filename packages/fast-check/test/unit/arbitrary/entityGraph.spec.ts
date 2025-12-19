import { describe, it, expect } from 'vitest';
import fc, { stringify } from 'fast-check';
import { string } from '../../../src/arbitrary/string.js';
import { entityGraph } from '../../../src/arbitrary/entityGraph.js';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/ArbitraryAssertions.js';
import type { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary.js';

enum WithValues {
  No,
  ForwardOnly,
  ForwardAndReverse,
}

type UnArbitrary<T> = T extends Arbitrary<infer U> ? U : never;

const withValuesArbitrary = fc.constantFrom(WithValues.No, WithValues.ForwardOnly, WithValues.ForwardAndReverse);
const expectUndefined = expect.toSatisfy((v) => v === undefined, 'be undefined');

describe('entityGraph (integration)', () => {
  describe('organization', () => {
    type Extra = { withZeroOrOne: WithValues; withExactlyOne: WithValues; withMany: WithValues };
    const extraParameters: fc.Arbitrary<Extra> = fc.record({
      withZeroOrOne: withValuesArbitrary,
      withExactlyOne: withValuesArbitrary,
      withMany: withValuesArbitrary,
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
            ...(extra.withZeroOrOne !== WithValues.No ? { manager: { arity: '0-1', type: 'employee' } } : {}),
            ...(extra.withZeroOrOne === WithValues.ForwardAndReverse
              ? { managees: { arity: 'inverse', type: 'employee', forwardRelationship: 'manager' } }
              : {}),
            ...(extra.withExactlyOne !== WithValues.No ? { team: { arity: '1', type: 'team' } } : {}),
            ...(extra.withMany !== WithValues.No ? { competencies: { arity: 'many', type: 'competency' } } : {}),
          },
          team: {
            ...(extra.withExactlyOne !== WithValues.No ? { department: { arity: '1', type: 'department' } } : {}),
            ...(extra.withExactlyOne === WithValues.ForwardAndReverse
              ? { members: { arity: 'inverse', type: 'employee', forwardRelationship: 'team' } }
              : {}),
          },
          department: {
            ...(extra.withExactlyOne === WithValues.ForwardAndReverse
              ? { teams: { arity: 'inverse', type: 'team', forwardRelationship: 'department' } }
              : {}),
          },
          competency: {
            ...(extra.withMany === WithValues.ForwardAndReverse
              ? { employees: { arity: 'inverse', type: 'employee', forwardRelationship: 'competencies' } }
              : {}),
          },
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
          ...(extra.withZeroOrOne !== WithValues.No
            ? { manager: expect.toBeOneOf([expectUndefined, expect.any(Object)]) }
            : {}),
          ...(extra.withZeroOrOne === WithValues.ForwardAndReverse ? { managees: expect.any(Array) } : {}),
          ...(extra.withExactlyOne !== WithValues.No ? { team: expect.any(Object) } : {}),
          ...(extra.withMany !== WithValues.No ? { competencies: expect.any(Array) } : {}),
        });
        // Cross-references
        if ('manager' in employee) {
          const manager = employee.manager as unknown as (typeof value)['employee'][number];
          expect(manager).toSatisfy(
            (manager) => manager === undefined || allEmployees.has(manager),
            'manager from allEmployees',
          );
          if (manager !== undefined && 'managees' in manager) {
            expect(manager.managees).toSatisfy(
              (managees) => managees.includes(employee),
              'manager has the employee as a managee',
            );
          }
        }
        if ('managees' in employee) {
          for (const managee of employee.managees as unknown as (typeof value)['employee']) {
            expect(managee).toSatisfy((managee) => allEmployees.has(managee), 'managee from allEmployees');
            expect(managee.manager, 'managee defines the right manager').toBe(employee);
          }
        }
        if ('team' in employee) {
          const team = employee.team as unknown as (typeof value)['team'][number];
          expect(team).toSatisfy((team) => allTeams.has(team), 'team from allTeams');
          if ('members' in team) {
            expect(team.members).toSatisfy(
              (members) => members.includes(employee),
              'team has the employee as a member',
            );
          }
        }
        if ('competencies' in employee) {
          const competencies = employee.competencies as unknown as (typeof value)['competency'];
          for (const competency of competencies) {
            expect(competency).toSatisfy(
              (competency) => allCompetencies.has(competency),
              'competency from allCompetencies',
            );
            if ('employees' in competency) {
              expect(competency.employees).toSatisfy(
                (members) => members.includes(employee),
                'competency has the employee as an employee',
              );
            }
          }
        }
      }
      // Checking teams
      for (const team of value.team) {
        // Basic structure
        expect(team).toStrictEqual({
          name: expect.any(String),
          ...(extra.withExactlyOne !== WithValues.No ? { department: expect.any(Object) } : {}),
          ...(extra.withExactlyOne === WithValues.ForwardAndReverse ? { members: expect.any(Array) } : {}),
        });
        // Cross-references
        if ('department' in team) {
          const department = team.department as unknown as (typeof value)['department'][number];
          expect(department).toSatisfy(
            (department) => allDepartments.has(department),
            'department from allDepartments',
          );
          if ('teams' in department) {
            expect(department.teams).toSatisfy((teams) => teams.includes(team), 'department has the team as a team');
          }
        }
        if ('members' in team) {
          for (const member of team.members as unknown as (typeof value)['employee']) {
            expect(member).toSatisfy((member) => allEmployees.has(member), 'member from allEmployees');
            expect(member.team, 'member defines the right team').toBe(team);
          }
        }
      }
      // Checking departments
      for (const department of value.department) {
        // Basic structure
        expect(department).toStrictEqual({
          name: expect.any(String),
          ...(extra.withExactlyOne === WithValues.ForwardAndReverse ? { teams: expect.any(Array) } : {}),
        });
        // Cross-references
        if ('teams' in department) {
          for (const team of department.teams as unknown as (typeof value)['team']) {
            expect(team).toSatisfy((team) => allTeams.has(team), 'team from allTeams');
            expect(team.department, 'team defines the right department').toBe(department);
          }
        }
      }
      // Checking competencies
      for (const competency of value.competency) {
        // Basic structure
        expect(competency).toStrictEqual({
          name: expect.any(String),
          ...(extra.withMany === WithValues.ForwardAndReverse ? { employees: expect.any(Array) } : {}),
        });
        // Cross-references
        if ('employees' in competency) {
          for (const employee of competency.employees as unknown as (typeof value)['employee']) {
            expect(employee).toSatisfy((employee) => allEmployees.has(employee), 'employee from allEmployees');
            expect(employee.competencies).toSatisfy(
              (competencies) => competencies.includes(competency),
              'employee defines the right competency',
            );
          }
        }
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
