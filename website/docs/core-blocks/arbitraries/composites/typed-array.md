---
slug: /core-blocks/arbitraries/composites/typed-array/
---

# Typed Array

Generate typed array values.

## int8Array

Generate _Int8Array_

**Signatures:**

- `fc.int8Array()`
- `fc.int8Array({min?, max?, minLength?, maxLength?, size?})`

**with:**

- `min?` — default: `-128` — _minimal value (included)_
- `max?` — default: `127` — _maximal value (included)_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.int8Array();
// Examples of generated values:
// • Int8Array.from([122,3,-124])
// • Int8Array.from([75,-49,-14])
// • Int8Array.from([-125])
// • Int8Array.from([-38,57,44,43])
// • Int8Array.from([-5,3,-122,-7,-59,-122])
// • …

fc.int8Array({ min: 0, minLength: 1 });
// Examples of generated values:
// • Int8Array.from([94,100,90,3,30,8,19,78])
// • Int8Array.from([1,123,4,3,0,48,125,86,2,91])
// • Int8Array.from([5,58])
// • Int8Array.from([126,5,100,127,123])
// • Int8Array.from([97,6,121])
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/int8Array.html).  
Available since 2.9.0.

## uint8Array

Generate _Uint8Array_

**Signatures:**

- `fc.uint8Array()`
- `fc.uint8Array({min?, max?, minLength?, maxLength?, size?})`

**with:**

- `min?` — default: `0` — _minimal value (included)_
- `max?` — default: `255` — _maximal value (included)_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.uint8Array();
// Examples of generated values:
// • Uint8Array.from([146,85,17,121,55,177])
// • Uint8Array.from([])
// • Uint8Array.from([10,89])
// • Uint8Array.from([103,180,114,14,118,92,72,6,30])
// • Uint8Array.from([83,73,147,245,64,203,161,246,99])
// • …

fc.uint8Array({ max: 42, minLength: 1 });
// Examples of generated values:
// • Uint8Array.from([16])
// • Uint8Array.from([13,11,41,33,31,7,28,4,17,38,19])
// • Uint8Array.from([15,11,30,9,12])
// • Uint8Array.from([5,14,37])
// • Uint8Array.from([28,3,6,15,0,4,6,17,38,1,40])
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/uint8Array.html).  
Available since 2.9.0.

## uint8ClampedArray

Generate _Uint8ClampedArray_

**Signatures:**

- `fc.uint8ClampedArray()`
- `fc.uint8ClampedArray({min?, max?, minLength?, maxLength?, size?})`

**with:**

- `min?` — default: `0` — _minimal value (included)_
- `max?` — default: `255` — _maximal value (included)_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.uint8ClampedArray();
// Examples of generated values:
// • Uint8ClampedArray.from([111,195,177,66])
// • Uint8ClampedArray.from([122,171,50,200,198])
// • Uint8ClampedArray.from([118,94,97,138,117])
// • Uint8ClampedArray.from([53,190,83])
// • Uint8ClampedArray.from([121])
// • …

fc.uint8ClampedArray({ max: 42, minLength: 1 });
// Examples of generated values:
// • Uint8ClampedArray.from([1,0,26,2])
// • Uint8ClampedArray.from([18,2,27,0,37])
// • Uint8ClampedArray.from([29,1,33,5,40,40,14,10,15,22,39,11])
// • Uint8ClampedArray.from([1,14,26,2])
// • Uint8ClampedArray.from([0,5,4,0])
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/uint8ClampedArray.html).  
Available since 2.9.0.

## int16Array

Generate _Int16Array_

**Signatures:**

- `fc.int16Array()`
- `fc.int16Array({min?, max?, minLength?, maxLength?, size?})`

**with:**

- `min?` — default: `-32768` — _minimal value (included)_
- `max?` — default: `32767` — _maximal value (included)_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.int16Array();
// Examples of generated values:
// • Int16Array.from([7570,-29355,-239,4473,-969,-5199])
// • Int16Array.from([])
// • Int16Array.from([4874,-12711])
// • Int16Array.from([-12441,-7244,32626,1550,-5002,20572,-9656,-29946,-5858])
// • Int16Array.from([-5805,-14007,18067,18421,-10176,-13877,-24415,29686,-26525])
// • …

