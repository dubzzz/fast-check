import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { dictionary } from './dictionary';
import { anyArbitraryBuilder } from './_internals/builders/AnyArbitraryBuilder';
import type { QualifiedObjectConstraints, ObjectConstraints } from './_internals/helpers/QualifiedObjectConstraints';
import { toQualifiedObjectConstraints } from './_internals/helpers/QualifiedObjectConstraints';

export type { ObjectConstraints };

/** @internal */
function objectInternal(constraints: QualifiedObjectConstraints): Arbitrary<Record<string, unknown>> {
  return dictionary(constraints.key, anyArbitraryBuilder(constraints), {
    maxKeys: constraints.maxKeys,
    noNullPrototype: true,
    size: constraints.size,
  });
}

/**
 * For any objects
 *
 * You may use {@link sample} to preview the values that will be generated
 *
 * @example
 * ```javascript
 * {}, {k: [{}, 1, 2]}
 * ```
 *
 * @remarks Since 0.0.7
 * @public
 */
function object(): Arbitrary<Record<string, unknown>>;
/**
 * For any objects following the constraints defined by `settings`
 *
 * You may use {@link sample} to preview the values that will be generated
 *
 * @example
 * ```javascript
 * {}, {k: [{}, 1, 2]}
 * ```
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 0.0.7
 * @public
 */
function object(constraints: ObjectConstraints): Arbitrary<Record<string, unknown>>;
function object(constraints?: ObjectConstraints): Arbitrary<Record<string, unknown>> {
  return objectInternal(toQualifiedObjectConstraints(constraints));
}
export { object };
