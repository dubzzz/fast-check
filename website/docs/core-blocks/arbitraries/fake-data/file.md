---
slug: /core-blocks/arbitraries/fake-data/file
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
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default#size-explained) — _maximal number of characters (included if multiple of 4)_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default#size-explained) — _how large should the generated values be?_

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

Resources: [API reference](https://fast-check.dev/api-reference/functions/base64String.html).  
Available since 0.0.1.

## json

JSON compatible string representations of instances. Can produce string representations of basic primitives but also of deep objects.

The generated values can be parsed by `JSON.parse`.
All the string values (from keys to values) are generated using `fc.string()`.

**Signatures:**

- `fc.json()`
- `fc.json({depthSize?, maxDepth?})`

**with:**

- `depthSize?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default#depth-size-explained) — _how much we allow our recursive structures to be deep?_
- `maxDepth?` — default: `Number.POSITIVE_INFINITY` — _maximal depth of generated objects_

**Usages:**

```js
fc.json();
// Examples of generated values:
// • "[\"oU6LT>'\",{\"QZ#YUZNw\":null,\"#\":null,\")>*\":{\"q&B1cUDn=\":\"CZTPpisxH\",\"u`)})\":\"_a-\",\"\":null},\"dY~Dn>k\":true,\"=nC#&uS5l%\":\"0\\\"j-o,JV\",\"TX[OKj\":-1.7084671585468263e+151,\"\\\"\":true,\"@(:<LUW\":\"s-JYYB\"},[]]"
// • "\"al[->g\""
// • "null"
// • "-1e-322"
// • "[null,-1.5485504457576672e+192,null,{},-1.417727947024272e-287,null,null,null]"
// • …

fc.json({ maxDepth: 0 });
// Examples of generated values: "null", "\"T\"", "-1.6050118268310372e-215", "true", "\"Ep\""…

fc.json({ maxDepth: 1 });
// Examples of generated values: "{\"V~<\\\"#}\":\"apply\"}", "{\"DZ&2@~yE\":4.016561322014934e-232}", "null", "true", "{}"…

fc.json({ depthSize: 'medium' });
// Examples of generated values:
// • "2.6e-322"
// • "[\"v!56\",true,{\"n.Z-KP\":\"WeB\",\"%sT\":true,\"+vJj71IB1\":\"p\\\"9|V\\\".\",\"B~U)!j6>:0\":\"?]2R)hy\",\"<C\":5.763682596504741e-124,\"g\":5.506486779037679e+86,\"^\":false,\"0beh\":null},null,true,false,null]"
// • "-1e-322"
// • "{\"valueOf\":{\"hCu2[\":{\"}t\":{\"rC,RK\":false,\"|sD.+@+\":\"K?e5tLzu\"},\"*4 80r\":{\"=c8x 3^\":\"\",\"bv2;Pdc\":266593828340.0835,\"&F{b*Ow:tH\":3.854574422896131e-236,\"\":-3.136445144286352e-152,\"7 a[$t.f[\":null,\"S\":true,\"VdF\":\"zr}U[\"},\"suNX+*`0y\":null,\"GO*sBjC8G1\":{\"Bx5_>&C'l\":\"<\",\"8qI\":1.5292990047864634e-116,\"hKPYD5\":-1.7059350714655333e+80,\";-{\":false,\"-0/PeWhX)3\":\"-}|\",\"\":null,\"!\":\"H0(|XlzFMY\",\"peo`:V\":\"%#BLcJMT\",\"T+FOe$\":true,\"Z7\":null},\"zCA'ft\\\\l^J\":[null]}},\";oU_&9\":{\"b\":{\"\":null,\"%C\":\"+Lf\",\"%6>\":1.797693134862311e+308,\"}vi!#D[G\\\\\":null,\"g.q&2evf\":\"C^tirM8d?,\",\"4t4aCG\":true,\"$n\\\"\":\"(IbE\"},\"|Bt[MInNOk\":null,\"#&$gzzy\":null,\"bd7cNTL\":[null,\"D\",null,1.627654078166552e+223,null,null,\"g\",\"gr\",-1.137436331927833e+42,-3.0030877534684717e+142],\" j]\":{\"hlI1\":null,\"e1$j@B\":null,\"-!\":\"7<!94\",\"fM@\":-4.396133099620614e-146,\"RwN]?%U@b7\":null,\"KB\":true,\"k=z<\":1.8766725492972305e-96,\"\":null,\"~b1>42%\":null,\"G\":null},\":v FiA\":\"k\",\"VlI okG\":-1.4e-322,\"f\":null,\"%w*B}\":true,\"\":\"apply\"},\"l\":[7.6086682491958856e-146,{\"5\":\"\",\"Y)s.a\":null,\"0y]0ca@qm2\":\"inPS~K2q{\",\"S*Z*f&=\":null,\"-=u\":false,\"v.P\":-7.067638177674602e+76},\"$~1<?Pv_\",null,[2.219624217009348e-22,-9.770861754123764e+110,true,null,\"/.1Q%v\",null,null],true,1.2718114310572915e+272,true,true]}"
// • "{\"L|hZ\":{\"~(\":\"4jKldvae;X\",\"NU(b\":null,\"\":4.163017031290256e+162,\"K\\\"F\":null,\"o<|c\":true,\"< bZ] \":false,\"wS,Riq}CV4\":-5.298684866824531e+64},\"3md/a<_r{\\\"\":{},\"-Rcc`3_\":[true,\"xuY=Hd6 \",{\"5e(_%d9^0d\":null,\"^q#$iu\":null},1.973826918030355e-291,{\"k\":-2.1122181366513202e+135,\"fYxj@\":-1.351657689147719e-183,\"2<+2nm%\":6.329905233731848e-285,\"4y.!XKqc\":null,\"CSaX}b\":\"`J_fU\",\"nc\":null,\"OXR>\":\"^xW!\"}],\"\":{\"d1}%eQ=\":{\":\":false,\"bO9,.DM\":false}},\"4iK-j!9hx\":{\"xK^[~mT\":null,\"l2$7G5(\":{\"4%' 15&pK\":true,\"[$@Y`\":\"5EHH_d.@|\",\"\":\"\\\\\",\"E~[./|O3\":-9.129273010709225e+288},\"K\\\\;/4elg|$\":null,\"jr\":-1.0758585287978389e-274,\"~@S\":\"\",\",*I)0\":\"]7\",\"-!:NF\":true,\"(Dp\":\")3Fd\",\"(:^0XUcye2\":null}}"
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/json.html).  
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
- `fc.jsonValue({depthSize?, maxDepth?})`

