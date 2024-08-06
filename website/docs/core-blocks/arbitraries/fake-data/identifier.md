---
slug: /core-blocks/arbitraries/fake-data/identifier/
---

# Identifier

Generate identifier values.

### ulid

ULID values.

**Signatures:**

- `fc.ulid()`

**Usages:**

```js
fc.ulid();
// Examples of generated values:
// • "7AVDFZJAXCM0F25E3SZZZZZZYZ"
// • "7ZZZZZZZYP5XN60H51ZZZZZZZP"
// • "2VXXEMQ2HWRSNWMP9PZZZZZZZA"
// • "15RQ23H1M8YB80EVPD2EG8W7K1"
// • "6QV4RKC7C8ZZZZZZZFSF7PWQF5"
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/ulid.html).  
Available since 3.11.0.

### uuid

UUID values including versions 1 to 5.

**Signatures:**

- `fc.uuid()`

**Usages:**

```js
fc.uuid();
// Examples of generated values:
// • "4ebb3995-0009-1000-8b20-2254b7902e27"
// • "ffffffef-50fb-40b5-aa9f-05640000001d"
// • "87a8e397-ffec-5fff-8000-001a00000004"
// • "17983d5d-001b-1000-98d3-6afba08e1e61"
// • "7da15579-001d-1000-a6b3-4d71cf6e5de5"
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/uuid.html).  
Available since 1.17.0.

### uuidV

UUID values for a specific UUID version (only 1 to 15) only digits in 0-9a-f.

**Signatures:**

- `fc.uuidV(version)` — _deprecated since v3.21.0 ([#5103](https://github.com/dubzzz/fast-check/issues/5103))_

**with:**

- `version` — _version of the uuid to produce: 1, 2, 3, 4, 5... or 15_

**Usages:**

```js
fc.uuidV(3);
// Examples of generated values:
// • "d9951cc0-000f-3000-886d-743b90c0903c"
// • "b4f42187-7bd2-3385-8000-000794a930da"
// • "c2faeae2-2bd2-31a4-81e8-3f5800000007"
// • "65c2d0a5-0004-3000-8000-000e579a5fa4"
// • "00000002-0008-3000-8000-000b1bc90950"
// • …

fc.uuidV(5);
// Examples of generated values:
// • "40884311-1487-57f0-bfff-ffe30000000c"
// • "ffffffea-0019-5000-99e6-b63700000007"
// • "f92ab3fe-000f-5000-abf4-8b9a04f4449f"
// • "b77d67e3-001a-5000-8e94-de76050b8105"
// • "00000014-000e-5000-8caa-1615aee2e3cd"
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/uuidV.html).  
Available since 1.17.0.
