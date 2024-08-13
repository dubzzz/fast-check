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

UUID values including versions 1 to 5 and going up to 15 when asked to.

**Signatures:**

- `fc.uuid()`
- `fc.uuid({version?})`

**with:**

- `version` — default: `[1,2,3,4,5]` — _version or versions of the uuid to produce: 1, 2, 3, 4, 5... or 15_

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

fc.uuid({ version: 4 });
// Examples of generated values:
// • "00000009-2401-464f-bd6c-b85100000018"
// • "ffffffea-ffe7-4fff-af56-be4ec6ccfa3c"
// • "00000013-6705-4bdd-bfe3-0669d6ee4e9a"
// • "ed7479b3-cef8-4562-bc9c-0b0d8b2be3ae"
// • "58dbd17a-7152-4770-8d89-9485fffffff6"
// • …

fc.uuid({ version: [4, 7] });
// Examples of generated values:
// • "ffffffe8-4e61-40c1-8000-001d7f621812"
// • "0000001f-b6dc-7d7d-b40c-08568ae90153"
// • "0000000b-0002-4000-9003-de96d8957794"
// • "8b8e8b89-251e-78e7-8000-000000000000"
// • "ffffffe5-000d-4000-bfff-fff496517cc4"
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/uuid.html).  
Available since 1.17.0.
