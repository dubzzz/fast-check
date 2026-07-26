---
slug: /core-blocks/arbitraries/fake-data/file/
---

# File

Generate file content values.

## base64String

Base64 string containing characters produced by `fc.base64()`.

Provide valid base64 strings: length always multiple of 4 padded with '=' characters.

**Signatures:**

- `fc.base64String()`
- `fc.base64String({minLength?, maxLength?, size?})`

**with:**

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal number of characters (included if multiple of 4)_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

_When using `minLength` and `maxLength` make sure that they are compatible together. For instance: asking for `minLength=2` and `maxLength=3` is impossible for base64 strings as produced by the framework_

**Usages:**

```js
fc.base64String();
// Examples of generated values: "", "J7B8AB/V89==", "3H9Pr5M=", "bv6z", "V/GSu73r"…

fc.base64String({ maxLength: 8 });
// Note: Any base64 string containing up to 8 (included) characters
// Examples of generated values: "f3A+nr==", "37/7", "", "wC9q", "BLop9YK="…

fc.base64String({ minLength: 8 });
// Note: Any base64 string containing at least 8 (included) characters
// Examples of generated values: "f3A+nrd9UefIFrD27/==", "7/7+S88//DE/6M9QPAFg", "9refalueODsnam==", "toString", "callerkeyC8="…

fc.base64String({ minLength: 4, maxLength: 12 });
// Note: Any base64 string containing between 4 (included) and 12 (included) characters
// Examples of generated values: "YQ7D/IU8fE+2", "tjhMHtq9", "property", "9lm8Vx7bBF==", "roto"…
```

Resources: [API reference](/docs/api/functions/base64String).  
Available since 0.0.1.

## json

JSON compatible string representations of instances. Can produce string representations of basic primitives but also of deep objects.

The generated values can be parsed by `JSON.parse`.
All the string values (from keys to values) are generated using `fc.string()`.

**Signatures:**

- `fc.json()`
- `fc.json({depthSize?, maxDepth?, noUnicodeString?, stringUnit?})`

**with:**

- `depthSize?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#depth-size-explained) — _how much we allow our recursive structures to be deep?_
- `maxDepth?` — default: `Number.POSITIVE_INFINITY` — _maximal depth of generated objects_
- `noUnicodeString?` — default: `true` — _toggle on/off the generation of strings used either as keys or values of the instance and including non-ascii characters — shadowed by `stringUnit`_
- `stringUnit?` — default: `undefined` — _customize the set of characters being used by the `string` arbitrary_

**Usages:**

```js
fc.json();
// Examples of generated values:
// • "[\"oU6LT>'\",{\"Z#YU\":true,\"Pc#B\":null,\">*49wq&B1\":null,\"n=\":\"CZTPpisxH\",\"u`)})\":\"_a-\",\"\":null,\"dY~Dn>k\":true,\"=nC#&uS5l%\":\"0\\\"j-o,JV\"},[[],\"EfS;\\\"k'\",false]]"
// • "\"al[->g\""
// • "null"
// • "-5e-323"
// • "[null,-1.5485504457576672e+192,null,{},-1.417727947024272e-287,null,null,null]"
// • …

fc.json({ noUnicodeString: false });
// Examples of generated values:
// • "{}"
// • "[{\"򦇘󜁳򁿳򎗯􈤘\":-6.105777408643394e-70,\"򈷩𫨹􏥃򤵪񥉨񢦜꣙\":[],\"񬘲񊺱򨩟𔹱󦌞􋚫𵢮򉲨򛨰𜥲\":null,\"􀤯\":\"񵟈뫖򖂅𦧠򎇩򁅥򹀿񱣒\",\"򲊷񥛡򂝱\":null,\"𩪎񡨫񝗻򱟬񖄕󿧶🣺𾹚\":\"񙏶𒝠𨚜󸟗񭗊􄓎򅆁\"},null,[false,null]]"
// • "\"򁤇𫍯􏿬\\u0004񞋰\\u0005򟱉򳟔󽐾\""
// • "[null,[6e-323],[]]"
// • "[null,false]"
// • …

