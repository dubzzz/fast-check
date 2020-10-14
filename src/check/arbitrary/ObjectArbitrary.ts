import { Arbitrary } from './definition/Arbitrary';

import { stringify } from '../../utils/stringify';
import { array } from './ArrayArbitrary';
import { boolean } from './BooleanArbitrary';
import { constant } from './ConstantArbitrary';
import { dictionary, toObject } from './DictionaryArbitrary';
import { double } from './FloatingPointArbitrary';
import { frequency } from './FrequencyArbitrary';
import { integer } from './IntegerArbitrary';
import { memo, Memo } from './MemoArbitrary';
import { oneof } from './OneOfArbitrary';
import { set } from './SetArbitrary';
import { string, unicodeString } from './StringArbitrary';
import { tuple } from './TupleArbitrary';
import { bigInt } from './BigIntArbitrary';
import { date } from './DateArbitrary';

/**
 * Constraints for {@link anything} and {@link object}
 * @public
 */
export interface ObjectConstraints {
  /** Maximal depth allowed */
  maxDepth?: number;
  /** Maximal number of keys */
  maxKeys?: number;
  /**
   * Arbitrary for keys
   *
   * Default for `key` is: {@link string}
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
   */
  values?: Arbitrary<unknown>[];
  /** Also generate boxed versions of values */
  withBoxedValues?: boolean;
  /** Also generate Set */
  withSet?: boolean;
  /** Also generate Map */
  withMap?: boolean;
  /** Also generate string representations of object instances */
  withObjectString?: boolean;
  /** Also generate object with null prototype */
  withNullPrototype?: boolean;
  /** Also generate BigInt */
  withBigInt?: boolean;
  /** Also generate Date */
  withDate?: boolean;
}

/**
 * Shared constraints for:
 * - {@link json},
 * - {@link unicodeJson},
 * - {@link jsonObject},
 * - {@link unicodeJsonObject}
 * @public
 */
export interface JsonSharedConstraints {
  /** Maximal depth allowed */
  maxDepth?: number;
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
    readonly withDate: boolean
  ) {}

  /**
   * Default value of ObjectConstraints.values field
   */
  static defaultValues(): Arbitrary<unknown>[] {
    return [
      boolean(),
      integer(),
      double(),
      string(),
      oneof(string(), constant(null), constant(undefined)),
      oneof(
        double(),
        constant(-0),
        constant(0),
        constant(Number.NaN),
        constant(Number.POSITIVE_INFINITY),
        constant(Number.NEGATIVE_INFINITY),
        constant(Number.EPSILON),
        constant(Number.MIN_VALUE),
        constant(Number.MAX_VALUE),
        constant(Number.MIN_SAFE_INTEGER),
        constant(Number.MAX_SAFE_INTEGER)
      ),
    ];
  }

  private static boxArbitraries(arbs: Arbitrary<unknown>[]): Arbitrary<unknown>[] {
    return arbs.map((arb) =>
      arb.map((v) => {
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
      })
    );
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
      orDefault(settings.withDate, false)
    );
  }
}

/** @internal */
const anythingInternal = (constraints: QualifiedObjectConstraints): Arbitrary<unknown> => {
  const arbKeys = constraints.withObjectString
    ? memo((n) =>
        frequency(
          { arbitrary: constraints.key, weight: 10 },
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
  const arrayArb = memo((n) => oneof(arrayBaseArb, array(anythingArb(n), { maxLength: maxKeys })));
  // Set<base> | Set<anything>
  const setArb = memo((n) =>
    oneof(
      setBaseArb(),
      set(anythingArb(n), 0, maxKeys).map((v) => new Set(v))
    )
  );
  // Map<key, base> | (Map<key, anything> | Map<anything, anything>)
  const mapArb = memo((n) =>
    oneof(mapBaseArb(n), oneof(mapOf(arbKeys(n), anythingArb(n)), mapOf(anythingArb(n), anythingArb(n))))
  );
  // {[key:string]: base} | {[key:string]: anything}
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
      ...(constraints.withDate ? [date()] : [])
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
 * @public
 */
function object(constraints: ObjectConstraints): Arbitrary<Record<string, unknown>>;
function object(constraints?: ObjectConstraints): Arbitrary<Record<string, unknown>> {
  return objectInternal(QualifiedObjectConstraints.from(constraints));
}

/** @internal */
function jsonSettings(stringArbitrary: Arbitrary<string>, constraints?: number | JsonSharedConstraints) {
  const key = stringArbitrary;
  const values = [boolean(), integer(), double(), stringArbitrary, constant(null)];
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
 * @remarks
 * Superceded by `fc.jsonObject({maxDepth})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/master/codemods/unify-signatures | our codemod script}.
 *
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
 * @remarks
 * Superceded by `fc.unicodeJsonObject({maxDepth})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/master/codemods/unify-signatures | our codemod script}.
 *
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
 * @remarks
 * Superceded by `fc.json({maxDepth})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/master/codemods/unify-signatures | our codemod script}.
 *
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
 * @remarks
 * Superceded by `fc.unicodeJson({maxDepth})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/master/codemods/unify-signatures | our codemod script}.
 *
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
