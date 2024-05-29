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
// • "-1e-322"
// • "[null,-1.5485504457576672e+192,null,{},-1.417727947024272e-287,null,null,null]"
// • …

fc.json({ noUnicodeString: true });
// Examples of generated values:
// • "false"
// • "{\"x` n\":{\"%#x%}\":false},\"~\\\"\":null}"
// • "{\"q-wA)Xkf\":-2.5e-323,\"\":485669012.414778,\"3EdL\\\"<d\\\\\":\" xB\",\"Y\":\"\"}"
// • "[[true,1.797693134862315e+308],-4e-323]"
// • "[[true,-6.3633703439727745e-298,-8.342219703457e+160,null,null,null,null,true,null,\"bKHWG\"],false,{\"fT\":null,\"3Xo1]$\":-8.544135769497182e-205,\"+a\":[{\"Rnr\":true,\"4KX$^o{tJ%\":\"Au7,>\",\"iby+..\":false,\"@*\":{\"\":\"6`eA0!sq\",\"m]nJt[l/8\":false},\"7.m\":\"VTw{&df8\",\"]@tZ_[i?..\":true,\"\":null,\"{\":5.500844800932969e+99,\"J.\":false,\"FAHsJ`\":6.171117362141616e+62},-1.0197657133028578e+151,1.2299011910073793e-140],\"WSzn!OI\":null}]"
// • …

fc.json({ maxDepth: 0 });
// Examples of generated values: "null", "\"񳕡\"", "-1.6050118268310372e-215", "true", "\"򌏺󈡹\""…

fc.json({ maxDepth: 1 });
// Examples of generated values: "{\"葍􏿱򉷊\\\"1𛘍\":\"apply\"}", "{\"񛀑𿄂􆻘󐩗򖋮􏿱􏿺𛗦\":4.016561322014934e-232}", "null", "true", "{}"…

