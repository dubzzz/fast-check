import type { EntityRelations, Relationship } from '../interfaces/EntityGraphTypes';
import { Error as SError, String as SString } from '../../../utils/globals.js';

export type InversedRelationsEntry<TEntityFields> = { type: keyof TEntityFields; property: string };

export function buildInversedRelationsMapping<TEntityFields>(
  relations: EntityRelations<TEntityFields>,
): Map<Relationship<keyof TEntityFields>, InversedRelationsEntry<TEntityFields>> {
  let foundInversedRelations = 0;
  const requestedInversedRelations = new Map<keyof TEntityFields, Map<string, InversedRelationsEntry<TEntityFields>>>();
  for (const name in relations) {
    const relationsForName = relations[name];
    for (const fieldName in relationsForName) {
      const relation = relationsForName[fieldName];
      if (relation.arity !== 'inverse') {
        continue;
      }
      let existingOnes = requestedInversedRelations.get(relation.type);
      if (existingOnes === undefined) {
        existingOnes = new Map();
        requestedInversedRelations.set(relation.type, existingOnes);
      }
      if (existingOnes.has(relation.forwardRelationship)) {
        throw new SError(
          `Cannot declare multiple inverse relationships for the same forward relationship ${SString(relation.forwardRelationship)} on type ${SString(relation.type)}`,
        );
      }
      existingOnes.set(relation.forwardRelationship, { type: name, property: fieldName });
      foundInversedRelations += 1;
    }
  }
  const inversedRelations = new Map<Relationship<keyof TEntityFields>, InversedRelationsEntry<TEntityFields>>();
  if (foundInversedRelations === 0) {
    return inversedRelations;
  }
  for (const name in relations) {
    const relationsForName = relations[name];
    const requestedInversedRelationsForName = requestedInversedRelations.get(name);
    if (requestedInversedRelationsForName === undefined) {
      continue;
    }
    for (const fieldName in relationsForName) {
      const relation = relationsForName[fieldName];
      if (relation.arity === 'inverse') {
        continue;
      }
      const requestedIfAny = requestedInversedRelationsForName.get(fieldName);
      if (requestedIfAny === undefined) {
        continue;
      }
      if (requestedIfAny.type !== relation.type) {
        throw new SError(
          `Inverse relationship ${SString(fieldName)} on type ${SString(name)} references forward relationship ${SString(relation.forwardRelationship)} but types do not match`,
        );
      }
      inversedRelations.set(relation, requestedIfAny);
    }
  }
  if (inversedRelations.size !== foundInversedRelations) {
    throw new SError(`Some inverse relationships could not be matched with their corresponding forward relationships`);
  }
  return inversedRelations;
}