fc.int16Array({ min: 0, minLength: 1 });
// Examples of generated values:
// • Int16Array.from([4007,21551,9085,2478,16634,3581,7304,29246,12872,23641,22492])
// • Int16Array.from([954,19772,29823,20600])
// • Int16Array.from([32767])
// • Int16Array.from([19919,1,14,19008,25737,3165,3])
// • Int16Array.from([24908,7,7,24039,1])
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/int16Array.html).  
Available since 2.9.0.

## uint16Array

Generate _Uint16Array_

**Signatures:**

- `fc.uint16Array()`
- `fc.uint16Array({min?, max?, minLength?, maxLength?, size?})`

**with:**

- `min?` — default: `0` — _minimal value (included)_
- `max?` — default: `65535` — _maximal value (included)_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.uint16Array();
// Examples of generated values:
// • Uint16Array.from([22507,50336,29220])
// • Uint16Array.from([3,56136])
// • Uint16Array.from([2769,5763,11647,10948,13743,23390,60319,8480])
// • Uint16Array.from([10545,40641,64196])
// • Uint16Array.from([10645,45125,552,37585,55875])
// • …

fc.uint16Array({ max: 42, minLength: 1 });
// Examples of generated values:
// • Uint16Array.from([40,10,16,0,0,41])
// • Uint16Array.from([22,28])
// • Uint16Array.from([24])
// • Uint16Array.from([38])
// • Uint16Array.from([1])
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/uint16Array.html).  
Available since 2.9.0.

## int32Array

Generate _Int32Array_

**Signatures:**

- `fc.int32Array()`
- `fc.int32Array({min?, max?, minLength?, maxLength?, size?})`

**with:**

- `min?` — default: `-0x80000000` — _minimal value (included)_
- `max?` — default: `0x7fffffff` — _maximal value (included)_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.int32Array();
// Examples of generated values:
// • Int32Array.from([581737874,363728213,1849261841,2086900089,-739607497,-1663538255])
// • Int32Array.from([])
// • Int32Array.from([-959081718,-1066774951])
// • Int32Array.from([1932414823,-1904516172,-1076953230,327779854,-2127205258,-1298673572,503994952,-1638200570,-1729271522])
// • Int32Array.from([-1151637165,-722646711,-1773418861,-1345402891,161175616,-1982117429,68362401,-1837239306,-204728221])
// • …

fc.int32Array({ min: 0, minLength: 1 });
// Examples of generated values:
// • Int32Array.from([1785106343,925226031,718971773,1586792878,400900346,1689947645,96279688,1693807166,438809160,1047878745,2063128540])
// • Int32Array.from([1155662778,398052668,504460415,572805240])
// • Int32Array.from([2147483628])
// • Int32Array.from([688082383,20,17,896059968,1869735049,922750045,18])
// • Int32Array.from([1794203980,11,13,1308253671,3])
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/int32Array.html).  
Available since 2.9.0.

## uint32Array

Generate _Uint32Array_

**Signatures:**

- `fc.uint32Array()`
- `fc.uint32Array({min?, max?, minLength?, maxLength?, size?})`

**with:**

- `min?` — default: `0` — _minimal value (included)_
- `max?` — default: `0xffffffff` — _maximal value (included)_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.uint32Array();
// Examples of generated values:
// • Uint32Array.from([3829422059,2425734304,2138206756])
// • Uint32Array.from([19,1046862664])
// • Uint32Array.from([3669232337,2464093827,3748932991,1057761988,4236064175,4122041182,1618733983,882909472])
// • Uint32Array.from([269035825,2242944705,2375219908])
// • Uint32Array.from([755444117,555135045,2658796072,3505820369,3087063619])
// • …

fc.uint32Array({ max: 42, minLength: 1 });
// Examples of generated values:
// • Uint32Array.from([40,10,16,0,0,41])
// • Uint32Array.from([22,28])
// • Uint32Array.from([24])
// • Uint32Array.from([38])
// • Uint32Array.from([1])
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/uint32Array.html).  
Available since 2.9.0.

