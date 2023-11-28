---
slug: /core-blocks/arbitraries/primitives/date/
---

# Date

Generate date values.

## date

Date values.

Generate any possible dates in the specified range. Both the lower bound and upper bound of the range are included in the set of possible values.

**Signatures:**

- `fc.date()`
- `fc.date({ min?, max?, noInvalidDate? })`

**with:**

- `min?` — default: `new Date(-8640000000000000)` — _lower bound of the range (included)_
- `max?` — default: `new Date(8640000000000000)` — _upper bound of the range (included)_
- `noInvalidDate?` — default: `false` — _when `true` the Date "Invalid Date" will never be defined_

**Usages:**

```js
fc.date();
// Examples of generated values:
// • new Date("-102261-04-16T03:19:33.548Z")
// • new Date("1970-01-01T00:00:00.004Z")
// • new Date("+111995-07-24T19:09:16.732Z")
// • new Date("-058362-10-19T15:40:37.384Z")
// • new Date("+208885-10-19T22:12:53.768Z")
// • …

fc.date({ min: new Date('2000-01-01T00:00:00.000Z') });
// Examples of generated values:
// • new Date("+199816-07-04T12:57:41.796Z")
// • new Date("2000-01-01T00:00:00.039Z")
// • new Date("2000-01-01T00:00:00.047Z")
// • new Date("2000-01-01T00:00:00.003Z")
// • new Date("+275760-09-12T23:59:59.982Z")
// • …

fc.date({ max: new Date('2000-01-01T00:00:00.000Z') });
// Examples of generated values:
// • new Date("-201489-02-25T08:12:55.332Z")
// • new Date("1969-12-31T23:59:59.994Z")
// • new Date("1970-01-01T00:00:00.006Z")
// • new Date("1970-01-01T00:00:00.019Z")
// • new Date("-271821-04-20T00:00:00.033Z")
// • …

fc.date({ min: new Date('2000-01-01T00:00:00.000Z'), max: new Date('2000-12-31T23:59:59.999Z') });
// Examples of generated values:
// • new Date("2000-05-15T03:02:40.263Z")
// • new Date("2000-10-22T03:00:45.936Z")
// • new Date("2000-02-25T19:00:10.679Z")
// • new Date("2000-12-31T23:59:59.997Z")
// • new Date("2000-01-04T14:12:03.484Z")
// • …

fc.date({ noInvalidDate: true });
// Examples of generated values:
// • new Date("-043663-07-08T11:17:34.486Z")
// • new Date("-169183-12-11T00:28:46.358Z")
// • new Date("1969-12-31T23:59:59.988Z")
// • new Date("1969-12-31T23:59:59.984Z")
// • new Date("-271821-04-20T00:00:00.033Z")
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/date.html).  
Available since 1.17.0.