**with:**

- `depthSize?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default#depth-size-explained) — _how much we allow our recursive structures to be deep?_
- `maxDepth?` — default: `Number.POSITIVE_INFINITY` — _maximal depth for generated objects (Map and Set included into objects)_

**Usages:**

```js
fc.jsonValue();
// Examples of generated values:
// • true
// • {"a":false,"&{v%":true,"O}u&;O":"ef","^69fY8G[M":false,"^%":null,"iC":-2.11992523062418e-82,"F%]8l0g6|":null}
// • [{"^":true,"1Y??Vih":-379313284684773500000,"_5zzvjCE":"B","B561n_":"2","eqHZM9R":null},1.2791945048214157e-72]
// • false
// • [null,true,true,"`l+$I","kSros",null]
// • …

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
// • 1 to 4 items....43.79%
// • 10 to 49 items..38.40%
// • 5 to 9 items....17.64%
// • 50 to 99 items...0.17%
// For size = "medium":
// • 50 to 99 items......35.06%
// • 1 to 4 items........33.88%
// • 10 to 49 items......20.48%
// • 100 to 499 items....10.21%
// • 500 to 999 items.....0.33%

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
// • 1 to 4 items....44.64%
// • 5 to 9 items....34.00%
// • 10 to 49 items..21.36%
// For size = "medium":
// • 1 to 4 items......34.60%
// • 50 to 99 items....33.01%
// • 10 to 49 items....26.56%
// • 100 to 499 items...4.49%
// • 5 to 9 items.......1.34%
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/jsonValue-1.html).  
Available since 2.20.0.

## unicodeJson

JSON compatible string representations of instances. Can produce string representations of basic primitives but also of deep objects.

The generated values can be parsed by `JSON.parse`.
All the string values (from keys to values) are generated using `fc.unicodeString()`.

**Signatures:**

- `fc.unicodeJson()`
- `fc.unicodeJson({depthSize?, maxDepth?})`

**with:**

