import { Arbitrary } from './definition/Arbitrary';

import { stringify } from '../../utils/stringify';
import { array } from './ArrayArbitrary';
import { boolean } from './BooleanArbitrary';
import { constant } from './ConstantArbitrary';
import { dictionary, toObject } from './DictionaryArbitrary';
import { double } from './DoubleArbitrary';
import { frequency } from './FrequencyArbitrary';
import { maxSafeInteger } from './IntegerArbitrary';
import { memo, Memo } from './MemoArbitrary';
import { oneof } from './OneOfArbitrary';
import { set } from './SetArbitrary';
import { string, unicodeString } from './StringArbitrary';
import { tuple } from './TupleArbitrary';
import { bigInt } from './BigIntArbitrary';
import { date } from './DateArbitrary';
import {
  float32Array,
  float64Array,
  int16Array,
  int32Array,
  int8Array,
  uint16Array,
  uint32Array,
  uint8Array,
  uint8ClampedArray,
} from './TypedArrayArbitrary';
import { sparseArray } from './SparseArrayArbitrary';

/**
 * Constraints for {@link anything} and {@link object}
 * @public
 */
export interface ObjectConstraints {
  /**
   * Maximal depth allowed
   * @remarks Since 0.0.7
   */
  maxDepth?: number;
  /**
   * Maximal number of keys
   * @remarks Since 1.13.0
   */
  maxKeys?: number;
  /**
   * Arbitrary for keys
   *
   * Default for `key` is: {@link string}
   * @remarks Since 0.0.7
   */
  key?: Arbitrary<string>;
  /**
   * Arbitrary for values
   *
   * Default for `values` are:
   * - {@link boolean},
   * - {@link integer},
   * - {@link double},
   * - {@link string}
   * - constants among:
   *  - `null`,
   *  - `undefined`,
   *  - `Number.NaN`,
   *  - `+0`,
   *  - `-0`,
   *  - `Number.EPSILON`,
   *  - `Number.MIN_VALUE`,
   *  - `Number.MAX_VALUE`,
   *  - `Number.MIN_SAFE_INTEGER`,
   *  - `Number.MAX_SAFE_INTEGER`,
   *  - `Number.POSITIVE_INFINITY`,
   *  - `Number.NEGATIVE_INFINITY`
   * @remarks Since 0.0.7
   */
  values?: Arbitrary<unknown>[];
  /**
   * Also generate boxed versions of values
   * @remarks Since 1.11.0
   */
  withBoxedValues?: boolean;
  /**
   * Also generate Set
   * @remarks Since 1.11.0
   */
  withSet?: boolean;
  /**
   * Also generate Map
   * @remarks Since 1.11.0
   */
  withMap?: boolean;
  /**
   * Also generate string representations of object instances
   * @remarks Since 1.17.0
   */
  withObjectString?: boolean;
  /**
   * Also generate object with null prototype
   * @remarks Since 1.23.0
   */
  withNullPrototype?: boolean;
  /**
   * Also generate BigInt
   * @remarks Since 1.26.0
   */
  withBigInt?: boolean;
  /**
   * Also generate Date
   * @remarks Since 2.5.0
   */
  withDate?: boolean;
  /**
   * Also generate typed arrays in: (Uint|Int)(8|16|32)Array and Float(32|64)Array
   * Remark: no typed arrays made of bigint
   * @remarks Since 2.9.0
   */
  withTypedArray?: boolean;
  /**
   * Also generate sparse arrays (arrays with holes)
   * @remarks Since 2.13.0
   */
  withSparseArray?: boolean;
}

/**
 * Shared constraints for:
 * - {@link json},
 * - {@link unicodeJson},
 * - {@link jsonObject},
 * - {@link unicodeJsonObject}
 *
 * @remarks Since 2.5.0
 * @public
 */
export interface JsonSharedConstraints {
  /**
   * Maximal depth allowed
   * @remarks Since 2.5.0
   */
  maxDepth?: number;
}

/** @internal */
export function boxArbitrary(arb: Arbitrary<unknown>): Arbitrary<unknown> {
  return arb.map((v) => {
    switch (typeof v) {
      case 'boolean':
        // tslint:disable-next-line:no-construct
        return new Boolean(v);
      case 'number':
        // tslint:disable-next-line:no-construct
        return new Number(v);
      case 'string':
        // tslint:disable-next-line:no-construct
        return new String(v);
      default:
        return v;
    }
  });
}