## float32Array

Generate _Float32Array_

**Signatures:**

- `fc.float32Array()`
- `fc.float32Array({min?, max?, noDefaultInfinity?, noNaN?, minLength?, maxLength?, size?})`

**with:**

- `min?` — default: `-∞` and `-3.4028234663852886e+38` when `noDefaultInfinity:true` — _lower bound for the generated 32-bit floats (included)_
- `max?` — default: `+∞` and `+3.4028234663852886e+38` when `noDefaultInfinity:true` — _upper bound for the generated 32-bit floats (included)_
- `noDefaultInfinity?` — default: `false` — _use finite values for `min` and `max` by default_
- `noNaN?` — default: `false` — _do not generate `Number.NaN`_
- `noInteger?` — default: `false` — _do not generate values matching `Number.isInteger`_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.float32Array();
// Examples of generated values:
// • Float32Array.from([])
// • Float32Array.from([-12.122719764709473,-8057332.5,-8.5333065779299e-31,4.203895392974451e-45,-1.401298464324817e-45,2.5223372357846707e-44,-0.15196290612220764,-3.4028190042551758e+38,3.741597751304629e-28,1.401298464324817e-44])
// • Float32Array.from([-3.24799757855888e-21])
// • Float32Array.from([-13627700375715840,-2.4350556445205305e+37,-1.392195136951102e-9,-2374.965087890625,4.244262896690998e-8,-5.161676815695077e-19,-0.20675736665725708])
// • Float32Array.from([1.7366975231216193e-20,-2977645988174364700,2.589363879539297e+31,1.8031471498217155e-12,4.5007039497195254e+25])
// • …

fc.float32Array({ minLength: 1 });
// Examples of generated values:
// • Float32Array.from([2.0374531922717765e-11])
// • Float32Array.from([30.016468048095703,2.1674793240938824e+30])
// • Float32Array.from([-2.6624670822171524e-44,-8.629187158980245e+32,-3.4028226550889045e+38,-3.0828566215145976e-44,-170087472,90606641152,2.449428132964808e-27,6.091665951650796e-23])
// • Float32Array.from([3.4028190042551758e+38])
// • Float32Array.from([-3.4028190042551758e+38])
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/float32Array.html).  
Available since 2.9.0.

## float64Array

Generate _Float64Array_

**Signatures:**

- `fc.float64Array()`
- `fc.float64Array({min?, max?, noDefaultInfinity?, noNaN?, minLength?, maxLength?, size?})`

**with:**

- `min?` — default: `-∞` and `-Number.MAX_VALUE` when `noDefaultInfinity:true` — _lower bound for the generated 32-bit floats (included)_
- `max?` — default: `+∞` and `Number.MAX_VALUE` when `noDefaultInfinity:true` — _upper bound for the generated 32-bit floats (included)_
- `noDefaultInfinity?` — default: `false` — _use finite values for `min` and `max` by default_
- `noNaN?` — default: `false` — _do not generate `Number.NaN`_
- `noInteger?` — default: `false` — _do not generate values matching `Number.isInteger`_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.float64Array();
// Examples of generated values:
// • Float64Array.from([])
// • Float64Array.from([-301377788.37725013,-1.7149147913092319e-97,8e-323,1e-323,-4e-323,-2.057106358614005e-7,3.7791002743330725e-63,5e-323,7e-323,-2.7469348785639148e+224])
// • Float64Array.from([-1.1619421936685911e-164])
// • Float64Array.from([-7.651385650429631e+128,-8.869426164279998e-72,4.233071733934197e-64,-0.000002350752021139201,7.038756466481596e-175,126806475960244.08,1.1085581712589228e+178])
// • Float64Array.from([3.477655531645621e-163,8.482885727970808e+246,8.005016653709244e+200,-1.6308036504155555e+224,-1.8149570511597214e-122])
// • …