- `depthSize?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default#depth-size-explained) — _how much we allow our recursive structures to be deep?_
- `maxDepth?` — default: `Number.POSITIVE_INFINITY` — _maximal depth of generated objects_

**Usages:**

```js
fc.unicodeJson();
// Examples of generated values:
// • "{\"ᥔßR\":{\"毟蜂唾缨Ⳡ眬\":{\"ᨢꉠ膃쩹㳩본⚁ꆾ䡫\":[\"毻쏳䉘빎酃糆ᚣ꥘ﻀ設\",1.4078094841036001e-67,\"┞\"],\"䧃䔝鉜饎ᠳ磙㾜\":\"㞫抮ꨛ퟼\",\"\":\"隻錒䕹嘗揣䱰̓ꖸ쳊\"},\"゙᯿錣龀槅꼌磱\":\"໮漠뻫ꅜ諩碶뒁铎\",\"㻁㞯鄄ᘕƛᙆ符緇矒鞹\":null,\"섿㺵ធ䕀\":true,\"㰘⮒泑ꚛ咸\":false,\"쵩傞漆뵠텐婢\":\"姍儵ඣ⽫⺞縺뗮㚃\",\"嫏ꨮ䣫\":-6.638526972924301e+52,\"ꔏ⽙䥽ѫ뢿䜻\":1.7943982562867058e+199}}"
// • "[]"
// • "[true,null,null,true,\"￿\",\"騨뷙ឣ푻꾴吉䚯\",false,null]"
// • "{\"᫄\":{\"坾ᦨ\":-1.9788421366816808e-82,\"駮㔽艕슑\":\"쓨♹訫뵥筭⪅䮹\",\"乓⃷觖\":null,\"㲾ペ钓睊虐\":80283984173685.53,\"泓ꑙᘤ⊫\":true,\"뤂䮽І眊ੋ竰\":\"\",\"鰲偅맟ద싏㠒嶬\":null},\"塜粼拺຿\":[null,true,null,{\"㧴䏄༳톏\":\"ꪰ篅酣ퟥ\",\"罟噝梹\":9.214173245947507e-111,\"녇몭㰡懬\":\"⻫캲뾦鱜퉵\",\"뀪妬鮯씅莝䮍䰃絡癿\":7.808042412941465e-176,\"䨺⺤ￗ莰⼵\":null,\"킀ᆍ闓⚘∥䓯옼\":null,\"\":null,\"ᮨ䌙杖ো䛞ᯈ\":false,\"鮁璟啵魬\":false,\"롘柺퇌⌓ꢏ⊓⟊渞望\":null}],\"혣㐀ࡰ䝯澨ဆ\":[[[\"⾒ꁿ\",\"㒱䖹Ѷ衔돵㤲畈\"],\"袼岌᧝퐿㾂\",null],\"䎿캮ᎍ쯍덪඘逹⃖釖\",true,null]}"
// • "true"
// • …

fc.unicodeJson({ maxDepth: 0 });
// Examples of generated values: "\"僘阘縝傚裷䀘\"", "null", "\"绠圞ⱺ\"", "true", "-2.3e-322"…

fc.unicodeJson({ maxDepth: 1 });
// Examples of generated values:
// • "[false,2.7321203973068163e+275,false,false,null,-9.218990816230408e-66]"
// • "{}"
// • "[\"ᅙ秱뵴ꇺ꿵玽鄧돟\",\"䕝\",null,\"䆩−ඍ㹏쭝း堥䗾兒\",\"샔ế\",false,true,\"缣켐駘\",\"Ӧ࠼䍝⇵鮤뉀㸓\"]"
// • "[false,\"❚姒쭧䠢\",1.4486395822832596e+27]"
// • "-1.8e-322"
// • …

fc.unicodeJson({ depthSize: 'medium' });
// Examples of generated values:
// • "\"荽醮郺旽粈㈾\""
// • "[null,{\"諄\":8.590711529263102e-8,\"薠롺□嬞⥨萳\":null,\"Ϊ᪤퟿䧂콂讵⨷噟쒖\":\"》㶄㞃ﾼॏ鼟所蛂\",\"ஒ䍛\":5.019276820129658e+122,\"佰㠋\":\"じ\",\"풧㌱옣\":null,\"돝쯧浹Ṋ኷\":true,\"紅ꪋ\":null,\"น騢∣⚓䅤앃\":2.7762012163115278e-173},true,true,\"ヲ볉ꇑ센鬥\",false,null,[true,null]]"
// • "false"
// • "{\"﷏꼲吽꡺㊐뿗茻\":null}"
// • "{\"腌ꊖ璄諰晜ᩝ鬬ᅗ\":true,\"\":{\"꽂ꥑ讧霵ꎽ歪䠯\":{\"눴Ó\":false}},\"嗒줹朗큶꡷獺\":[null,-4.581442170446369e-31,false,[-3.259931843441816e+90,[\"〚Ꮳ㟺㙰㒈♖暶ጼ\",null,true,\"䷷ﾵ쪲㝵谔挴\",\"殒ꬖ캩℻墊풺ⳁ䎕쳳\"],\"뺔櫆౅\",-5.824037460896646e-126,-1.2440275335144407e-110,2.2853367367043913e+207,false]],\"뺶閩頫䫉奈錏ꞛ\":\"ꦈ돬喵ᡝ떶ꨵ\",\"㾽ⲳ\":{\"극ꄆ橝촍毟\":\"呖턃䣯ꃪ淑湐愨鮫國\"}}"
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/unicodeJson.html).  
Available since 0.0.7.

