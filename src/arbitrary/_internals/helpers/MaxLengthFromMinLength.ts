import { readConfigureGlobal } from '../../../check/runner/configuration/GlobalParameters';

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
      return Math.min(Math.floor(1.1 * minLength) + 1, 0x7fffffff); // min + (0.1 * min + 1)
    case 'small':
      return Math.min(2 * minLength + 10, 0x7fffffff); // min + (1 * min + 10)
    case 'medium':
      return Math.min(11 * minLength + 100, 0x7fffffff); // min + (10 * min + 100)
    case 'large':
      return Math.min(101 * minLength + 1000, 0x7fffffff); // min + (100 * min + 1000)
    case 'xlarge':
      return Math.min(1001 * minLength + 10000, 0x7fffffff); // min + (1000 * min + 10000)
    default:
      throw new Error(`Unable to compute lengths based on received size: ${size}`);
  }
}

/**
 * Transform a RelativeSize|Size into a Size
 * @internal
 */
export function relativeSizeToSize(size: Size | RelativeSize, defaultSize: Size): Size {
  const sizeInRelative = orderedRelativeSize.indexOf(size as RelativeSize);
  if (sizeInRelative === -1) {
    return size as Size;
  }
  const defaultSizeInSize = orderedSize.indexOf(defaultSize);
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
  specifiedMaxLength: boolean
): number {
  const { baseSize: defaultSize = DefaultSize, defaultSizeToMaxWhenMaxSpecified = true } = readConfigureGlobal() || {};

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
  return maxLengthFromMinLength(minLength, finalSize);
}
