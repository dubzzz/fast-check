import { readConfigureGlobal } from '../../../check/runner/configuration/GlobalParameters';
import { safeIndexOf } from '../../../utils/globals';

const safeMathFloor = Math.floor;
const safeMathMin = Math.min;

/**
 * Shared upper bound for max length of array-like entities handled within fast-check
 *
 * "Every Array object has a non-configurable "length" property whose value is always a nonnegative integer less than 2^32."
 * See {@link https://262.ecma-international.org/11.0/#sec-array-exotic-objects | ECMAScript Specifications}
 *
 * "The String type is the set of all ordered sequences [...] up to a maximum length of 2^53 - 1 elements."
 * See {@link https://262.ecma-international.org/11.0/#sec-ecmascript-language-types-string-type | ECMAScript Specifications}
 *
 * @internal
 */
export const MaxLengthUpperBound = 0x7fffffff;

/**
 * The size parameter defines how large the generated values could be.
 *
 * The default in fast-check is 'small' but it could be increased (resp. decreased)
 * to ask arbitraries for larger (resp. smaller) values.
 *
 * @remarks Since 2.22.0
 * @public
 */
export type Size = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';

/** @internal */
const orderedSize = ['xsmall', 'small', 'medium', 'large', 'xlarge'] as const;

/**
 * @remarks Since 2.22.0
 * @public
 */
export type RelativeSize = '-4' | '-3' | '-2' | '-1' | '=' | '+1' | '+2' | '+3' | '+4';

/** @internal */
const orderedRelativeSize = ['-4', '-3', '-2', '-1', '=', '+1', '+2', '+3', '+4'] as const;

/**
 * Superset of {@link Size} to override the default defined for size
 * @remarks Since 2.22.0
 * @public
 */
export type SizeForArbitrary = RelativeSize | Size | 'max' | undefined;

/**
 * Superset of {@link Size} to override the default defined for size.
 * It can either be based on a numeric value manually selected by the user (not recommended)
 * or rely on presets based on size (recommended).
 *
 * This size will be used to infer a bias to limit the depth, used as follow within recursive structures:
 * While going deeper, the bias on depth will increase the probability to generate small instances.
 *
 * When used with {@link Size}, the larger the size the deeper the structure.
 * When used with numeric values, the larger the number (floating point number &gt;= 0),
 * the deeper the structure. `+0` means extremelly biased depth meaning barely impossible to generate
 * deep structures, while `Number.POSITIVE_INFINITY` means "depth has no impact".
 *
 * Using `max` or `Number.POSITIVE_INFINITY` is fully equivalent.
 *
 * @remarks Since 2.25.0
 * @public
 */
export type DepthSize = RelativeSize | Size | 'max' | number | undefined;

/**
 * The default size used by fast-check
 * @internal
 */
export const DefaultSize: Size = 'small';

/**
 * Compute `maxLength` based on `minLength` and `size`
 * @internal
 */
export function maxLengthFromMinLength(minLength: number, size: Size): number {
  switch (size) {
    case 'xsmall':
      return safeMathFloor(1.1 * minLength) + 1; // min + (0.1 * min + 1)
    case 'small':
      return 2 * minLength + 10; // min + (1 * min + 10)
    case 'medium':
      return 11 * minLength + 100; // min + (10 * min + 100)
    case 'large':
      return 101 * minLength + 1000; // min + (100 * min + 1000)
    case 'xlarge':
      return 1001 * minLength + 10000; // min + (1000 * min + 10000)
    default:
      throw new Error(`Unable to compute lengths based on received size: ${size}`);
  }
}

/**
 * Transform a RelativeSize|Size into a Size
 * @internal
 */
export function relativeSizeToSize(size: Size | RelativeSize, defaultSize: Size): Size {
  const sizeInRelative = safeIndexOf(orderedRelativeSize, size as RelativeSize);
  if (sizeInRelative === -1) {
    return size as Size;
  }
  const defaultSizeInSize = safeIndexOf(orderedSize, defaultSize);
  if (defaultSizeInSize === -1) {
    throw new Error(`Unable to offset size based on the unknown defaulted one: ${defaultSize}`);
  }
  const resultingSizeInSize = defaultSizeInSize + sizeInRelative - 4;
  return resultingSizeInSize < 0
    ? orderedSize[0]
    : resultingSizeInSize >= orderedSize.length
      ? orderedSize[orderedSize.length - 1]
      : orderedSize[resultingSizeInSize];
}

/**
 * Compute `maxGeneratedLength` based on `minLength`, `maxLength` and `size`
 * @param size - Size defined by the caller on the arbitrary
 * @param minLength - Considered minimal length
 * @param maxLength - Considered maximal length
 * @param specifiedMaxLength - Whether or not the caller specified the max (true) or if it has been defaulted (false)
 * @internal
 */
export function maxGeneratedLengthFromSizeForArbitrary(
  size: SizeForArbitrary | undefined,
  minLength: number,
  maxLength: number,
  specifiedMaxLength: boolean,
): number {
  const { baseSize: defaultSize = DefaultSize, defaultSizeToMaxWhenMaxSpecified } = readConfigureGlobal() || {};

  // Resulting size is:
  // - If size has been defined, we use it,
  // - Otherwise (size=undefined), we default it to:
  //   - If caller specified a maxLength and asked for defaultSizeToMaxWhenMaxSpecified, then 'max'
  //   - Otherwise, defaultSize
  const definedSize =
    size !== undefined ? size : specifiedMaxLength && defaultSizeToMaxWhenMaxSpecified ? 'max' : defaultSize;

  if (definedSize === 'max') {
    return maxLength;
  }
  const finalSize = relativeSizeToSize(definedSize, defaultSize);
  return safeMathMin(maxLengthFromMinLength(minLength, finalSize), maxLength);
}

/**
 * Compute `depthSize` based on `size`
 * @param size - Size or depthSize defined by the caller on the arbitrary
 * @param specifiedMaxDepth - Whether or not the caller specified a max depth
 * @internal
 */
export function depthBiasFromSizeForArbitrary(depthSizeOrSize: DepthSize, specifiedMaxDepth: boolean): number {
  if (typeof depthSizeOrSize === 'number') {
    return 1 / depthSizeOrSize;
  }
  const { baseSize: defaultSize = DefaultSize, defaultSizeToMaxWhenMaxSpecified } = readConfigureGlobal() || {};
  const definedSize =
    depthSizeOrSize !== undefined
      ? depthSizeOrSize
      : specifiedMaxDepth && defaultSizeToMaxWhenMaxSpecified
        ? 'max'
        : defaultSize;
  if (definedSize === 'max') {
    return 0; // 1 / +infinity
  }
  const finalSize = relativeSizeToSize(definedSize, defaultSize);
  switch (finalSize) {
    case 'xsmall':
      return 1;
    case 'small':
      return 0.5; // = 1/2
    case 'medium':
      return 0.25; // = 1/4
    case 'large':
      return 0.125; // = 1/8
    case 'xlarge':
      return 0.0625; // = 1/16
  }
}

/**
 * Resolve the size that should be used given the current context
 * @param size - Size defined by the caller on the arbitrary
 */
export function resolveSize(size: Exclude<SizeForArbitrary, 'max'> | undefined): Size {
  const { baseSize: defaultSize = DefaultSize } = readConfigureGlobal() || {};
  if (size === undefined) {
    return defaultSize;
  }
  return relativeSizeToSize(size, defaultSize);
}