/** @internal */
class QualifiedObjectConstraints {
  constructor(
    readonly key: Arbitrary<string>,
    readonly values: Arbitrary<unknown>[],
    readonly maxDepth: number,
    readonly maxKeys: number,
    readonly withSet: boolean,
    readonly withMap: boolean,
    readonly withObjectString: boolean,
    readonly withNullPrototype: boolean,
    readonly withBigInt: boolean,
    readonly withDate: boolean,
    readonly withTypedArray: boolean,
    readonly withSparseArray: boolean
  ) {}

  /**
   * Default value of ObjectConstraints.values field
   */
  static defaultValues(): Arbitrary<unknown>[] {
    return [
      boolean(),
      maxSafeInteger(), // includes: 0, MIN_SAFE_INTEGER, MAX_SAFE_INTEGER
      double(), // includes: -/+0, -/+inf, -/+MIN_VALUE, -/+MAX_VALUE, NaN
      string(),
      oneof(string(), constant(null), constant(undefined)),
    ];
  }

  private static boxArbitraries(arbs: Arbitrary<unknown>[]): Arbitrary<unknown>[] {
    return arbs.map((arb) => boxArbitrary(arb));
  }

  private static boxArbitrariesIfNeeded(arbs: Arbitrary<unknown>[], boxEnabled: boolean): Arbitrary<unknown>[] {
    return boxEnabled ? QualifiedObjectConstraints.boxArbitraries(arbs).concat(arbs) : arbs;
  }

  static from(settings: ObjectConstraints = {}): QualifiedObjectConstraints {
    function orDefault<T>(optionalValue: T | undefined, defaultValue: T): T {
      return optionalValue !== undefined ? optionalValue : defaultValue;
    }
    return new QualifiedObjectConstraints(
      orDefault(settings.key, string()),
      QualifiedObjectConstraints.boxArbitrariesIfNeeded(
        orDefault(settings.values, QualifiedObjectConstraints.defaultValues()),
        orDefault(settings.withBoxedValues, false)
      ),
      orDefault(settings.maxDepth, 2),
      orDefault(settings.maxKeys, 5),
      orDefault(settings.withSet, false),
      orDefault(settings.withMap, false),
      orDefault(settings.withObjectString, false),
      orDefault(settings.withNullPrototype, false),
      orDefault(settings.withBigInt, false),
      orDefault(settings.withDate, false),
      orDefault(settings.withTypedArray, false),
      orDefault(settings.withSparseArray, false)
    );
  }
}

/** @internal */
const anythingInternal = (constraints: QualifiedObjectConstraints): Arbitrary<unknown> => {
  const arbKeys = constraints.withObjectString
    ? memo((n) =>
        frequency(
          { arbitrary: constraints.key, weight: 10 },
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          { arbitrary: anythingArb(n).map((o) => stringify(o)), weight: 1 }
        )
      )
    : memo(() => constraints.key);
  const arbitrariesForBase = constraints.values;
  const maxDepth = constraints.maxDepth;
  const maxKeys = constraints.maxKeys;

  const entriesOf = <T, U>(keyArb: Arbitrary<T>, valueArb: Arbitrary<U>) =>
    set(tuple(keyArb, valueArb), { maxLength: maxKeys, compare: (t1, t2) => t1[0] === t2[0] });

  const mapOf = <T, U>(ka: Arbitrary<T>, va: Arbitrary<U>) => entriesOf(ka, va).map((v) => new Map(v));
  const dictOf = <U>(ka: Arbitrary<string>, va: Arbitrary<U>) => entriesOf(ka, va).map((v) => toObject(v));

  const baseArb = oneof(...arbitrariesForBase);
  const arrayBaseArb = oneof(...arbitrariesForBase.map((arb) => array(arb, { maxLength: maxKeys })));
  const objectBaseArb = (n: number) => oneof(...arbitrariesForBase.map((arb) => dictOf(arbKeys(n), arb)));
  const setBaseArb = () => oneof(...arbitrariesForBase.map((arb) => set(arb, 0, maxKeys).map((v) => new Set(v))));
  const mapBaseArb = (n: number) => oneof(...arbitrariesForBase.map((arb) => mapOf(arbKeys(n), arb)));

  // base[] | anything[]
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const arrayArb = memo((n) => oneof(arrayBaseArb, array(anythingArb(n), { maxLength: maxKeys })));
  // Set<base> | Set<anything>
  const setArb = memo((n) =>
    oneof(
      setBaseArb(),

      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      set(anythingArb(n), 0, maxKeys).map((v) => new Set(v))
    )
  );
  // Map<key, base> | (Map<key, anything> | Map<anything, anything>)
  const mapArb = memo((n) =>
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    oneof(mapBaseArb(n), oneof(mapOf(arbKeys(n), anythingArb(n)), mapOf(anythingArb(n), anythingArb(n))))
  );
  // {[key:string]: base} | {[key:string]: anything}
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const objectArb = memo((n) => oneof(objectBaseArb(n), dictOf(arbKeys(n), anythingArb(n))));

  const anythingArb: Memo<unknown> = memo((n) => {
    if (n <= 0) return oneof(baseArb);
    return oneof(
      baseArb,
      arrayArb(),
      objectArb(),
      ...(constraints.withMap ? [mapArb()] : []),
      ...(constraints.withSet ? [setArb()] : []),
      ...(constraints.withObjectString ? [anythingArb().map((o) => stringify(o))] : []),
      ...(constraints.withNullPrototype ? [objectArb().map((o) => Object.assign(Object.create(null), o))] : []),
      ...(constraints.withBigInt ? [bigInt()] : []),
      ...(constraints.withDate ? [date()] : []),
      ...(constraints.withTypedArray
        ? [
            oneof(
              int8Array(),
              uint8Array(),
              uint8ClampedArray(),
              int16Array(),
              uint16Array(),
              int32Array(),
              uint32Array(),
              float32Array(),
              float64Array()
            ),
          ]
        : []),
      ...(constraints.withSparseArray ? [sparseArray(anythingArb())] : [])
    );
  });

  return anythingArb(maxDepth);
};