fc.json({ maxDepth: 0 });
// Examples of generated values: "null", "\"T\"", "-1.6050118268310372e-215", "true", "\"Ep\""…

fc.json({ maxDepth: 1 });
// Examples of generated values: "{\"V~<\\\"#}\":\"apply\"}", "{\"DZ&2@~yE\":4.016561322014934e-232}", "null", "true", "{}"…

fc.json({ depthSize: 'medium' });
// Examples of generated values:
// • "4.4e-323"
// • "[\"v!56\",true,{},true,1.294267936970972e+59,{},3.120825108816049e-235]"
// • "5e-323"
// • "{\"valueOf\":{\"Cu2[ '}\":null,\"u\":null,\" \":-3.513352379596904e-60,\"\":false,\"&* ~o\":[],\"^6Y\":false,\"dc{T\":false,\"{b*Ow\":[]},\"+yN`HsBaY\":[],\".f[*vo\":[[],[],{}]}"
// • "{\"5\":[null,[],1.6520984130948745e+39,false,3.565749886076134e+238],\"L|hZ\":{},\"~(\":{},\"4jKldvae;X\":\"(bvLV5Q\",\"\":1.267307532296178e-55}"
// • …
```

Resources: [API reference](/docs/api/functions/json).  
Available since 0.0.7.

## jsonValue

Generate any value eligible to be stringified in JSON and parsed back to itself - _in other words, JSON compatible instances_.

As `JSON.parse` preserves `-0`, `jsonValue` can also have `-0` as a value.
`jsonValue` must be seen as: any value that could have been built by doing a `JSON.parse` on a given string.

:::info Note
`JSON.parse(JSON.stringify(value))` is not the identity as `-0` is changed into `0` by `JSON.stringify`.
:::

**Signatures:**

- `fc.jsonValue()`
- `fc.jsonValue({depthSize?, maxDepth?, noUnicodeString?, stringUnit?})`

**with:**

- `depthSize?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#depth-size-explained) — _how much we allow our recursive structures to be deep?_
- `maxDepth?` — default: `Number.POSITIVE_INFINITY` — _maximal depth for generated objects (Map and Set included into objects)_
- `noUnicodeString?` — default: `true` — _toggle on/off the generation of strings used either as keys or values of the instance and including non-ascii characters — shadowed by `stringUnit`_
- `stringUnit?` — default: `undefined` — _customize the set of characters being used by the `string` arbitrary_

**Usages:**