fc.float64Array({ minLength: 1 });
// Examples of generated values:
// • Float64Array.from([1.179182805455725e-90])
// • Float64Array.from([33830772.59796326,4.4e-323])
// • Float64Array.from([4.4e-323,-2.0609982364042263e+263,8.629895099097848e+77,1.4155962948371038e-248,-1.9599359241539372e+245,5.117175856556106e-218,3.0325723805645807e-84,-1.7976931348623147e+308])
// • Float64Array.from([1.7976931348623147e+308])
// • Float64Array.from([-1.7976931348623147e+308])
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/float64Array.html).  
Available since 2.9.0.

## bigInt64Array

Generate _BigInt64Array_

**Signatures:**

- `fc.bigInt64Array()`
- `fc.bigInt64Array({min?, max?, minLength?, maxLength?})`

**with:**

- `min?` — default: `-18446744073709551616n` — _minimal value (included)_
- `max?` — default: `18446744073709551615n` — _maximal value (included)_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal length (included)_

**Usages:**

```js
fc.bigInt64Array();
// Examples of generated values:
// • BigInt64Array.from([7780786618611046569n])
// • BigInt64Array.from([3321688158611740109n,5336242056478727470n,-620335768501958405n])
// • BigInt64Array.from([])
// • BigInt64Array.from([7655040194619891365n,-609033188233272247n,-3377172262367663000n,-6575651731349736555n,-194007844161260784n,2956209257781779103n])
// • BigInt64Array.from([-463701052756207261n,7371548932979131799n,-7877987368304813406n,8509643815846265359n,-6285842279948105755n,-7977810195168624590n,-8632461560578801824n,-764227837462381748n])
// • …
fc.bigInt64Array({ min: 0n, minLength: 1 });
// Examples of generated values:
// • BigInt64Array.from([5794385668286753317n,9223372036854775800n])
// • BigInt64Array.from([7250361649856044302n,4310753745190106570n,5393690158673113485n,6842387272625948355n,4514914117086513826n,4933290198875114684n,4355527851938090954n,5722670493121068189n,7946781874214666176n,5681273141705345352n,3400318954538433694n,9140895324085985125n])
// • BigInt64Array.from([7017002079469492577n,8064792390940992730n,5210011569993732916n,7871654509320106441n,5389875796080866293n,842396779505087393n,3513990769024304909n,7624709996764891089n,8471604102740905558n,2981767532172910000n,2216100277924575184n,3375835224553658028n])
// • BigInt64Array.from([1n,6n,10n])
// • BigInt64Array.from([2317294315139044277n,2480040720574581119n,7841528177112379523n])
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/bigInt64Array.html).  
Available since 3.0.0.

## bigUint64Array

Generate _BigUint64Array_

**Signatures:**

- `fc.bigUint64Array()`
- `fc.bigUint64Array({min?, max?, minLength?, maxLength?})`

**with:**

- `min?` — default: `0n` — _minimal value (included)_
- `max?` — default: `36893488147419103231n` — _maximal value (included)_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal length (included)_

**Usages:**

```js
fc.bigUint64Array();
// Examples of generated values:
// • BigUint64Array.from([])
// • BigUint64Array.from([5117275114603473262n,4394569470798804304n,6920020017401806060n,5258603306780069742n,15799194364432350385n,15072217045501931685n,9890565973553172882n,1706618215611458822n])
// • BigUint64Array.from([8447847048858851281n])
// • BigUint64Array.from([3878267431246446816n,18446744073709551614n,17n])
// • BigUint64Array.from([18446744073709551606n,7n,11n,14792271127527525943n,17496620028939466016n,14087698165858284533n,1059307009916302871n])
// • …
fc.bigUint64Array({ max: 42n, minLength: 1 });
// Examples of generated values:
// • BigUint64Array.from([5n,38n,18n,24n,14n,0n,31n,38n])
// • BigUint64Array.from([4n,1n,0n])
// • BigUint64Array.from([13n,1n,41n,1n,15n,0n])
// • BigUint64Array.from([1n])
// • BigUint64Array.from([7n,32n,23n,23n,10n,9n,24n,29n,11n,21n])
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/bigUint64Array.html).  
Available since 3.0.0.
