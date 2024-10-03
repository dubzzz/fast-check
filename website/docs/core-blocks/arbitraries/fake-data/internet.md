---
slug: /core-blocks/arbitraries/fake-data/internet/
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

Resources: [API reference](https://fast-check.dev/api-reference/functions/ipV4.html).  
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

Resources: [API reference](https://fast-check.dev/api-reference/functions/ipV4Extended.html).  
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

Resources: [API reference](https://fast-check.dev/api-reference/functions/ipV6.html).  
Available since 1.14.0.

### domain

Domain name values with extension.

Following RFC 1034, RFC 1123 and WHATWG URL Standard.

**Signatures:**

- `fc.domain()`
- `fc.domain({size?})`

**with:**

- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

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

Resources: [API reference](https://fast-check.dev/api-reference/functions/domain.html).  
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
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

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

Resources: [API reference](https://fast-check.dev/api-reference/functions/webAuthority.html).  
Available since 1.14.0.

### webFragments

Fragments to build an URI.

Fragment is the optional part right after the # in an URI.

**Signatures:**

- `fc.webFragments()`
- `fc.webFragments({size?})`

**with:**

- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.webFragments();
// Examples of generated values: "", "kg%00au@b%08cg", "a", "?x%F1%80%9F%8Cti.k", "%F0%A1%85%AFR%F1%8F%B1%86rQ"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/webFragments.html).  
Available since 1.14.0.

### webPath

Web path.

Following the specs specified by RFC 3986 and WHATWG URL Standard.

**Signatures:**

- `fc.webPath()`
- `fc.webPath({size?})`

**with:**

- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.webPath();
// Examples of generated values: "/X/x///1/j//6/@/", "", "/B/~", "/'//%F4%87%81%B9/B/~/e//P//", "/HzDG-&&)E"…

fc.webPath({ size: '+1' });
// Examples of generated values:
// • "/%F1%B7%93%81h&kpL/%F3%96%AA%BFeLb6of/4%F3%B3%80%85%F2%B2%94%B4(t02U/S6y/u_M24BC_%F1%B0%A2%A6t//0bR0co%E2%BD%BB"
// • "/Fxamq,9/%F1%BE%A9%95t=P6-LPgL"
// • "/P.=*%F2%97%A8%93~0i%F2%9A%AC%83/4Rwg0&nSQ/W/Y/+lr!w-kJL/wOq)Xw0KZ"
// • "/@H%F4%8A%91%BFZR:%F2%BA%A7%96O4/%F3%98%90%B8y%F1%B6%96%83+uv%F2%9F%B0%BFf/+/.F%F0%B1%89%88aE%F1%88%A7%BA/~/"
// • "/Bubfb"
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/webPath.html).  
Available since 3.3.0.

### webQueryParameters

Query parameters to build an URI.

Query parameters part is the optional part right after the ? in an URI.

**Signatures:**

- `fc.webQueryParameters()`
- `fc.webQueryParameters({size?})`

**with:**

- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.webQueryParameters();
// Examples of generated values: "argumentsp", "zB)MCS9r*", "=gcJbW:1", "RmE9%F1%A6%BE%968y:2", "1=eJ@5ic1"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/webQueryParameters.html).  
Available since 1.14.0.

### webSegment

Web URL path segment.

**Signatures:**

- `fc.webSegment()`
- `fc.webSegment({size?})`

**with:**

- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.webSegment();
// Examples of generated values: "*lej@(", "", "+Y", "1FBtTF1GX", "V:%F2%96%A2%A1$PV4Yq"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/webSegment.html).  
Available since 1.14.0.

### webUrl

Web URL values.

Following the specs specified by RFC 3986 and WHATWG URL Standard.

**Signatures:**

- `fc.webUrl()`
- `fc.webUrl({authoritySettings?, validSchemes?, withFragments?, withQueryParameters?, size?})`

**with:**

- `authoritySettings?` — default: `{}` — _[constraints](https://fast-check.dev/api-reference/interfaces/WebAuthorityConstraints.html) on the web authority_
- `validSchemes?` — default: `['http', 'https']` — _list all the valid schemes_
- `withFragments?` — default: `false` — _enable fragments_
- `withQueryParameters?` — default: `false` — _enable query parameters_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.webUrl();
// Examples of generated values: "https://1e.pl/", "https://s.snp", "https://h.ot", "https://copze7.wrc/N/", "http://ay84wia.bi/%05/_"…

fc.webUrl({
  validSchemes: ['ftp', 'ftps'],
});
// Examples of generated values:
// • "ftps://iq7rvu2my.tm/%F0%91%B3%981V&Hq"
// • "ftp://7eee69dc78fg.nec"
// • "ftp://hye.rbh9r2.hb"
// • "ftp://hmakevcba.uis/~%F3%BC%B3%B2"
// • "ftps://xb1.5787e.cew/d"
// • …

fc.webUrl({
  withFragments: true,
  withQueryParameters: true,
});
// Examples of generated values:
// • "https://db.oaurut3lxuey.yc#%F4%84%8D%9Ep%F3%87%81%B8.$/3n7%F3%A7%8F%BB"
// • "http://91kpzb6.x4tmjg.pa//y/%F4%8A%8E%83///?Z7R)=W%F3%A2%95%B1h14"
// • "http://hqydzxt3ihu.db/m/A/M/o/6/?e#%F3%B9%93%B65%F1%B9%A7%B1mx:pU_m"
// • "https://74gl.fp601objrmhm.rx/svxJFoL#"
// • "http://7.qxq?;Y:f@HiK#ref"
// • …

fc.webUrl({ size: '-1' });
// Note: Generate smaller urls compared to default. As default size is 'small' (if unchanged), it is equivalent to 'xsmall'
// Examples of generated values: "https://pi.ca", "https://j.3ch.hy/", "https://5c.f.lbi/", "https://px.hw", "https://dcf.qr"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/webUrl.html).  
Available since 1.14.0.

### emailAddress

Email adresses.

Following RFC 1123 and RFC 5322.

**Signatures:**

- `fc.emailAddress()`
- `fc.emailAddress({size?})`

**with:**

- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

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

Resources: [API reference](https://fast-check.dev/api-reference/functions/emailAddress.html).  
Available since 1.14.0.
