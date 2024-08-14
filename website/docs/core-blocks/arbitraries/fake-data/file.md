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

Resources: [API reference](https://fast-check.dev/api-reference/functions/base64String.html).  
Available since 0.0.1.

## json

JSON compatible string representations of instances. Can produce string representations of basic primitives but also of deep objects.

The generated values can be parsed by `JSON.parse`.
All the string values (from keys to values) are generated using `fc.string()`.

**Signatures:**

- `fc.json()`
- `fc.json({depthSize?, maxDepth?, noUnicodeString?})`

**with:**

- `depthSize?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#depth-size-explained) — _how much we allow our recursive structures to be deep?_
- `maxDepth?` — default: `Number.POSITIVE_INFINITY` — _maximal depth of generated objects_
- `noUnicodeString?` — default: `false` — _toggle on/off the generation of strings used either as keys or values of the instance and including non-ascii characters_

**Usages:**

```js
fc.json();
// Examples of generated values:
// • "[\"󻩔󭄭񛸧𥶾􂃧𸱜򔇗\",{\"𒘃𑌛񈍹󢊡򨬓񓮩󏌠𓧝\":null,\"輪\":null,\"򪵏励򍟿\":{\"􃛃𜱶󿡭򬍽񰕁󏈷𲬄󑡩񉹐\":\"􆽔𲷎򝣢񫫓񼚝񇧗󃠁🾵񫹻\",\"񴩒𹳡󠠺񆥜󍍣\":\"󃵓򉟱򫡽\",\"\":null},\"񑚖򍶛򐩪󯛮򘧋󰋀򶯻\":true,\"󪙯򍂤򨳟󛬱󥹮󨖻󒉺𱚃񗊸񦐊\":\"𥣍𗃦󪉬򮧘򓁣󄼮𣰶󒁑\",\"񠢐󡣆񗻊򾴅󓦃񁜆\":-1.7084671585468263e+151,\"򭄹\":true,\"𸮀𸥊񗹣𪀏􃚅􊀞񀆿\":\"󥓿򴡕󟢐󜅩󍊍󞴽\"},[]]"
// • "\"󤣻󦲡𗵤񙵒󙼮󋘝\""
// • "null"
// • "-5e-323"
// • "[null,-1.5485504457576672e+192,null,{},-1.417727947024272e-287,null,null,null]"
// • …

fc.json({ noUnicodeString: true });
// Examples of generated values:
// • "false"
// • "{\"x` n\":{\"%#x%}\":false},\"~\\\"\":null}"
// • "{\"q-wA)Xkf\":5e-323,\"\":485669012.414778,\"3EdL\\\"<d\\\\\":\" xB\",\"Y\":\"\"}"
// • "[[true,1.797693134862314e+308],-5e-324]"
// • "[[true,-6.3633703439727745e-298,-8.342219703457e+160,null,null,null,null,true,null,\"bKHWG\"],false,{\"fT\":null,\"3Xo1]$\":-8.544135769497182e-205,\"+a\":[{\"Rnr\":true,\"4KX$^o{tJ%\":\"Au7,>\",\"iby+..\":false,\"@*\":{\"\":\"6`eA0!sq\",\"m]nJt[l/8\":false},\"7.m\":\"VTw{&df8\",\"]@tZ_[i?..\":true,\"\":null,\"{\":5.500844800932969e+99,\"J.\":false,\"FAHsJ`\":6.171117362141616e+62},-1.0197657133028578e+151,1.2299011910073793e-140],\"WSzn!OI\":null}]"
// • …

fc.json({ maxDepth: 0 });
// Examples of generated values: "null", "\"񳕡\"", "-1.6050118268310372e-215", "true", "\"򌏺󈡹\""…

fc.json({ maxDepth: 1 });
// Examples of generated values: "{\"葍􏿱򉷊\\\"1𛘍\":\"apply\"}", "{\"񛀑𿄂􆻘󐩗򖋮􏿱􏿺𛗦\":4.016561322014934e-232}", "null", "true", "{}"…

fc.json({ depthSize: 'medium' });
// Examples of generated values:
// • "4.4e-323"
// • "[\"󖁔񛄲󅴍񜳩\",true,{\"󬁰񢵵񸹹򜥹󝹮𹹧\":\"󻊽𴣊򘳫\",\"񵢚񭖂򨞛\":true,\"򔼲򴻵󯖵򽩂𲓖򻟽򝗯񎔰􋊢\":\"򌲔񖼧񹣜򪪧񍩵򡪅򢘇\",\"񌮘𩻣񸉊󟅘򵁄󨍉񈙵𤈇򣽲񩝙\":\"򐻥򒜻򣒖򧭡𷝙󵘷珧\",\"򝇥􃙭\":5.763682596504741e-124,\"򰣕\":5.506486779037679e+86,\"󼫆\":false,\"򈗈𤮳򰏪񹓰\":null},null,true,false,null]"
// • "5e-323"
// • "{\"valueOf\":{\"򩠲𾉾񗅣󸁐𫲢\":{\"񟷏򍤧\":{\"񹐷򟑰񍳲𽨁򑛛\":false,\"񡶽񨴵󦫃򳰻񨠸񪧼󿠄\":\"𭃲񹧄𣟭񌁲񯯽򎶦󟪗񁮻\"},\"񳋝󏂝񪀔򹦂𠦞󧅇\":{\"񄾽𙒞񈷜矧𯍇󯾏硴\":\"\",\"𕍢󢗴𵥤򣛗𮎤𭝓󡴧\":266593828340.0835,\"𛱭庨蝙􌔯儅󨧰񂰋󨅆򓦩ㇽ\":3.854574422896131e-236,\"\":-3.136445144286352e-152,\"鴭򄉎汉󆂏𖏇򲳵𱯚񸿗񶋓\":null,\"\":true,\"򗇄񟩿󡗐\":\"𤜆󶡁󖖚񛨂𔺴\"},\"󠈤󝃫󋊠񻒷񒴠򱧄򌧭򋕢񱱿\":null,\"򔇚𥏢𕀷󳕅󛑣砅󺶸󝦟𫊈𹄇\":{\"󠔔񽺪񼾙𚘼𸴌󩁴򏠱񲐿𖷙\":\"񃦧\",\"𱞖󭞆񲊧\":1.5292990047864634e-116,\"󚍯𙫦򢄺򗫏򞲯̗\":-1.7059350714655333e+80,\"򋡟󸕨򊈐\":false,\"񎠎򸫽򓦝殊򈂲𺫨󧛁𷉣򀤒񑎶\":\"򮢰򦌺󑟼\",\"\":null,\"򛳓\":\"򨼒􀦹󚩃񍪊񰑳𼻰񄪥򏛨𖪂󉅆\",\"򹉌􏐶󠬽򨏟󬹥򮦇\":\"񻗇񦳄𵦥򇕭񹻖񇓅򈆸󮖬\",\"􅂹񐥔󔺁󶓧𕖸񐋌\":true,\"񆠹񯪵\":null},\"󮯬񗧙𕏊𫉻񔈝򭛢󮡘𱝙򼍛𚂆\":[null]}},\"򌇯ග򧭸󛿼꽎򆚿\":{\"b\":{\"\":null,\",򵗉\":\"򛹙񙂁񺆉\",\"񙰥񌏩󦼃\":1.7976931348623147e+308,\"􏿷򍨳甒(1񇟙󝘄񫆥񗅘\":null,\"򨘴􈤩󿾟򠝣𺧵񒠒󄍘񱵫\":\"񝝫𻗆󽧢󤳈򟈔񾗽㿹𱛡򰤿򍲠\",\"󗓁𙂯񿋮񬟺򾗇򹺠\":true,\"+񱱫\\\"\":\"񌤍򗴇𡉔𼛬\"},\"󀾻󱶼񚼳𻟖󪛫𷥜𬐍􋬡󰰁󒍰\":null,\"1-2򼀱􏿭􏿻􏿳\":null,\"󦏓𣐒󨞿󼉌󸭌駨󪳟\":[null,\"𢙿\",null,1.627654078166552e+223,null,null,\"󛟫\",\"򠲥𼛬\",-1.137436331927833e+42,-3.0030877534684717e+142],\"'󆋰񭆿\":{\"񬋣򟘾򫵛򡝨\":null,\"񍦡􈮍򄎔􍖴􅴻򑿀\":null,\"񚿷񗋁\":\"򶨪䘢𳗓󄋤񎰨\",\"떰򛵀􍤡\":-4.396133099620614e-146,\"񇆒񟳺򯧜󂬟񏩥󥐒񓬳ꏿ󬝊򼴌\":null,\"򯳞򋯈\":true,\"򛌦񱐔񸁀򯥖\":1.8766725492972305e-96,\"\":null,\"ꭟ򵑣𠠨𓃏񿻳󔺨񎀩\":null,\"򏃳\":null},\"󑕙􊲄򰞝򽬼񸌐𤨱\":\"񆃽\",\"􉿽󏨜󺏝򬡿򲐻󴅵򺛤\":0,\"𩾸\":null,\"󒱭침񵛀􁎓񦙇\":true,\"\":\"apply\"},\"𒧕\":[7.6086682491958856e-146,{\"񎙉򜪅󵜭񗆁뀦\":null,\"𱈻\":\"\",\"񦛞񍢼򩼭򒏧𥥁󀼬󇀪񎎅𬜟򚌈\":\"𬙘𧢽򟜫󨔭񥗂󞇤浮񖩥󑔷\",\"򏻅𥿋󶃏󰶰򟗎𿃽𓂩\":null,\"𛊃󬎤󌽛\":false,\"򩫪󅪻󗓨\":-7.067638177674602e+76},\"圩򎽘񼟈񧖨񬂡󕦉򢤶󥸙\",null,[2.219624217009348e-22,-9.770861754123764e+110,true,null,\"񰠦ଞ񛮿񴄒򴀯򡇩\",null,null],true,1.2718114310572915e+272,true,true]}"
// • "{\"򈥬𢲄󭴁󁴾\":{\"򹳛󖩄\":\"񜔟𞏷򊁫񕘌𷑅󦹨򁔌󮧁򵺥󞓸\",\"򓛦𷆍򏐾󦛋\":null,\"\":4.163017031290256e+162,\"򿐃񧪙󂼞\":null,\"󀺹󞞝𔬟󃡼\":true,\"񪐝򅄡򊜔񑆖񺵺󼃅\":false,\"󃟙󝭟󪘉򠕧󤅵𜑉𰲰񿇊𝖱󅸧\":-5.298684866824531e+64},\"􀍦񏪍󴗱󦝝󂲥򛕋򙳶󣆣󱋦򠢰\":{},\"𿎆򻽺󨣩󡆥𶤀񃐼򇶜\":[true,\"󒙠򊵝𰑵򼑎󧮼򾭗񀳫\",{\"񥗸򣃕񟌛𵡶𮯈񃻅񜦋𩉋􉤎񶽑\":null,\"񜩏󈫕􏵬򂽥𔁘񸅪\":null},1.973826918030355e-291,{\"񣷥\":-2.1122181366513202e+135,\"𒑔򕳉񌕲򩟓􏠣\":-1.351657689147719e-183,\"󙅧鮺򝜬򹱇򯑊柟򖄠\":6.329905233731848e-285,\"𵑐􄚩񆔴󢄃嚎󃇹󯹩𩨮\":null,\"𾮢󑬘񦻆𨪩󉑹񵋣\":\"𞥾򼛳񄖤𵏐򅐅\",\"𦝖𚧷\":null,\"𑥱𐑾𔓁򳢕\":\"𙖥񙧃𧃧𕷒\"}],\"\":{\"񏤳񣪏󆖗򧷸񍠘񽾛񙱫\":{\"񑥧\":false,\"󛎤񬍁򇞟񜪲ꕈ򷚻𠙊\":false}},\"򧫽𝋁򷬞􄟬𛄗󒇓񥣆򭝅ᡡ\":{\"񻐯򋈸􅹬𹨰򢋱󝐕󴙍\":null,\"󆱿򎢆񸝾𻁌蓿𯶽򄿖\":{\"򋫥𫹘򽅼𼏨񦽡𬋨󯘵񈤾򷸐\":true,\"𧡊󲜡򨪔򌘾򀬃\":\"󧚟򉐠򱤞󝰂񸟸򟫃񩐐𤷪񼲮\",\"\":\"񬩵\",\"򌢬򚄖񱶻󺺸𵒆򯼏󼫒򊧏\":-9.129273010709225e+288},\"󀠢񶆴섫򄕎񕃇򘣆񄀙􄞆񯘀󧐋\":null,\"񅙄񔲬\":-1.0758585287978389e-274,\"򶅏򗙌񀧠\":\"\",\"򅡫򖖳ெ󥝙񆙃\":\"񐤟𜁗\",\"󓝿򹣡𾘹󙎬􋍙\":true,\"󹟼𹖄򀲌\":\"󣫢𒕬𽫋𚱋\",\"󞐗򷁢򤑦􌉸ﶁ򮱐񥓰񭝁򀘹􉝎\":null}}"
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
- `fc.jsonValue({depthSize?, maxDepth?, noUnicodeString?})`

**with:**

- `depthSize?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#depth-size-explained) — _how much we allow our recursive structures to be deep?_
- `maxDepth?` — default: `Number.POSITIVE_INFINITY` — _maximal depth for generated objects (Map and Set included into objects)_
- `noUnicodeString?` — default: `false` — _toggle on/off the generation of strings used either as keys or values of the instance and including non-ascii characters_

**Usages:**

```js
fc.jsonValue();
// Examples of generated values:
// • true
// • {"a":false,"&򮍉򠟠%":true,"඙򞗚􃮽󃄼𯬳񗶍":"ef","񑿴𕊸󎈝񓰬񊋜򋽉𗌚򻚾񶸾":false,"𕦤%":null,"󘆥񙠴":-2.11992523062418e-82,"񫉡񝚢󧿿񀟖񼾟度𑛐񐿝򚉯":null}
// • [{"􀧻":true,"󠀼𓵩堨򹏿򨓹񊱕󔭢":-379313284684773500000,"񬴋綮񀖁񙤊򽞯􏷒󁕵򐢴":"򪏬","󊟡񿤎򉶂풑򺭇㘑":"򽬯","󊗌򡸵􌠨􆌐󌪰񙎋򰹨":null},1.2791945048214157e-72]
// • false
// • [null,true,true,"򷄂𰳍󔕅򱒞򡃻","좷񶟚𠹋󵥹񚣸",null]
// • …

fc.jsonValue({ noUnicodeString: true });
// Examples of generated values:
// • "xx]ZF."
// • [null,true,2.875000848829663e+119,"&k}%",null,",:!\"",null,false]
// • false
// • {"KZY{&DB+5-":null}
// • {"aRN6Cb1a":true,"":"Z`M>?%*","~:*.m11Af":-7.543315553550096e-34,"-q`rwk,Z":{"+R*:}Q":true,"!gkJF":false,"l6;D&Xk":")<Ay]Rw","XXI/;":"%^x&Wu.%",".+nIqIhA4":2.2853367367043913e+207},"\"\"ynKI":[null,"'_HQ\"bG",5.531421591396989e-40,"Zb5fY","3QgNI8I;!!",null,null,1.0846697849762912e+90,true]}
// • …

fc.jsonValue({ maxDepth: 0 });
// Examples of generated values: true, null, false, "prototype", "𚪃󫝛򼨠񲡻񸼭"…

fc.jsonValue({ maxDepth: 1 });
// Examples of generated values:
// • 1.1084525170506737e-156
// • [null,"co",null]
// • [null,null]
// • [null,"򊗕",-4.808983581881553e-305,1.3122779113832298e-87,"񋚜󷸃񏋦񽓂󜞵",null]
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
// • 10 to 49 items..38.41%
// • 5 to 9 items....17.63%
// • 50 to 99 items...0.17%
// For size = "medium":
// • 50 to 99 items......35.05%
// • 1 to 4 items........33.88%
// • 10 to 49 items......20.54%
// • 100 to 499 items....10.08%
// • 500 to 999 items.....0.40%

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
// • 5 to 9 items....33.99%
// • 10 to 49 items..21.37%
// For size = "medium":
// • 1 to 4 items......34.60%
// • 50 to 99 items....32.98%
// • 10 to 49 items....26.58%
// • 100 to 499 items...4.50%
// • 5 to 9 items.......1.34%
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/jsonValue-1.html).  
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

Resources: [API reference](https://fast-check.dev/api-reference/functions/lorem.html).  
Available since 0.0.1.
