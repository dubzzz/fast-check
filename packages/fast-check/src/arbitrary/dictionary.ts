import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { tuple } from './tuple';
import { uniqueArray } from './uniqueArray';
import type { SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength';
import { keyValuePairsToObjectMapper, keyValuePairsToObjectUnmapper } from './_internals/mappers/KeyValuePairsToObject';
import { constant } from './constant';
import { boolean } from './boolean';
import type { DepthIdentifier } from './_internals/helpers/DepthContext';

/** @internal */
function dictionaryKeyExtractor(entry: [string, unknown]): string {
  return entry[0];
}

/**
 * Constraints to be applied on {@link dictionary}
 * @remarks Since 2.22.0
 * @public
 */
export interface DictionaryConstraints {
  /**
   * Lower bound for the number of keys defined into the generated instance
   * @defaultValue 0
   * @remarks Since 2.22.0
   */
  minKeys?: number;
  /**
   * Lower bound for the number of keys defined into the generated instance
   * @defaultValue 0x7fffffff — _defaulting seen as "max non specified" when `defaultSizeToMaxWhenMaxSpecified=true`_
   * @remarks Since 2.22.0
   */
  maxKeys?: number;
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 2.22.0
   */
  size?: SizeForArbitrary;
  /**
   * Depth identifier can be used to share the current depth between several instances.
   *
   * By default, if not specified, each instance of dictionary will have its own depth.
   * In other words: you can have depth=1 in one while you have depth=100 in another one.
   *
   * @remarks Since 3.15.0
   */
  depthIdentifier?: DepthIdentifier | string;
  /**
   * Do not generate objects with null prototype
   * @defaultValue true
   * @remarks Since 3.13.0
   */
  noNullPrototype?: boolean;
}

/**
 * For dictionaries with keys produced by `keyArb` and values from `valueArb`
 *
 * @param keyArb - Arbitrary used to generate the keys of the object
 * @param valueArb - Arbitrary used to generate the values of the object
 * 
 * @example
 * ```typescript
 * fc.dictionary(fc.string(), fc.string());
 * // Examples of generated values:
 * // • {"<H":"`D? &7A","T>X0Aa]tp>":":5+|","8{0.mI>8R,":"j._[Xi&.[","!83F]'E1_":"y[bB,G$_S}","NnY,!{":"6NZ4,G'}","Y&>Uj":"gg@eTi","e>QDNvD/gz":"Bt0&oV;","ULLW1":"F6i_","?&I":"lPd7}"}
 * // • {"_":" y|","Yo+\"O@q+j":"cI{H","":"3#$}9{5!z","?^~k ":"w$defipro","[fa4c":"J"}
 * // • {"~":""}
 * // • {"lzproperty":"?"}
 * // • {"hOIY\"R q}":"W","l__defineG":"8x`:H0?T"}
 * // • …
 * ```
 *
 * @example
 * ```typescript
 * fc.dictionary(fc.string(), fc.nat());
 * // Examples of generated values:
 * // • {"":11,".[hM+$+:?N":30,"%{":59342696,"|_":29,"E":670852246,"pl_":2147483639,">":2147483630,"M7cU?#9":1072636200,"ot":1627183273}
 * // • {"_G@>x":461241683,"@9c=&6H:c0":105089967,"c_)r66nwK":1355210745}
 * // • {"#1O;mZ1":1005073225}
 * // • {}
 * // • {"6":144134225,".9":437743867,"tR?j$Hat3X":1920000943,"DQTd":324814916}
 * // • …
 * ```
 *
 * @example
 * ```typescript
 * fc.dictionary(fc.string(), fc.nat(), { minKeys: 2 });
 * // Note: Generate instances with at least 2 keys
 * // Examples of generated values:
 * // • {"%{":11,"4cH":12,"ke":2147483622,"rqM~i'":485910780}
 * // • {"K":1498847755,"&cP<5:e(y\"":1430281549,"!\"2a":1631161561,"dY+g":1880545446,"M2+^,Yq7~t":1437539188}
 * // • {"NfXclS":815533370,"?":2060844890,"":1862140278,"R":618808229,"N|":25902062,"DGw00u?brK":348863633}
 * // • {" R~Own":2147483645,"~":16,"i$#D":1037390287}
 * // • {">YTN<Tt":1950414260,"I6":1505301756,"2;]'dH.i!":815067799,":kmC'":1948205418,"g|GTLPe-":2101264769}
 * // • …
 * ```
 *
 * @remarks Since 1.0.0
 * @public
 */
export function dictionary<T>(
  keyArb: Arbitrary<string>,
  valueArb: Arbitrary<T>,
  constraints: DictionaryConstraints = {},
): Arbitrary<Record<string, T>> {
  const noNullPrototype = constraints.noNullPrototype !== false;
  return tuple(
    uniqueArray(tuple(keyArb, valueArb), {
      minLength: constraints.minKeys,
      maxLength: constraints.maxKeys,
      size: constraints.size,
      selector: dictionaryKeyExtractor,
      depthIdentifier: constraints.depthIdentifier,
    }),
    noNullPrototype ? constant(false) : boolean(),
  ).map(keyValuePairsToObjectMapper, keyValuePairsToObjectUnmapper);
}