/** @internal */
const objectInternal = (constraints: QualifiedObjectConstraints): Arbitrary<Record<string, unknown>> => {
  return dictionary(constraints.key, anythingInternal(constraints));
};

/**
 * For any type of values
 *
 * You may use {@link sample} to preview the values that will be generated
 *
 * @example
 * ```javascript
 * null, undefined, 42, 6.5, 'Hello', {}, {k: [{}, 1, 2]}
 * ```
 *
 * @remarks Since 0.0.7
 * @public
 */
function anything(): Arbitrary<unknown>;
/**
 * For any type of values following the constraints defined by `settings`
 *
 * You may use {@link sample} to preview the values that will be generated
 *
 * @example
 * ```javascript
 * null, undefined, 42, 6.5, 'Hello', {}, {k: [{}, 1, 2]}
 * ```
 *
 * @example
 * ```typescript
 * // Using custom settings
 * fc.anything({
 *     key: fc.char(),
 *     values: [fc.integer(10,20), fc.constant(42)],
 *     maxDepth: 2
 * });
 * // Can build entries such as:
 * // - 19
 * // - [{"2":12,"k":15,"A":42}]
 * // - {"4":[19,13,14,14,42,11,20,11],"6":42,"7":16,"L":10,"'":[20,11],"e":[42,20,42,14,13,17]}
 * // - [42,42,42]...
 * ```
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 0.0.7
 * @public
 */
function anything(constraints: ObjectConstraints): Arbitrary<unknown>;
function anything(constraints?: ObjectConstraints): Arbitrary<unknown> {
  return anythingInternal(QualifiedObjectConstraints.from(constraints));
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
  return objectInternal(QualifiedObjectConstraints.from(constraints));
}

/** @internal */
function jsonSettings(stringArbitrary: Arbitrary<string>, constraints?: number | JsonSharedConstraints) {
  const key = stringArbitrary;
  const values = [
    boolean(),
    maxSafeInteger(),
    double({ noDefaultInfinity: true, noNaN: true }),
    stringArbitrary,
    constant(null),
  ];
  return constraints != null
    ? typeof constraints === 'number'
      ? { key, values, maxDepth: constraints }
      : { key, values, maxDepth: constraints.maxDepth }
    : { key, values };
}

/**
 * For any JSON compliant values
 *
 * Keys and string values rely on {@link string}
 *
 * @remarks Since 1.2.3
 * @public
 */
function jsonObject(): Arbitrary<unknown>;
/**
 * For any JSON compliant values with a maximal depth
 *
 * Keys and string values rely on {@link string}
 *
 * @param maxDepth - Maximal depth of the generated values
 *
 * @deprecated
 * Superceded by `fc.jsonObject({maxDepth})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 1.2.3
 * @public
 */