```js
fc.jsonValue();
// Examples of generated values:
// • true
// • {"a":false,"&{v%":true,"O}u&;O":"ef","^69fY8G[M":false,"^%":null,"iC":-2.11992523062418e-82,"F%]8l0g6|":null}
// • [{},{".`1Y":null,"":"c>u(_5","z":"E\\~zB^B","HZM9R<-RA":true,"FI88='":null,"$":"x`","r4":-207.48134248014782,">6)\\<\"ZNM":"92PP;Icocb","`Cv":false}]
// • false
// • [null,true,true,"`l+$I","kSros",null]
// • …

fc.jsonValue({ noUnicodeString: false });
// Examples of generated values: ["򴾼󹤷𡅤񤱓򛗡"], {"􎵔򲁼򀎈𸝔􃌅􊿛񹙦":[],"_":[556603.8398649627],"􏿽\u000b򸑽":{}}, [null,[]], "򐐩", []…

fc.jsonValue({ maxDepth: 0 });
// Examples of generated values: true, null, false, "prototype", "L4)5M"…

fc.jsonValue({ maxDepth: 1 });
// Examples of generated values:
// • 1.1084525170506737e-156
// • [null,"co",null]
// • [null,null]
// • [null,"_",-4.808983581881553e-305,1.3122779113832298e-87,"<tiQ8",null]
// • true
// • …

fc.statistics(fc.jsonValue(), (v) => {
  function size(n) {
    if (Array.isArray(n)) return 1 + n.reduce((acc, child) => acc + size(child), 0);
    if (typeof n === 'object' && n) return 1 + Object.values(n).reduce((acc, child) => acc + size(child), 0);
    return 1;
  }
  const s = size(v);
  let lower = 1;
  const next = (n) => (String(n)[0] === '1' ? n * 5 : n * 2);
  while (next(lower) <= s) {
    lower = next(lower);
  }
  return `${lower} to ${next(lower) - 1} items`;
});
// Computed statistics for 10k generated values:
// For size = "xsmall":
// • 1 to 4 items..100.00%
// For size = "small":
// • 1 to 4 items....49.55%
// • 5 to 9 items....29.99%
// • 10 to 49 items..20.46%
// For size = "medium":
// • 50 to 99 items....33.95%
// • 1 to 4 items......33.88%
// • 10 to 49 items....25.23%
// • 100 to 499 items...6.73%
// • 500 to 999 items...0.12%

fc.statistics(fc.jsonValue({ maxDepth: 2 }), (v) => {
  function size(n) {
    if (Array.isArray(n)) return 1 + n.reduce((acc, child) => acc + size(child), 0);
    if (typeof n === 'object' && n) return 1 + Object.values(n).reduce((acc, child) => acc + size(child), 0);
    return 1;
  }
  const s = size(v);
  let lower = 1;
  const next = (n) => (String(n)[0] === '1' ? n * 5 : n * 2);
  while (next(lower) <= s) {
    lower = next(lower);
  }
  return `${lower} to ${next(lower) - 1} items`;
});
// Computed statistics for 10k generated values:
// For size = "xsmall":
// • 1 to 4 items..100.00%
// For size = "small":
// • 1 to 4 items....50.02%
// • 5 to 9 items....33.14%
// • 10 to 49 items..16.84%
// For size = "medium":
// • 1 to 4 items......34.60%
// • 50 to 99 items....33.01%
// • 10 to 49 items....26.56%
// • 100 to 499 items...4.49%
// • 5 to 9 items.......1.34%
```

Resources: [API reference](/docs/api/functions/jsonValue).  
Available since 2.20.0.

## lorem

Lorem ipsum values.

**Signatures:**

- `fc.lorem()`
- `fc.lorem({maxCount?, mode?, size?})`

**with:**

- `maxCount?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — if `mode` is `"words"`: lorem ipsum sentence containing at most `maxCount` sentences, otherwise: containing at most `maxCount` words\_
- `mode?` — default: `"words"` — _enable sentence mode by setting its value to `"sentences"`_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.lorem();
// Examples of generated values:
// • "magna ullamcorper iaculis purus nec"
// • "lorem"
// • "eu semper lectus mauris sed in nulla non scelerisque massa enim cras"
// • "mauris arcu cras molestie"
// • "euismod"
// • …

fc.lorem({ maxCount: 3 });
// Examples of generated values: "duis enim nonummy", "consequat pharetra iaculis", "sollicitudin mi curabitur", "faucibus", "cursus sit ac"…

fc.lorem({ maxCount: 3, mode: 'sentences' });
// Examples of generated values:
// • "Nec, dolor congue vitae pellentesque orci amet."
// • "Amet augue metus nibh rhoncus nulla morbi dui sed ac. Aliquam massa, et vestibulum integer suscipit magna pellentesque nonummy. Mi tellus, posuere vestibulum nibh."
// • "Ullamcorper orci ipsum diam ultrices convallis mollis, ullamcorper. Vitae faucibus bibendum ligula."
// • "Elementum semper iaculis ligula mauris ipsum mauris. Cursus massa nulla semper feugiat, sed scelerisque."
// • "Vitae. Dolor primis aenean convallis adipiscing mauris in odio ante. Massa, faucibus."
// • …
```

Resources: [API reference](/docs/api/functions/lorem).  
Available since 0.0.1.
