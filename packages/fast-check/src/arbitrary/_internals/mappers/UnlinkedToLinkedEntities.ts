import { safeMap, String as SString } from '../../../utils/globals';
import { stringify, toStringMethod } from '../../../utils/stringify';
import type {
  EntityGraphValue,
  EntityRelations,
  ProducedLinksLight,
  UnlinkedEntities,
} from '../interfaces/EntityGraphTypes';

const safeObjectAssign = Object.assign;
const safeObjectCreate = Object.create;
const safeObjectDefineProperty = Object.defineProperty;
const safeObjectGetPrototypeOf = Object.getPrototypeOf;
const safeObjectPrototype = Object.prototype;

/** @internal */
export function unlinkedToLinkedEntitiesMapper<TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(
  unlinkedEntities: UnlinkedEntities<TEntityFields>,
  producedLinks: ProducedLinksLight<TEntityFields, TEntityRelations>,
): EntityGraphValue<TEntityFields, TEntityRelations> {
  // Create copies of unlinked entities
  const linkedEntities: EntityGraphValue<TEntityFields, TEntityRelations> = safeObjectCreate(safeObjectPrototype);
  for (const name in unlinkedEntities) {
    const unlinkedEntitiesForName = unlinkedEntities[name];
    const linkedEntitiesForName = [];
    for (const unlinkedEntity of unlinkedEntitiesForName) {
      const linkedEntity = safeObjectAssign(safeObjectCreate(safeObjectGetPrototypeOf(unlinkedEntity)), unlinkedEntity);
      linkedEntitiesForName.push(linkedEntity);
    }
    linkedEntities[name] = linkedEntitiesForName;
  }
  // Enrich copies with direct links
  for (const name in producedLinks) {
    const producedLinksForName = producedLinks[name];
    const entityLinks = producedLinksForName.entityLinks;
    for (let entityIndex = 0; entityIndex !== entityLinks.length; ++entityIndex) {
      const entityLinksForInstance = entityLinks[entityIndex];
      const linkedInstance = linkedEntities[name][entityIndex];
      for (const prop in entityLinksForInstance) {
        const propValue = entityLinksForInstance[prop];
        linkedInstance[prop] =
          propValue.index === undefined
            ? undefined
            : typeof propValue.index === 'number'
              ? (linkedEntities[propValue.type][propValue.index] as any)
              : safeMap(propValue.index, (index) => linkedEntities[propValue.type][index]);
      }
      safeObjectDefineProperty(linkedInstance, toStringMethod, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: () => {
          const unlinkedEntity = unlinkedEntities[name][entityIndex];
          const entity = safeObjectAssign(safeObjectCreate(safeObjectGetPrototypeOf(unlinkedEntity)), unlinkedEntity);
          for (const prop in entityLinksForInstance) {
            const propValue = entityLinksForInstance[prop];
            entity[prop] = (
              propValue.index === undefined
                ? undefined
                : typeof propValue.index === 'number'
                  ? `${SString(propValue.type)}#${propValue.index}`
                  : safeMap(propValue.index, (index) => `${SString(propValue.type)}#${index}`)
            ) as any;
          }
          return stringify(entity);
        },
      });
    }
  }
  // Return enriched copies
  return linkedEntities;
}