function jsonObject(maxDepth: number): Arbitrary<unknown>;
/**
 * For any JSON compliant values
 *
 * Keys and string values rely on {@link string}
 *
 * @param constraints - Constraints to be applied onto the generated instance
 *
 * @remarks Since 2.5.0
 * @public
 */
function jsonObject(constraints: JsonSharedConstraints): Arbitrary<unknown>;
function jsonObject(constraints?: number | JsonSharedConstraints): Arbitrary<unknown> {
  return anything(jsonSettings(string(), constraints));
}

/**
 * For any JSON compliant values with unicode support
 *
 * Keys and string values rely on {@link unicode}
 *
 * @remarks Since 1.2.3
 * @public
 */
function unicodeJsonObject(): Arbitrary<unknown>;
/**
 * For any JSON compliant values with unicode support and a maximal depth
 *
 * Keys and string values rely on {@link unicode}
 *
 * @param maxDepth - Maximal depth of the generated values
 *
 * @deprecated
 * Superceded by `fc.unicodeJsonObject({maxDepth})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 1.2.3
 * @public
 */
function unicodeJsonObject(maxDepth: number): Arbitrary<unknown>;
/**
 * For any JSON compliant values with unicode support
 *
 * Keys and string values rely on {@link unicode}
 *
 * @param constraints - Constraints to be applied onto the generated instance
 *
 * @remarks Since 2.5.0
 * @public
 */
function unicodeJsonObject(constraints: JsonSharedConstraints): Arbitrary<unknown>;
function unicodeJsonObject(constraints?: number | JsonSharedConstraints): Arbitrary<unknown> {
  return anything(jsonSettings(unicodeString(), constraints));
}

/**
 * For any JSON strings
 *
 * Keys and string values rely on {@link string}
 *
 * @remarks Since 0.0.7
 * @public
 */
function json(): Arbitrary<string>;
/**
 * For any JSON strings with a maximal depth
 *
 * Keys and string values rely on {@link string}
 *
 * @param maxDepth - Maximal depth of the generated objects
 *
 * @deprecated
 * Superceded by `fc.json({maxDepth})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.7
 * @public
 */
function json(maxDepth: number): Arbitrary<string>;
/**
 * For any JSON strings
 *
 * Keys and string values rely on {@link string}
 *
 * @param constraints - Constraints to be applied onto the generated instance
 *
 * @remarks Since 2.5.0
 * @public
 */
function json(constraints: JsonSharedConstraints): Arbitrary<unknown>;
function json(constraints?: number | JsonSharedConstraints): Arbitrary<string> {
  // Rq: Explicit 'as any' as 'number | JsonConstraints' cannot be passed to 'unicodeJsonObject(number)'
  //     and cannot be passed to 'unicodeJsonObject(JsonConstraints)' (both are too strict)
  const arb = constraints != null ? jsonObject(constraints as any) : jsonObject();
  return arb.map(JSON.stringify);
}

/**
 * For any JSON strings with unicode support
 *
 * Keys and string values rely on {@link unicode}
 *
 * @remarks Since 0.0.7
 * @public
 */
function unicodeJson(): Arbitrary<string>;
/**
 * For any JSON strings with unicode support and a maximal depth
 *
 * Keys and string values rely on {@link unicode}
 *
 * @param maxDepth - Maximal depth of the generated objects
 *
 * @deprecated
 * Superceded by `fc.unicodeJson({maxDepth})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.7
 * @public
 */
function unicodeJson(maxDepth: number): Arbitrary<string>;
/**
 * For any JSON strings with unicode support
 *
 * Keys and string values rely on {@link unicode}
 *
 * @param constraints - Constraints to be applied onto the generated instance
 *
 * @remarks Since 2.5.0
 * @public
 */
function unicodeJson(constraints: JsonSharedConstraints): Arbitrary<unknown>;
function unicodeJson(constraints?: number | JsonSharedConstraints): Arbitrary<string> {
  // Rq: Explicit 'as any' as 'number | JsonConstraints' cannot be passed to 'unicodeJsonObject(number)'
  //     and cannot be passed to 'unicodeJsonObject(JsonConstraints)' (both are too strict)
  const arb = constraints != null ? unicodeJsonObject(constraints as any) : unicodeJsonObject();
  return arb.map(JSON.stringify);
}

export { anything, object, jsonObject, unicodeJsonObject, json, unicodeJson };
