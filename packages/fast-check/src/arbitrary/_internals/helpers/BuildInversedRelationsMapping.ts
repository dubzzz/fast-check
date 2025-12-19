import type { EntityRelations, Relationship } from '../interfaces/EntityGraphTypes';

/**
 * Entry mapping an inverse relationship to its forward counterpart
 * @internal
 */
export type InversedRelationsEntry<TEntityFields> = { type: keyof TEntityFields; property: string };

/**
 * Build mapping from inverse to forward relationships
 * @internal
 */
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
        throw new Error(''); // TODO SError
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
      if (relation.arity !== 'inverse') {
        continue;
      }
      const requestedIfAny = requestedInversedRelationsForName.get(fieldName);
      if (requestedIfAny === undefined) {
        continue;
      }
      if (requestedIfAny.type !== relation.type) {
        throw new Error(''); // TODO SError
      }
      inversedRelations.set(relation, requestedIfAny);
    }
  }
  if (inversedRelations.size !== foundInversedRelations) {
    throw new Error(''); // TODO SError
  }
  return inversedRelations;
}