## unicodeJsonValue

Generate any value eligible to be stringified in JSON and parsed back to itself - \_in other words, JSON compatible instances.

As `JSON.parse` preserves `-0`, `unicodeJsonValue` can also have `-0` as a value.
`unicodeJsonValue` must be seen as: any value that could have been built by doing a `JSON.parse` on a given string.

:::info Note
`JSON.parse(JSON.stringify(value))` is not the identity as `-0` is changed into `0` by `JSON.stringify`.
:::

**Signatures:**

- `fc.unicodeJsonValue()`
- `fc.unicodeJsonValue({depthSize?, maxDepth?})`

**with:**

- `depthSize?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default#depth-size-explained) — _how much we allow our recursive structures to be deep?_
- `maxDepth?` — default: `Number.POSITIVE_INFINITY` — _maximal depth for generated objects (Map and Set included into objects)_

**Usages:**

```js
fc.unicodeJsonValue();
// Examples of generated values:
// • null
// • [-4.295089174387055e-293,false,{"㾆⇈᎒ཱུ紻ﾷ":true,"膩᜸Ⱒᰑ䴿ㅓ붻":true,"㤫勮":null,"常洭":"❀紩푮뗼","":false,"遐伒㖤⩿":null,"쾪ꉱ絿ޒ":-1.6050931064928954e-96},null]
// • 3.4453237274410463e+71
// • []
// • [null,[null,{"鞘":false,"ᚄ秈搉糛힘ﯨ⯞":{"嗙":false,"뚹퐒孵ᱚ鼊":true,"ၓ醦ꨱ鲖䕬⁅蓌碈":false,"⭏횓醉ῂａ艒":null,"ﵦᙏ亚":-1.0765809081688447e-68,"麈껾땀ẚ㖡轹邹":2.7214577245022765e-88,"♔擥է宑놰꼒죵셃芮㱝":true},"ᡟ⽔䞊ɮ뽪":true}],"姖魡",{"죞鹕":null,"":"߸⸷","靄誾Ờꛙ࿠䞵ퟣ":"芓䞧굞늢뺄蹁ᮿ훱","䚬":-6.95950666926601e+110,"⹊꓌䘙࿈倡淕":"䚾忭㋟킛긮倹鷀","☂㰿㛈瓥⸸팭ުꊵ":"鞚꿖磆Ꮄゑꖦ","梣끲":2.609294368689059e-298,"팽":true}]
// • …

fc.unicodeJsonValue({ maxDepth: 0 });
// Examples of generated values: "Ĕ讆層ꦍ쩖䊼᛽ꙋ", null, 1.7976931348623047e+308, "", 2e-323…

fc.unicodeJsonValue({ maxDepth: 1 });
// Examples of generated values:
// • {"讆層ꦍ쩖䊼":true,"婝㖿ﺚ㔶벑Ἴ¤ﻣ诗":true,"蝌䥶膢瓣䥛䫀姐᥺":true,"ᓘ箜睺閊膛景븃犟":null,"ﯼ⛺㴞撟":true,"":false,"㍋豈漸核":-1.7683978910198014e+45,"玳":null,"境鲖":"뫞ຳ䐀啔"}
// • 1.7398076905782003e-265
// • "㩵詫,"
// • []
// • {"햧ཧ觌♘䣯Ⓖ崊䏓䵊":"","㋄ǋ膮朲㌦냔ℋፋ":true}
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/unicodeJsonValue.html).  
Available since 2.20.0.

## lorem

Lorem ipsum values.

**Signatures:**

- `fc.lorem()`
- `fc.lorem({maxCount?, mode?, size?})`

**with:**

- `maxCount?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default#size-explained) — if `mode` is `"words"`: lorem ipsum sentence containing at most `maxCount` sentences, otherwise: containing at most `maxCount` words\_
- `mode?` — default: `"words"` — _enable sentence mode by setting its value to `"sentences"`_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default#size-explained) — _how large should the generated values be?_

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

Resources: [API reference](https://fast-check.dev/api-reference/functions/lorem.html).  
Available since 0.0.1.
