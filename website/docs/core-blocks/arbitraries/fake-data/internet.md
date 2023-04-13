---
slug: /core-blocks/arbitraries/fake-data/internet
---

# Internet

Generate internet related values.

### ipV4

IP v4 addresses.

**Signatures:**

- `fc.ipV4()`

**Usages:**

```js
fc.ipV4();
// Examples of generated values: "149.2.84.39", "255.251.100.5", "151.253.2.4", "93.3.251.97", "121.3.113.229"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/ipV4.html).  
Available since 1.14.0.

### ipV4Extended

IP v4 addresses including all the formats supported by WhatWG standard (for instance: 0x6f.9).

**Signatures:**

- `fc.ipV4Extended()`

**Usages:**

```js
fc.ipV4Extended();
// Examples of generated values: "0x7.249.0xfe.0x79", "07.0x7b.1.0x6", "0xa5.0265.22.27", "0xd4.0xfd.15664", "0x1ed7207"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/ipV4Extended.html).  
Available since 1.17.0.

### ipV6

IP v6 addresses.

**Signatures:**

- `fc.ipV6()`

**Usages:**

```js
fc.ipV6();
// Examples of generated values:
// • "::470:6:192b:ffae:17:2:f"
// • "b1:9:16:0d:3:0157:2.0.3.0"
// • "::54.250.196.255"
// • "b12d:062:04:352:3f:2f:e5a6:4"
// • "::1f58:4b90:7.75.163.156"
// • …
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/ipV6.html).  
Available since 1.14.0.

### domain

Domain name values with extension.

Following RFC 1034, RFC 1123 and WHATWG URL Standard.

**Signatures:**

- `fc.domain()`
- `fc.domain({size?})`

**with:**

- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.domain();
// Examples of generated values: "6i1.ws", "p.s.snp", "r.sc", "gkamh0qv6l.krzi6l5r.nwr", "ewargum4.oe"…

fc.domain({ size: '-1' });
// Note: Generate smaller domain name compared to default. As default size is 'small' (if unchanged), it is equivalent to 'xsmall'
// Examples of generated values: "9.pi.ca", "hs3.gzh", "wa5.6.pr", "b.mle", "xwh.t3o.qfy"…

fc.domain({ size: '+1' });
// Note: Generate larger domain name compared to default. As default size is 'small' (if unchanged), it is equivalent to 'medium'
// Examples of generated values:
// • "9.p423dsmckvsr8zq9pz4g7m7d-er6s2isixposz852w-6ucuyt6dpd1xom5qw.m13i-0v7it7r-idhdv3r81ih0rkr21vcm03ckml1kinrycchs--xe.7r9699vi87mam0n2n1yiheo5m66b43olq60v4uq0nx2njzln8s9.kcan-6s50hi299hkxwogui-sr-qqag7qk77rp.7.oyydbar"
// • "hsqw8csm6fqkxx-m8bfki5x9ha3b1xwkcrb8434om2a6k.iggl02udkofh9ejc82r0n9d1j3iiebb03htjchbcm4.vrpz5ykhbgw9w70ngv5fibddr0.h4z59i4jgozqyweaiqmsnb1g-xyukd1p56b9rube6bygqql-bix8c1hhe9zl.jzh73innxd9by63zqpgapervfj2tfay9a1yzo1.yvyad"
// • "wa1rmog9vzegsnc0s08c9mw8xhtzi.lczv51ng2.qgrbojlaweyi0dssmu5ynrdo4m2rph-zrmmkmexuives2-33kbu8r5flthpuew1.0hvuvunrwxm46ep19q0g.91z9lzm0o3bk8khhqdfb32lloo.l0ul57f3i6ez24u47taregkn6c95mrx.drgcjivmedhkk"
// • "b.p3avihxjt2f0nz5gyxygckr4zni-1zbz.jnd6n4mvgwhur1.8xvmpgmb9e2lmo0kzqlr3tcqfntktx.9.4j.93gqwgsv-6xdg25i715sg7jul6xbwla.mcnlem"
// • "xwtcyt3pynja1mmoeot1l2x7ue82lbhjuddrogn5ubwjnua.macf28a2x600a9zg25z17rrqgohj89j0ik0cqg91jg4kvhd6-y6.i8syilcl23id4vjxrhyszp8o5ps5h.agm3iek7um94do2ijyt7b6diwqi1i2si-c5xwup.qtgn3lyouk4f7ft57780y7usr0kxox.g.vn"
// • …
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/domain.html).  
Available since 1.14.0.

### webAuthority

Web authority values.

Following RFC 3986.

**Signatures:**

- `fc.webAuthority()`
- `fc.webAuthority({withIPv4?, withIPv4Extended?, withIPv6?, withPort?, withUserInfo?, size?})`

**with:**

- `withIPv4?` — default: `false` — \_enable ip v4
- `withIPv4Extended?` — default: `false` — _enable ip v4 extended_
- `withIPv6?` — default: `false` — _enable ip v6_
- `withPort?` — default: `false` — _enable port_
- `withUserInfo?` — default: `false` — _enable user info_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.webAuthority();
// Examples of generated values: "23ks1pf.mgz", "7-ngin.sv", "peybeb.f9ia-gsmr.na", "9a1hmsddb-cm.iit", "xhlstwb.44ctb2efxk.fc"…

fc.webAuthority({
  withIPv4: true,
});
// Examples of generated values: "i.fb", "237.196.254.199", "7.166.63.117", "wz0zysek.zb", "252.149.163.184"…

fc.webAuthority({
  withIPv4Extended: true,
});
// Examples of generated values: "109.013506422", "119.0234.250.04", "df.el", "v.we", "64.020"…

fc.webAuthority({
  withIPv4: true,
  withIPv4Extended: true,
  withIPv6: true,
  withPort: true,
});
// Examples of generated values: "0rog.cod:63367", "02.0x57fdd:45172", "0247.0332.0315.0x7a", "2498828715:50719", "169.3.232.223"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/webAuthority.html).  
Available since 1.14.0.

### webFragments

Fragments to build an URI.

Fragment is the optional part right after the # in an URI.

**Signatures:**

- `fc.webFragments()`
- `fc.webFragments({size?})`

**with:**

- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.webFragments();
// Examples of generated values: "", "kg%F4%8F%BF%AEe=@b%F2%90%95%8Ad'", "a", "?x%F1%82%BD%B9-f.%F3%92%97%BA", "%F0%B7%94%9Bu_8r"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/webFragments.html).  
Available since 1.14.0.

### webPath

Web path.

Following the specs specified by RFC 3986 and WHATWG URL Standard.

**Signatures:**

- `fc.webPath()`
- `fc.webPath({size?})`

**with:**

- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.webPath();
// Examples of generated values: "/OZx@%E4%B6%958j~64", "", "/0cLw*!~%F2%9A%90%BE5I", "/1", "/"…

fc.webPath({ size: '+1' });
// Examples of generated values:
// • "/%F3%A0%A1%8BlESmD/cLeL/6C%F1%A7%A8%A6J4%F1%AC%A3%8D-2(/k%F1%B6%B2%8F%E0%BD%98*S6y%F1%8F%B5%B8/_M/0S2JqQ/%F2%9D%90%B1D@gRy"
// • "/Fxamq,9/%F1%84%A7%9Ex8L79RVmv"
// • "/P.=*%F1%98%B1%A6.!zS/w4Rw/X%F1%82%9A%87ETDLW/Y/+lr!w-kJL/wOq)Xw0KZ"
// • "/@H%F1%B2%B8%A8F+5uAO/=%F1%A4%96%835Ty+uv/OfoC.F%F3%8A%AD%96:J=/%F0%A6%92%B8~,0Wo8t%F2%8F%A5%87/k-G9=L;P4/;a"
// • "/Bubfb"
// • …
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/webPath.html).  
Available since 3.3.0.

### webQueryParameters

Query parameters to build an URI.

Query parameters part is the optional part right after the ? in an URI.

**Signatures:**

- `fc.webQueryParameters()`
- `fc.webQueryParameters({size?})`

**with:**

- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.webQueryParameters();
// Examples of generated values: "argumentsp", "zB)MCS9r*", "=gcJbW:1", "RmE9%F3%96%BC%95XJ4h", "1=eJ@5ic1"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/webQueryParameters.html).  
Available since 1.14.0.

### webSegment

Web URL path segment.

**Signatures:**

- `fc.webSegment()`
- `fc.webSegment({size?})`

**with:**

- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.webSegment();
// Examples of generated values: "*lej@(", "", "+Y", "1FBtTF1GX", "V:%F2%BF%87%8B%F4%8A%AF%B6(AieS"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/webSegment.html).  
Available since 1.14.0.

### webUrl

Web URL values.

Following the specs specified by RFC 3986 and WHATWG URL Standard.

**Signatures:**

- `fc.webUrl()`
- `fc.webUrl({authoritySettings?, validSchemes?, withFragments?, withQueryParameters?, size?})`

**with:**

- `authoritySettings?` — default: `{}` — _[constraints](https://dubzzz.github.io/fast-check/interfaces/webauthorityconstraints.html) on the web authority_
- `validSchemes?` — default: `['http', 'https']` — _list all the valid schemes_
- `withFragments?` — default: `false` — _enable fragments_
- `withQueryParameters?` — default: `false` — _enable query parameters_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.webUrl();
// Examples of generated values: "https://1e.pl", "https://s.snp", "https://h.ot", "https://copze7.wrc", "http://ay84wia.bi"…

fc.webUrl({
  validSchemes: ['ftp', 'ftps'],
});
// Examples of generated values:
// • "ftps://iq7rvu2my.tm/'1V&HqX52m"
// • "ftp://7eee69dc78fg.nec"
// • "ftp://hye.rbh9r2.hb"
// • "ftp://hmakevcba.uis"
// • "ftps://xb1.5787e.cew/"
// • …

fc.webUrl({
  withFragments: true,
  withQueryParameters: true,
});
// Examples of generated values:
// • "https://db.oaurut3lxuey.yc"
// • "http://91kpzb6.x4tmjg.pa/*yjz,%F1%A0%AA%B0?~v6+#engtho__!/"
// • "http://hqydzxt3ihu.db/_tAUbo?:/#%F3%B9%93%B6qfx"
// • "https://74gl.fp601objrmhm.rx/#tZK%2ae'(c"
// • "http://7.qxq?;Y:f@HiK#ref"
// • …

fc.webUrl({ size: '-1' });
// Note: Generate smaller urls compared to default. As default size is 'small' (if unchanged), it is equivalent to 'xsmall'
// Examples of generated values: "https://pi.ca", "https://j.3ch.hy/", "https://5c.f.lbi/", "https://px.hw", "https://dcf.qr"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/webUrl.html).  
Available since 1.14.0.

### emailAddress

Email adresses.

Following RFC 1123 and RFC 5322.

**Signatures:**

- `fc.emailAddress()`
- `fc.emailAddress({size?})`

**with:**

- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.emailAddress();
// Examples of generated values:
// • "4@fgqcru.ca"
// • "#!iy8*vt.~#p{nam.y|na.f.afac|.t%^$v*+2di1e.43g@jcc.hl"
// • "fo/2p~zq.kn'e&bfa|1`@9fqau6rah8.8i81fxjk.ox"
// • "==.vra&~to=z.vdc^.=kf/'a$'2sr^.6j6gsw6^&az'.#$}mba.x!|}a@4.wk"
// • "8ic6`_g00syk.}r~b3{0t/7?.!51q'.0yxj2.8wj`f?v-lr}.t6%?z*1$i2+b@cjybzi.pr"
// • …

fc.emailAddress({ size: '-1' });
// Note: Generate smaller email addresses compared to default. As default size is 'small' (if unchanged), it is equivalent to 'xsmall'
// Examples of generated values: "k.wh@l7.pc", "u@j.ag", "p.ag@1f.bj", "d@4.yd", "!@is8.gb"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/emailAddress.html).  
Available since 1.14.0.
