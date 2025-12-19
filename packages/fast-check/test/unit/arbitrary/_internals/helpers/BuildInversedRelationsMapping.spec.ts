import { describe, it, expect } from 'vitest';
import {
  buildInversedRelationsMapping,
  type InversedRelationsEntry,
} from '../../../../../src/arbitrary/_internals/helpers/BuildInversedRelationsMapping.js';
import type { EntityRelations, Relationship } from '../../../../../src/arbitrary/_internals/interfaces/EntityGraphTypes.js';

describe('buildInversedRelationsMapping', () => {
  it('should return empty map when no inverse relationships are defined', () => {
    // Arrange
    type EntityFields = {
      employee: { firstName: string; lastName: string };
      team: { name: string };
    };
    const relations: EntityRelations<EntityFields> = {
      employee: {
        team: { arity: '1', type: 'team' },
      },
      team: {},
    };

    // Act
    const result = buildInversedRelationsMapping(relations);

    // Assert
    expect(result.size).toBe(0);
  });

  it('should build mapping for bidirectional inverse relationships', () => {
    // Arrange
    type EntityFields = {
      employee: { firstName: string };
      team: { name: string };
    };
    const relations: EntityRelations<EntityFields> = {
      employee: {
        teams: { arity: 'inverse', type: 'team', forwardRelationship: 'members' },
      },
      team: {
        members: { arity: 'inverse', type: 'employee', forwardRelationship: 'teams' },
      },
    };

    // Act
    const result = buildInversedRelationsMapping(relations);

    // Assert
    expect(result.size).toBe(2);
  });

  it('should build mapping for self-referential bidirectional inverse relationships', () => {
    // Arrange
    type EntityFields = {
      employee: { firstName: string };
    };
    const relations: EntityRelations<EntityFields> = {
      employee: {
        managers: { arity: 'inverse', type: 'employee', forwardRelationship: 'subordinates' },
        subordinates: { arity: 'inverse', type: 'employee', forwardRelationship: 'managers' },
      },
    };

    // Act
    const result = buildInversedRelationsMapping(relations);

    // Assert
    expect(result.size).toBe(2);
    
    // Verify the mapping by checking all entries
    const entries = Array.from(result.entries());
    expect(entries).toHaveLength(2);
    
    // Find the entry for 'managers' forward relationship
    const managersEntry = entries.find(([relation]) => relation.forwardRelationship === 'subordinates');
    expect(managersEntry).toBeDefined();
    expect(managersEntry![1]).toEqual({ type: 'employee', property: 'subordinates' });
    
    // Find the entry for 'subordinates' forward relationship
    const subordinatesEntry = entries.find(([relation]) => relation.forwardRelationship === 'managers');
    expect(subordinatesEntry).toBeDefined();
    expect(subordinatesEntry![1]).toEqual({ type: 'employee', property: 'managers' });
  });

  it('should build mapping for multiple pairs of bidirectional inverse relationships', () => {
    // Arrange
    type EntityFields = {
      employee: { firstName: string };
      team: { name: string };
      department: { name: string };
    };
    const relations: EntityRelations<EntityFields> = {
      employee: {
        teams: { arity: 'inverse', type: 'team', forwardRelationship: 'members' },
      },
      team: {
        members: { arity: 'inverse', type: 'employee', forwardRelationship: 'teams' },
        departments: { arity: 'inverse', type: 'department', forwardRelationship: 'teams' },
      },
      department: {
        teams: { arity: 'inverse', type: 'team', forwardRelationship: 'departments' },
      },
    };

    // Act
    const result = buildInversedRelationsMapping(relations);

    // Assert
    expect(result.size).toBe(4);
  });

  it('should throw error when multiple inverse relationships target the same forward relationship', () => {
    // Arrange
    type EntityFields = {
      employee: { firstName: string };
      team: { name: string };
    };
    const relations: EntityRelations<EntityFields> = {
      employee: {
        teams1: { arity: 'inverse', type: 'team', forwardRelationship: 'members' },
        teams2: { arity: 'inverse', type: 'team', forwardRelationship: 'members' },
      },
      team: {
        members: { arity: 'inverse', type: 'employee', forwardRelationship: 'teams1' },
      },
    };

    // Act & Assert
    expect(() => buildInversedRelationsMapping(relations)).toThrow(
      'Cannot declare multiple inverse relationships for the same forward relationship members on type team',
    );
  });

  it('should throw error when inverse relationship type does not match bidirectional pair', () => {
    // Arrange
    type EntityFields = {
      employee: { firstName: string };
      team: { name: string };
      department: { name: string };
    };
    const relations: EntityRelations<EntityFields> = {
      employee: {
        teams: { arity: 'inverse', type: 'team', forwardRelationship: 'members' },
      },
      team: {
        members: { arity: 'inverse', type: 'department', forwardRelationship: 'teams' },
      },
      department: {
        teams: { arity: 'inverse', type: 'team', forwardRelationship: 'departments' },
      },
    };

    // Act & Assert
    expect(() => buildInversedRelationsMapping(relations)).toThrow(
      'Inverse relationship members on type team references forward relationship teams but types do not match',
    );
  });

  it('should throw error when inverse relationship has no matching bidirectional pair', () => {
    // Arrange
    type EntityFields = {
      employee: { firstName: string };
      team: { name: string };
    };
    const relations: EntityRelations<EntityFields> = {
      employee: {},
      team: {
        members: { arity: 'inverse', type: 'employee', forwardRelationship: 'teams' },
      },
    };

    // Act & Assert
    expect(() => buildInversedRelationsMapping(relations)).toThrow(
      'Some inverse relationships could not be matched with their corresponding forward relationships',
    );
  });

  it('should throw error when forward relationship name does not exist on target type', () => {
    // Arrange
    type EntityFields = {
      employee: { firstName: string };
      team: { name: string };
    };
    const relations: EntityRelations<EntityFields> = {
      employee: {
        teams: { arity: 'inverse', type: 'team', forwardRelationship: 'nonexistent' },
      },
      team: {
        members: { arity: 'inverse', type: 'employee', forwardRelationship: 'teams' },
      },
    };

    // Act & Assert
    expect(() => buildInversedRelationsMapping(relations)).toThrow(
      'Some inverse relationships could not be matched with their corresponding forward relationships',
    );
  });
});
