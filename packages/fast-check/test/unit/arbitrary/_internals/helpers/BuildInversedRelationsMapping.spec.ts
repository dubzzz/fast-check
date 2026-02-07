import { describe, it, expect } from 'vitest';
import { buildInversedRelationsMapping } from '../../../../../src/arbitrary/_internals/helpers/BuildInversedRelationsMapping.js';
import type { EntityRelations } from '../../../../../src/arbitrary/_internals/interfaces/EntityGraphTypes.js';

describe('buildInversedRelationsMapping', () => {
  it('should return empty map when no inverse relationships are defined', () => {
    // Arrange
    type EntityFields = { employee: {}; team: {} };
    const relations: EntityRelations<EntityFields> = {
      employee: {
        team: { arity: '1', type: 'team' },
      },
      team: {},
    };

    // Act
    const result = buildInversedRelationsMapping(relations);

    // Assert
    expect(result).toEqual(new Map());
  });

  it('should build mapping for simple inverse relationship with arity 1 forward relationship', () => {
    // Arrange
    type EntityFields = { employee: {}; team: {} };
    const relations: EntityRelations<EntityFields> = {
      employee: {
        team: { arity: '1', type: 'team' },
      },
      team: {
        members: { arity: 'inverse', type: 'employee', forwardRelationship: 'team' },
      },
    };

    // Act
    const result = buildInversedRelationsMapping(relations);

    // Assert
    expect(result).toEqual(new Map([[relations.employee.team, { type: 'team', property: 'members' }]]));
  });

  it('should build mapping for inverse relationship with arity 0-1 forward relationship', () => {
    // Arrange
    type EntityFields = { employee: {} };
    const relations: EntityRelations<EntityFields> = {
      employee: {
        manager: { arity: '0-1', type: 'employee' },
        managees: { arity: 'inverse', type: 'employee', forwardRelationship: 'manager' },
      },
    };

    // Act
    const result = buildInversedRelationsMapping(relations);

    // Assert
    expect(result).toEqual(new Map([[relations.employee.manager, { type: 'employee', property: 'managees' }]]));
  });

  it('should build mapping for inverse relationship with arity many forward relationship', () => {
    // Arrange
    type EntityFields = { employee: {}; competency: {} };
    const relations: EntityRelations<EntityFields> = {
      employee: {
        competencies: { arity: 'many', type: 'competency' },
      },
      competency: {
        employees: { arity: 'inverse', type: 'employee', forwardRelationship: 'competencies' },
      },
    };

    // Act
    const result = buildInversedRelationsMapping(relations);

    // Assert
    expect(result).toEqual(new Map([[relations.employee.competencies, { type: 'competency', property: 'employees' }]]));
  });

  it('should build mapping for multiple inverse relationships on different types', () => {
    // Arrange
    type EntityFields = { employee: {}; team: {}; department: {} };
    const relations: EntityRelations<EntityFields> = {
      employee: {
        team: { arity: '1', type: 'team' },
      },
      team: {
        department: { arity: '1', type: 'department' },
        members: { arity: 'inverse', type: 'employee', forwardRelationship: 'team' },
      },
      department: {
        teams: { arity: 'inverse', type: 'team', forwardRelationship: 'department' },
      },
    };

    // Act
    const result = buildInversedRelationsMapping(relations);

    // Assert
    expect(result).toEqual(
      new Map([
        [relations.employee.team, { type: 'team', property: 'members' }],
        [relations.team.department, { type: 'department', property: 'teams' }],
      ]),
    );
  });

  it('should throw error when multiple inverse relationships target the same forward relationship', () => {
    // Arrange
    type EntityFields = { employee: {}; team: {} };
    const relations: EntityRelations<EntityFields> = {
      employee: {
        team: { arity: '1', type: 'team' },
      },
      team: {
        members: { arity: 'inverse', type: 'employee', forwardRelationship: 'team' },
        employees: { arity: 'inverse', type: 'employee', forwardRelationship: 'team' },
      },
    };

    // Act & Assert
    expect(() => buildInversedRelationsMapping(relations)).toThrow();
  });

  it('should throw error when inverse relationship type does not match forward relationship target type', () => {
    // Arrange
    type EntityFields = { employee: {}; team: {}; department: {} };
    const relations: EntityRelations<EntityFields> = {
      employee: {
        myTeam: { arity: '1', type: 'team' },
      },
      team: {},
      department: {
        members: { arity: 'inverse', type: 'employee', forwardRelationship: 'myTeam' },
      },
    };

    // Act & Assert
    expect(() => buildInversedRelationsMapping(relations)).toThrow();
  });

  it('should throw error when inverse relationship has no matching forward relationship', () => {
    // Arrange
    type EntityFields = { employee: {}; team: {} };
    const relations: EntityRelations<EntityFields> = {
      employee: {},
      team: {
        members: { arity: 'inverse', type: 'employee', forwardRelationship: 'team' },
      },
    };

    // Act & Assert
    expect(() => buildInversedRelationsMapping(relations)).toThrow();
  });

  it('should throw error when forward relationship name does not exist on target type', () => {
    // Arrange
    type EntityFields = { employee: {}; team: {} };
    const relations: EntityRelations<EntityFields> = {
      employee: {
        team: { arity: '1', type: 'team' },
      },
      team: {
        members: { arity: 'inverse', type: 'employee', forwardRelationship: 'nonexistent' },
      },
    };

    // Act & Assert
    expect(() => buildInversedRelationsMapping(relations)).toThrow();
  });
});
