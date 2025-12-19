import type { EntityRelations, Relationship } from '../interfaces/EntityGraphTypes';

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
      if (relation.arity !== 'backlink') {
        continue;
      }
      let existingOnes = requestedInversedRelations.get(relation.type);
      if (existingOnes === undefined) {
        existingOnes = new Map();
        requestedInversedRelations.set(relation.type, existingOnes);
      }
      if (existingOnes.has(relation.originalProperty)) {
        throw new Error(''); // TODO SError
      }
      existingOnes.set(relation.originalProperty, { type: name, property: fieldName });
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
      if (relation.arity !== 'backlink') {
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
