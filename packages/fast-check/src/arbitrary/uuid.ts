import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { tuple } from './tuple';
import { buildPaddedNumberArbitrary } from './_internals/builders/PaddedNumberArbitraryBuilder';
import { paddedEightsToUuidMapper, paddedEightsToUuidUnmapper } from './_internals/mappers/PaddedEightsToUuid';
import { Error } from '../utils/globals';
import { buildVersionsAppliersForUuid } from './_internals/mappers/VersionsApplierForUuid';

/**
 * Constraints to be applied on {@link uuid}
 * @remarks Since 3.21.0
 * @public
 */
export interface UuidConstraints {
  /**
   * Define accepted versions in the [1-15] according to {@link https://datatracker.ietf.org/doc/html/rfc9562#name-version-field | RFC 9562}
   * @defaultValue [1,2,3,4,5,6,7,8]
   * @remarks Since 3.21.0
   */
  version?:
    | (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15)
    | (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15)[];
}

/** @internal */
function assertValidVersions(versions: number[]) {
  const found: { [key: number]: true | undefined } = {};
  for (const version of versions) {
    // Check no duplicates
    if (found[version]) {
      throw new Error(`Version ${version} has been requested at least twice for uuid`);
    }
    found[version] = true;
    // Check version
    if (version < 1 || version > 15) {
      throw new Error(`Version must be a value in [1-15] for uuid, but received ${version}`);
    }
    if (~~version !== version) {
      throw new Error(`Version must be an integer value for uuid, but received ${version}`);
    }
  }
  if (versions.length === 0) {
    throw new Error(`Must provide at least one version for uuid`);
  }
}

/**
 * For UUID from v1 to v5
 *
 * According to {@link https://tools.ietf.org/html/rfc4122 | RFC 4122}
 *
 * No mixed case, only lower case digits (0-9a-f)
 *
 * @remarks Since 1.17.0
 * @public
 */
export function uuid(constraints: UuidConstraints = {}): Arbitrary<string> {
  // According to RFC 4122: Set the two most significant bits (bits 6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively
  // ie.: ????????-????-X???-Y???-????????????
  //      with X in 1, 2, 3, 4, 5
  //      with Y in 8, 9, A, B
  const padded = buildPaddedNumberArbitrary(0, 0xffffffff);
  const version =
    constraints.version !== undefined
      ? typeof constraints.version === 'number'
        ? [constraints.version]
        : constraints.version
      : [1, 2, 3, 4, 5, 6, 7, 8];
  assertValidVersions(version);
  const { versionsApplierMapper, versionsApplierUnmapper } = buildVersionsAppliersForUuid(version);
  const secondPadded = buildPaddedNumberArbitrary(0, 0x10000000 * version.length - 1).map(
    versionsApplierMapper,
    versionsApplierUnmapper,
  );
  const thirdPadded = buildPaddedNumberArbitrary(0x80000000, 0xbfffffff);
  return tuple(padded, secondPadded, thirdPadded, padded).map(paddedEightsToUuidMapper, paddedEightsToUuidUnmapper);
}
