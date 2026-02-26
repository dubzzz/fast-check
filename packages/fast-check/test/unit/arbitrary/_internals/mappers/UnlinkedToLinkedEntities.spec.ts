import { describe, expect, it } from 'vitest';
import { unlinkedToLinkedEntitiesMapper } from '../../../../../src/arbitrary/_internals/mappers/UnlinkedToLinkedEntities.js';
import type {
  ProducedLinks,
  UnlinkedEntities,
} from '../../../../../src/arbitrary/_internals/interfaces/EntityGraphTypes.js';
import { stringify } from '../../../../../src/utils/stringify.js';

describe('unlinkedToLinkedEntitiesMapper', () => {
  describe('links', () => {
    it('should properly deal with no links', () => {
      // Arrange
      type EntityFields = { employee: { name: string } };
      const source: UnlinkedEntities<EntityFields> = {
        employee: [{ name: 'Maria' }],
      };
      type EntityRelations = { employee: {} };
      const links: ProducedLinks<EntityFields, EntityRelations> = {
        employee: [{}], // no links still means "matching {}"
      };

      // Act
      const final = unlinkedToLinkedEntitiesMapper(source, links);

      // Assert
      expect(final).toStrictEqual({
        employee: [{ name: 'Maria' }],
      });
      expect(final).not.toBe(source);
      expect(final.employee[0]).not.toBe(source.employee[0]);
    });

    it('should properly deal with optional link', () => {
      // Arrange
      type EntityFields = { employee: { name: string } };
      const source: UnlinkedEntities<EntityFields> = {
        employee: [{ name: 'Maria' }],
      };
      type EntityRelations = { employee: { manager: { arity: '0-1'; type: 'employee' } } };
      const links: ProducedLinks<EntityFields, EntityRelations> = {
        employee: [{ manager: { type: 'employee', index: undefined } }],
      };

      // Act
      const final = unlinkedToLinkedEntitiesMapper(source, links);

      // Assert
      expect(final).toStrictEqual({
        employee: [{ name: 'Maria', manager: undefined }], // we expect the manager field
      });
      expect(final).not.toBe(source);
      expect(final.employee[0]).not.toBe(source.employee[0]);
    });

    it('should properly deal with single link', () => {
      // Arrange
      type EntityFields = { employee: { name: string }; team: { name: string } };
      const source: UnlinkedEntities<EntityFields> = {
        employee: [{ name: 'Maria' }],
        team: [{ name: 'A' }],
      };
      type EntityRelations = { employee: { team: { arity: '1'; type: 'team' } }; team: {} };
      const links: ProducedLinks<EntityFields, EntityRelations> = {
        employee: [{ team: { type: 'team', index: 0 } }],
        team: [{}], // no links from team to something
      };

      // Act
      const final = unlinkedToLinkedEntitiesMapper(source, links);

      // Assert
      expect(final).toStrictEqual({
        employee: [{ name: 'Maria', team: { name: 'A' } }],
        team: [{ name: 'A' }],
      });
      expect(final.employee[0].team).toBe(final.team[0]); // reference to the team, not to a copy
      expect(final).not.toBe(source);
      expect(final.employee[0]).not.toBe(source.employee[0]);
      expect(final.team[0]).not.toBe(source.team[0]);
    });

    it('should properly deal with multiple links', () => {
      // Arrange
      type EntityFields = { employee: { name: string }; project: { name: string } };
      const source: UnlinkedEntities<EntityFields> = {
        employee: [{ name: 'Maria' }],
        project: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      };
      type EntityRelations = { employee: { projects: { arity: 'many'; type: 'project' } }; project: {} };
      const links: ProducedLinks<EntityFields, EntityRelations> = {
        employee: [{ projects: { type: 'project', index: [0, 2] } }],
        project: [{}, {}, {}], // no links from team to something
      };

      // Act
      const final = unlinkedToLinkedEntitiesMapper(source, links);

      // Assert
      expect(final).toStrictEqual({
        employee: [{ name: 'Maria', projects: [{ name: 'A' }, { name: 'C' }] }],
        project: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      });
      expect(final.employee[0].projects[0]).toBe(final.project[0]); // reference to the project, not to a copy
      expect(final.employee[0].projects[1]).toBe(final.project[2]); // reference to the project, not to a copy
      expect(final).not.toBe(source);
      expect(final.employee[0]).not.toBe(source.employee[0]);
      expect(final.project[0]).not.toBe(source.project[0]);
      expect(final.project[1]).not.toBe(source.project[1]);
      expect(final.project[2]).not.toBe(source.project[2]);
    });

    it('should properly deal with complex links', () => {
      // Arrange
      type EntityFields = {
        employee: { name: string };
        team: { name: string };
        department: { name: string };
        badge: { name: string };
      };
      const source: UnlinkedEntities<EntityFields> = {
        employee: [{ name: 'Maria' }, { name: 'John' }, { name: 'Paul' }, { name: 'Clara' }],
        team: [{ name: 'A' }, { name: 'B' }],
        department: [{ name: 'R&D' }, { name: 'Product' }],
        badge: [{ name: 'B1' }, { name: 'B2' }, { name: 'B3' }, { name: 'B4' }],
      };
      type EntityRelations = {
        employee: {
          manager: { arity: '0-1'; type: 'employee' };
          team: { arity: '1'; type: 'team' };
          badges: { arity: 'many'; type: 'badge' };
          cyclic: { arity: '1'; type: 'employee' };
        };
        team: { department: { arity: '1'; type: 'department' } };
        department: {};
        badge: {};
      };
      const links: ProducedLinks<EntityFields, EntityRelations> = {
        employee: [
          {
            manager: { type: 'employee', index: undefined },
            team: { type: 'team', index: 1 },
            badges: { type: 'badge', index: [2, 0, 1] },
            cyclic: { type: 'employee', index: 1 },
          },
          {
            manager: { type: 'employee', index: 2 },
            team: { type: 'team', index: 0 },
            badges: { type: 'badge', index: [0, 2] },
            cyclic: { type: 'employee', index: 2 },
          },
          {
            manager: { type: 'employee', index: 0 },
            team: { type: 'team', index: 0 },
            badges: { type: 'badge', index: [1] },
            cyclic: { type: 'employee', index: 0 },
          },
          {
            manager: { type: 'employee', index: 0 },
            team: { type: 'team', index: 1 },
            badges: { type: 'badge', index: [3] },
            cyclic: { type: 'employee', index: 3 },
          },
        ],
        team: [{ department: { type: 'department', index: 1 } }, { department: { type: 'department', index: 0 } }],
        department: [{}, {}],
        badge: [{}, {}, {}, {}],
      };

      // Act
      const final = unlinkedToLinkedEntitiesMapper(source, links);

      // Assert
      expect(final).toStrictEqual({
        employee: [
          expect.objectContaining({ name: 'Maria' }),
          expect.objectContaining({ name: 'John' }),
          expect.objectContaining({ name: 'Paul' }),
          expect.objectContaining({ name: 'Clara' }),
        ],
        team: [expect.objectContaining({ name: 'A' }), expect.objectContaining({ name: 'B' })],
        department: [{ name: 'R&D' }, { name: 'Product' }],
        badge: [{ name: 'B1' }, { name: 'B2' }, { name: 'B3' }, { name: 'B4' }],
      });
      // Checking links from employee[0]...
      expect(final.employee[0].manager).toBe(undefined);
      expect(final.employee[0].team).toBe(final.team[1]);
      expect(final.employee[0].badges).toHaveLength(3);
      expect(final.employee[0].badges[0]).toBe(final.badge[2]);
      expect(final.employee[0].badges[1]).toBe(final.badge[0]);
      expect(final.employee[0].badges[2]).toBe(final.badge[1]);
      expect(final.employee[0].cyclic).toBe(final.employee[1]);
      // Checking links from employee[1]...
      expect(final.employee[1].manager).toBe(final.employee[2]);
      expect(final.employee[1].team).toBe(final.team[0]);
      expect(final.employee[1].badges).toHaveLength(2);
      expect(final.employee[1].badges[0]).toBe(final.badge[0]);
      expect(final.employee[1].badges[1]).toBe(final.badge[2]);
      expect(final.employee[1].cyclic).toBe(final.employee[2]);
      // Checking links from employee[2]...
      expect(final.employee[2].manager).toBe(final.employee[0]);
      expect(final.employee[2].team).toBe(final.team[0]);
      expect(final.employee[2].badges).toHaveLength(1);
      expect(final.employee[2].badges[0]).toBe(final.badge[1]);
      expect(final.employee[2].cyclic).toBe(final.employee[0]);
      // Checking links from employee[3]...
      expect(final.employee[3].manager).toBe(final.employee[0]);
      expect(final.employee[3].team).toBe(final.team[1]);
      expect(final.employee[3].badges).toHaveLength(1);
      expect(final.employee[3].badges[0]).toBe(final.badge[3]);
      expect(final.employee[3].cyclic).toBe(final.employee[3]);
      // Checking links from team[0]...
      expect(final.team[0].department).toBe(final.department[1]);
      // Checking links from team[1]...
      expect(final.team[1].department).toBe(final.department[0]);
    });

    it('should preserve null prototype if any on the requested entities', () => {
      // Arrange
      type EntityFields = { employee: { name: string } };
      const source: UnlinkedEntities<EntityFields> = {
        employee: [{ name: 'Maria' }, Object.assign(Object.create(null), { name: 'Paul' })],
      };
      type EntityRelations = { employee: {} };
      const links: ProducedLinks<EntityFields, EntityRelations> = {
        employee: [{}], // no links still means "matching {}"
      };

      // Act
      const final = unlinkedToLinkedEntitiesMapper(source, links);

      // Assert
      expect(final).not.toStrictEqual({
        employee: [{ name: 'Maria' }, { name: 'Paul' }],
      });
      expect(final).toStrictEqual({
        employee: [{ name: 'Maria' }, Object.assign(Object.create(null), { name: 'Paul' })],
      });
      expect(final).not.toBe(source);
      expect(final.employee[0]).not.toBe(source.employee[0]);
      expect(final.employee[1]).not.toBe(source.employee[1]);
    });
  });

  describe('stringify', () => {
    it('should provide an alias for single links', () => {
      // Arrange
      type EntityFields = { employee: { name: string }; team: { name: string } };
      const source: UnlinkedEntities<EntityFields> = {
        employee: [{ name: 'Maria' }],
        team: [{ name: 'A' }],
      };
      type EntityRelations = { employee: { team: { arity: '1'; type: 'team' } }; team: {} };
      const links: ProducedLinks<EntityFields, EntityRelations> = {
        employee: [{ team: { type: 'team', index: 0 } }],
        team: [{}], // no links from team to something
      };

      // Act
      const final = unlinkedToLinkedEntitiesMapper(source, links);

      // Assert
      // Remark: We don't expect team field of employee to show its content, but rather to link towards it
      expect(stringify(final)).toMatchInlineSnapshot(
        `"{"employee":[{"name":"Maria","team":<team#0>}],"team":[{"name":"A"}]}"`,
      );
    });

    it('should provide an alias for multiple links', () => {
      // Arrange
      type EntityFields = { employee: { name: string }; project: { name: string } };
      const source: UnlinkedEntities<EntityFields> = {
        employee: [{ name: 'Maria' }],
        project: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      };
      type EntityRelations = { employee: { projects: { arity: 'many'; type: 'project' } }; project: {} };
      const links: ProducedLinks<EntityFields, EntityRelations> = {
        employee: [{ projects: { type: 'project', index: [0, 2] } }],
        project: [{}, {}, {}], // no links from team to something
      };

      // Act
      const final = unlinkedToLinkedEntitiesMapper(source, links);

      // Assert
      // Remark: We don't expect projects field of employee to show its content, but rather to link towards it
      expect(stringify(final)).toMatchInlineSnapshot(
        `"{"employee":[{"name":"Maria","projects":[<project#0>,<project#2>]}],"project":[{"name":"A"},{"name":"B"},{"name":"C"}]}"`,
      );
    });

    it('should attach the custom stringifier to the entity itself on single links', () => {
      // Arrange
      type EntityFields = { employee: { name: string } };
      const source: UnlinkedEntities<EntityFields> = {
        employee: [{ name: 'Maria' }],
      };
      type EntityRelations = { employee: { self: { arity: '1'; type: 'employee' } } };
      const links: ProducedLinks<EntityFields, EntityRelations> = {
        employee: [{ self: { type: 'employee', index: 0 } }],
      };

      // Act
      const final = unlinkedToLinkedEntitiesMapper(source, links);

      // Assert
      expect(stringify(final.employee[0])).toMatchInlineSnapshot(`"{"name":"Maria","self":<employee#0>}"`);
      expect(stringify(final.employee[0].self)).toBe(stringify(final.employee[0]));
      expect(stringify(final.employee[0].self.self)).toBe(stringify(final.employee[0]));
    });

    it('should attach the custom stringifier to the entity itself on multiple links', () => {
      // Arrange
      type EntityFields = { employee: { name: string } };
      const source: UnlinkedEntities<EntityFields> = {
        employee: [{ name: 'Maria' }],
      };
      type EntityRelations = { employee: { self: { arity: 'many'; type: 'employee' } } };
      const links: ProducedLinks<EntityFields, EntityRelations> = {
        employee: [{ self: { type: 'employee', index: [0] } }],
      };

      // Act
      const final = unlinkedToLinkedEntitiesMapper(source, links);

      // Assert
      expect(stringify(final.employee[0])).toMatchInlineSnapshot(`"{"name":"Maria","self":[<employee#0>]}"`);
      expect(stringify(final.employee[0].self[0])).toBe(stringify(final.employee[0]));
      expect(stringify(final.employee[0].self[0].self[0])).toBe(stringify(final.employee[0]));
    });
  });
});