fc.json({ depthSize: 'medium' });
// Examples of generated values:
// • "2.6e-322"
// • "[\"󖁔񛄲󅴍񜳩\",true,{\"󬁰񢵵񸹹򜥹󝹮𹹧\":\"󻊽𴣊򘳫\",\"񵢚񭖂򨞛\":true,\"򔼲򴻵󯖵򽩂𲓖򻟽򝗯񎔰􋊢\":\"򌲔񖼧񹣜򪪧񍩵򡪅򢘇\",\"񌮘𩻣񸉊󟅘򵁄󨍉񈙵𤈇򣽲񩝙\":\"򐻥򒜻򣒖򧭡𷝙󵘷珧\",\"򝇥􃙭\":5.763682596504741e-124,\"򰣕\":5.506486779037679e+86,\"󼫆\":false,\"򈗈𤮳򰏪񹓰\":null},null,true,false,null]"
// • "-1e-322"
// • "{\"valueOf\":{\"򩠲𾉾񗅣󸁐𫲢\":{\"񟷏򍤧\":{\"񹐷򟑰񍳲𽨁򑛛\":false,\"񡶽񨴵󦫃򳰻񨠸񪧼󿠄\":\"𭃲񹧄𣟭񌁲񯯽򎶦󟪗񁮻\"},\"񳋝󏂝񪀔򹦂𠦞󧅇\":{\"񄾽𙒞񈷜矧𯍇󯾏硴\":\"\",\"𕍢󢗴𵥤򣛗𮎤𭝓󡴧\":266593828340.0835,\"𛱭庨蝙􌔯儅󨧰񂰋󨅆򓦩ㇽ\":3.854574422896131e-236,\"\":-3.136445144286352e-152,\"鴭򄉎汉󆂏𖏇򲳵𱯚񸿗񶋓\":null,\"\":true,\"򗇄񟩿󡗐\":\"𤜆󶡁󖖚񛨂𔺴\"},\"󠈤󝃫󋊠񻒷񒴠򱧄򌧭򋕢񱱿\":null,\"򔇚𥏢𕀷󳕅󛑣砅󺶸󝦟𫊈𹄇\":{\"󠔔񽺪񼾙𚘼𸴌󩁴򏠱񲐿𖷙\":\"񃦧\",\"𱞖󭞆񲊧\":1.5292990047864634e-116,\"󚍯𙫦򢄺򗫏򞲯̗\":-1.7059350714655333e+80,\"򋡟󸕨򊈐\":false,\"񎠎򸫽򓦝殊򈂲𺫨󧛁𷉣򀤒񑎶\":\"򮢰򦌺󑟼\",\"\":null,\"򛳓\":\"򨼒􀦹󚩃񍪊񰑳𼻰񄪥򏛨𖪂󉅆\",\"򹉌􏐶󠬽򨏟󬹥򮦇\":\"񻗇񦳄𵦥򇕭񹻖񇓅򈆸󮖬\",\"􅂹񐥔󔺁󶓧𕖸񐋌\":true,\"񆠹񯪵\":null},\"󮯬񗧙𕏊𫉻񔈝򭛢󮡘𱝙򼍛𚂆\":[null]}},\"򌇯ග򧭸󛿼꽎򆚿\":{\"b\":{\"\":null,\",򵗉\":\"򛹙񙂁񺆉\",\"񙰥񌏩󦼃\":1.797693134862311e+308,\"􏿷򍨳甒(1񇟙󝘄񫆥񗅘\":null,\"򨘴􈤩󿾟򠝣𺧵񒠒󄍘񱵫\":\"񝝫𻗆󽧢󤳈򟈔񾗽㿹𱛡򰤿򍲠\",\"󗓁𙂯񿋮񬟺򾗇򹺠\":true,\"+񱱫\\\"\":\"񌤍򗴇𡉔𼛬\"},\"󀾻󱶼񚼳𻟖󪛫𷥜𬐍􋬡󰰁󒍰\":null,\"1-2򼀱􏿭􏿻􏿳\":null,\"󦏓𣐒󨞿󼉌󸭌駨󪳟\":[null,\"𢙿\",null,1.627654078166552e+223,null,null,\"󛟫\",\"򠲥𼛬\",-1.137436331927833e+42,-3.0030877534684717e+142],\"'󆋰񭆿\":{\"񬋣򟘾򫵛򡝨\":null,\"񍦡􈮍򄎔􍖴􅴻򑿀\":null,\"񚿷񗋁\":\"򶨪䘢𳗓󄋤񎰨\",\"떰򛵀􍤡\":-4.396133099620614e-146,\"񇆒񟳺򯧜󂬟񏩥󥐒񓬳ꏿ󬝊򼴌\":null,\"򯳞򋯈\":true,\"򛌦񱐔񸁀򯥖\":1.8766725492972305e-96,\"\":null,\"ꭟ򵑣𠠨𓃏񿻳󔺨񎀩\":null,\"򏃳\":null},\"󑕙􊲄򰞝򽬼񸌐𤨱\":\"񆃽\",\"􉿽󏨜󺏝򬡿򲐻󴅵򺛤\":-1.4e-322,\"𩾸\":null,\"󒱭침񵛀􁎓񦙇\":true,\"\":\"apply\"},\"𒧕\":[7.6086682491958856e-146,{\"񎙉򜪅󵜭񗆁뀦\":null,\"𱈻\":\"\",\"񦛞񍢼򩼭򒏧𥥁󀼬󇀪񎎅𬜟򚌈\":\"𬙘𧢽򟜫󨔭񥗂󞇤浮񖩥󑔷\",\"򏻅𥿋󶃏󰶰򟗎𿃽𓂩\":null,\"𛊃󬎤󌽛\":false,\"򩫪󅪻󗓨\":-7.067638177674602e+76},\"圩򎽘񼟈񧖨񬂡󕦉򢤶󥸙\",null,[2.219624217009348e-22,-9.770861754123764e+110,true,null,\"񰠦ଞ񛮿񴄒򴀯򡇩\",null,null],true,1.2718114310572915e+272,true,true]}"
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
// • 50 to 99 items......35.02%
// • 1 to 4 items........33.88%
// • 10 to 49 items......20.54%
// • 100 to 499 items....10.11%
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

## unicodeJson

JSON compatible string representations of instances. Can produce string representations of basic primitives but also of deep objects.

The generated values can be parsed by `JSON.parse`.
All the string values (from keys to values) are generated using `fc.unicodeString()`.

**Signatures:**

- `fc.unicodeJson()` — _deprecated since v3.19.0 ([#5011](https://github.com/dubzzz/fast-check/pull/5011))_
- `fc.unicodeJson({depthSize?, maxDepth?})` — _deprecated since v3.19.0 ([#5011](https://github.com/dubzzz/fast-check/pull/5011))_

**with:**

- `depthSize?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#depth-size-explained) — _how much we allow our recursive structures to be deep?_
- `maxDepth?` — default: `Number.POSITIVE_INFINITY` — _maximal depth of generated objects_

**Usages:**

```js
fc.unicodeJson();
// Examples of generated values:
// • "{\"󈨤󒅔򩣟􃠲\":{\"𤃳𻢣𬏟򏜂𱔾𥼨񀳠􊤡򺼬\":{\"󣈢򤉠򋦃񿢲𩳩䳸򦚁񺆾顫\":[\"󭏻󢯳󩩘󭹎󘅃󴳆𶚣󥥘𿛀񽨭\",1.4078094841036001e-67,\"񫔞\"],\"񓧃󻔝򪉜򑀳𘃙𡾜\":\"񯞫㪮򜈛𬿼\",\"\":\"𰚻􃌒򥵹򥸗󺏣󐱰򡌓󉖸󋓊\"},\"򕢙󰏿򙬣󗞀򹧅󪜌򄣱\":\"ﻮ񭜠񧻫񑅜񞫩󔢶💁𩓎\",\"󝻁𸞯򹤄𣘕򾆛􆹆򢬦򺗇𜿒񈾹\":null,\"𚤿𠚵󆾒􄵀\":true,\"򍐘󰎒򆓑򡚛򄒸\":false,\"򺵩𺂞񩜆󯵠󀥐𠊀\":\"򚧍󿄵񹶣󖽫򒚞񚘺񗷮񀚃\",\"󨫏򬈮󠣫\":-6.638526972924301e+52,\"񸴏𰽙򥅽󰱫Ⴟ񍼻\":1.7943982562867058e+199}}"
// • "[]"
// • "[true,null,null,true,\"􏿮\",\"Ȩ􈷙񒮏񴾣𘑻󍾴𬰉󧚯\",false,null]"
// • "{\"󫫄\":{\"󲝾𿆨\":-1.9788421366816808e-82,\"񔇮󆔽򋉕𔊑\":\"𙳨􊙹򧈫􊕥񦏝񬭭􎪅𖮹\",\"􉹓󄃷󟧖\":null,\"񏕊岾򣃚󁲓􂊩虐\":80283984173685.53,\"󙓓񓱙񡘤񩶣󠊫\":true,\"񑄂󑮽򚐆􃾜⼊򸉋񳋰\":\"\",\"񮰲񝡅񣇟𮐦󎫏򋔊󹀒򣶬\":null},\"񎁜󏒼󃫺񫺿\":[null,true,null,{\"懴𐏄𝜳򖦏\":\"򰪰󌯅򌨹񿥣쿥\",\"𼽟𣹝񤂹\":9.214173245947507e-111,\"󆅇󃪭󝰡𨇬\":\"򵻫񯢾񠚲񸾦񭑜𱉵\",\"񇠪򔆬񔎯򘴅󠮝󸎍󄆴򻰃򬕡򡙿\":7.808042412941465e-176,\"򫈺󯺤񅿗𨎰󶼵\":null,\"𪢀󨦍򢷓󏺘󅈥𜓯󋘼\":null,\"\":null,\"񽎨񼬙󳮩򊝖ᇋ򘛞䏈\":false,\"𩮁󾒟𞵵񶍬\":false,\"򛡘󾟺􉇌񬬓炏󦪓񎟊񢘞򬼛\":null}],\"򵸣򂐀񺁰񂝯񷞨𩠆\":[[[\"򴾒񈁿\",\"򔒱񥶹󿱶󬁔꯵𦄲𶕈\"],\"񷢼鲌񫧝𝰿񔞂\",null],\"򯎿򾚮𳎍򔯍򉍪𤶘񠀹񂃖񟇖\",true,null]}"
// • "true"
// • …

fc.unicodeJson({ maxDepth: 0 });
// Examples of generated values:
// • "[true,null,\"\",null,null,false]"
// • "{}"
// • "[null,-1.7054642294306804e+86,3.678514250005814e-198,\"񁕝\",\"񊦩򂈒𹖍󚒲󋹏󶭝𽠸󘀥򄗾󍥒\",null,null,{\"󑕉󂸞񯜐༣𸜐\":\"󵓦󿀼𜴃򤭝􅇵掤򷉀򤸓\",\"󀤞񫙍󜮒񦲘𲲶򚹐􈰇􉇼𝫃񎷝\":\"􎰺࿯񍶯󟝲򁪚񗏨򺫟򿉜񒫋\",\"⾯𫈪򈪇򴐋򚪤𵀄򗬗󰍶𪅓𦱹\":5.125024613939163e+90,\"񣳧\":false,\"񿬳󏍭񘥒񳳙􍮛򁋙\":null,\"􃇯񞛵𑑨򴚦񺈐𞛏\":-1.0301077279774283e-286},4.2493150374885814e-38]"
// • "[[3.966231748135636e+261],\"񿬑󍤥󩹒򍡲򱠪󕿈\",null]"
// • "-1.8e-322"
// • …

fc.unicodeJson({ maxDepth: 1 });
// Examples of generated values:
// • "[true,null,\"\",null,null,false]"
// • "{}"
// • "[null,-1.7054642294306804e+86,3.678514250005814e-198,\"񁕝\",\"񊦩򂈒𹖍󚒲󋹏󶭝𽠸󘀥򄗾󍥒\",null,null,{\"󑕉󂸞񯜐༣𸜐\":\"󵓦󿀼𜴃򤭝􅇵掤򷉀򤸓\",\"󀤞񫙍󜮒񦲘𲲶򚹐􈰇􉇼𝫃񎷝\":\"􎰺࿯񍶯󟝲򁪚񗏨򺫟򿉜񒫋\",\"⾯𫈪򈪇򴐋򚪤𵀄򗬗󰍶𪅓𦱹\":5.125024613939163e+90,\"񣳧\":false,\"񿬳󏍭񘥒񳳙􍮛򁋙\":null,\"􃇯񞛵𑑨򴚦񺈐𞛏\":-1.0301077279774283e-286},4.2493150374885814e-38]"
// • "[[3.966231748135636e+261],\"񿬑󍤥󩹒򍡲򱠪󕿈\",null]"
// • "-1.8e-322"
// • …

fc.unicodeJson({ depthSize: 'medium' });
// Examples of generated values:
// • "\"򍭽󲆮򈣺󆗽򝒈𶨾\""
// • "[null,true,2.875000848829663e+119,\"񴡺嶡򰌞𚅨\",null,\"񋪤៿󦇂򍝂\",null,false]"
// • "false"
// • "{\"󊗏󗜲𙣡򘰽򘡺򑆙𛪐򸿗󥉀򤬻\":null}"
// • "{\"񭅌򾊖򡲄󋫰񱙜񤩝𻬬꥗\":true,\"\":\"񲝂􌥑𩮧񾜵󌎽􅍪򣀯\",\"𯊆񥾧񻨴󣃓􌃳񨧨󓰘񧮵𷪹\":-7.543315553550096e-34,\"𱁷񬍺󎆴򛐍񌈬󣶇𧏒󌜙\":{\"󘈼𻍈𪌤􋸻򃊭󴽡\":true,\"𔌬􌼂򦎽𽠚􄏣\":false,\"𫺶󁌼񭎲𱇻󪀮🴴󰌟\":\"򐷷󠞵󈪲񠽵񭰔󆇷󝌴\",\"񁂆񤆴󍎒𘌖󙚩\":\"𸳁𿎕򽐰񭓳󁦰񞷆񫓓𸚔\",\"􁑅񨾓񌚝󞗯􈅻󳻢򔃵󠔐򉊷\":2.2853367367043913e+207},\"𳅈󳯒󌳎􃺶󜖩㠫\":[null,\"𾚒򠆇󇆈񆯬񊶵򵡝𑖶\",5.531421591396989e-40,\"𡷹񾄆󀉝񪴍𱯟\",\"⑖򔤃󩣯񆣪𘣡􄷑󤙐𧤨ﮫ󹼋\",null,null,1.0846697849762912e+90,true]}"
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

- `fc.unicodeJsonValue()` — _deprecated since v3.19.0 ([#5011](https://github.com/dubzzz/fast-check/pull/5011))_
- `fc.unicodeJsonValue({depthSize?, maxDepth?})` — _deprecated since v3.19.0 ([#5011](https://github.com/dubzzz/fast-check/pull/5011))_

**with:**

- `depthSize?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#depth-size-explained) — _how much we allow our recursive structures to be deep?_
- `maxDepth?` — default: `Number.POSITIVE_INFINITY` — _maximal depth for generated objects (Map and Set included into objects)_

**Usages:**

```js
fc.unicodeJsonValue();
// Examples of generated values:
// • null
// • [-4.295089174387055e-293,false,{"񪞆򾧈򠮒񂝵󹔻󎶯򗞷":true,"񀦩񊜸𿰢򇰑𧴿񝥓ﶻ":true,"􈄫𓋮":null,"񤘸򷴭":"󂝀紩󏑮𸗼","𺋒":false,"򆁐󠼒󔶤𝩿":null,"򚞪񲩱񪕿񗞒":-1.6050931064928954e-96},null]
// • 3.4453237274410463e+71
// • []
// • [null,[null,{"񞾘":false,"򃺄򁇈򊐉𲉵ꓛ󬞘𜏨񭯞":{"󱷙":false,"򨚹𮰒򇍵񡱚񮜊":true,"𽁓񎦦∱􁒖򽵬𔡅󩓌񼂈":false,"󑭏򞺓覉򆿂򾯜𲽁⩒":null,"򜵦홏񘚚":-1.0765809081688447e-68,"򉺈򧻾󠕀􁚚󅶡򳽹񮂹":2.7214577245022765e-88,"򄹔񳓥񄕧򶎑𦆰􋼒󰣵𝥃񦊮򗑝":true},"𤁟꽔󯾊򿉮𲝪":true}],"򓇖󆭡",{"񒣞򫙕":null,"":"󺟸󉸷","򽽄񻊾񂴷񍻜󿻙𩟠򟾵𐟣":"򺪓𼞧􎕞󡪢򟺄𵙁󦮿񣻱","񗺬":-6.95950666926601e+110,"񲂐􆸇󗙊󓓌򑘙󥟈𝀡󩁱񿷕":"򶚾󹿭񺋟򲂛򥊪򴸮񩹺񇀹󄷀","󪸂𨐿񦻈퓥𽸸񯬭򿞪񁊵":"񁞚𜟖󙣆掴𐂑󺖦","򷢣𥁲":2.609294368689059e-298,"򅌽򺡠":true}]
// • …

fc.unicodeJsonValue({ maxDepth: 0 });
// Examples of generated values:
// • {"񪮆򒑤𫆍󚉖󀪼":6.422585986069521e+229,"":"𶝋񉜼򄂤󝻣𷯗🼌񜄉񸴽󟝌","􈦢䓣򦇀񋅛󒋀":"򡦙񸝨򖳘񷎜","󂶊":null,"񑊟󛙣𴗋񽏼󰛺🔞򩲟󄟰񌨕":false,"󠍋񟱈󮼸𾠸":"󳐞𳎳򑂃𬄓󪢃񙲖嗺񄽾𤪳","񡺳󑑆񞙎񛐀󌕔񽀗򿸠𼂪񝒙򖿮":6.195803615877937e-214,"󐩀񱽨򅞹":null,"﷗󚾈䟒󫋠􃦳򰋷󢓳򔤨":"񘎕𶆳󓱤󲴆컰􆈾򗞞򫢪𾑲񯈕"}
// • 1.7398076905782003e-265
// • "𪉵򰩫0"
// • []
// • {"񾶧򶽧󡇌󸹘񺣯񖲼򍴊򵯓󠵊":{},"櫄񥧋񋆮񣼲㬦𾣔򐤋򧍋":{"񫫂򒱝":-1.3973513601005362e-264,"𠄓𢄣𢲍㵧񉠦򡮵":false,"𓕉󚓤򌲱񩱾􄹂𢊀":-4.1425806591889986e+212,"":3.9428753092144533e+236,"󤣭񢠈凜𕼑𔢷󃰛󶶇󳁡":-3.3861837092165883e-127,"򰪞󇓍񷨽𧬯":true}}
// • …

fc.unicodeJsonValue({ maxDepth: 1 });
// Examples of generated values:
// • {"񪮆򒑤𫆍󚉖󀪼":6.422585986069521e+229,"":"𶝋񉜼򄂤󝻣𷯗🼌񜄉񸴽󟝌","􈦢䓣򦇀񋅛󒋀":"򡦙񸝨򖳘񷎜","󂶊":null,"񑊟󛙣𴗋񽏼󰛺🔞򩲟󄟰񌨕":false,"󠍋񟱈󮼸𾠸":"󳐞𳎳򑂃𬄓󪢃񙲖嗺񄽾𤪳","񡺳󑑆񞙎񛐀󌕔񽀗򿸠𼂪񝒙򖿮":6.195803615877937e-214,"󐩀񱽨򅞹":null,"﷗󚾈䟒󫋠􃦳򰋷󢓳򔤨":"񘎕𶆳󓱤󲴆컰􆈾򗞞򫢪𾑲񯈕"}
// • 1.7398076905782003e-265
// • "𪉵򰩫0"
// • []
// • {"񾶧򶽧󡇌󸹘񺣯񖲼򍴊򵯓󠵊":{},"櫄񥧋񋆮񣼲㬦𾣔򐤋򧍋":{"񫫂򒱝":-1.3973513601005362e-264,"𠄓𢄣𢲍㵧񉠦򡮵":false,"𓕉󚓤򌲱񩱾􄹂𢊀":-4.1425806591889986e+212,"":3.9428753092144533e+236,"󤣭񢠈凜𕼑𔢷󃰛󶶇󳁡":-3.3861837092165883e-127,"򰪞󇓍񷨽𧬯":true}}
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
