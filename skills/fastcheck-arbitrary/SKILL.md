---
name: fastcheck-arbitrary
description: Guides the creation of new arbitraries for fast-check. Covers built-in primitives, combiners, derivation methods (.map/.filter/.chain), and extending the Arbitrary class as a last resort.
---

> **Scope:** Creating new `Arbitrary<T>` instances for property-based testing with fast-check.

## How should I create my arbitrary?

Follow this decision tree from top to bottom. Stop at the first approach that fits.

1. **Does a built-in already cover it?** Use it directly. See [primitives](docs/built-in-primitives.md) and [advanced built-ins](docs/built-in-advanced.md).
2. **Need to transform generated values?** Use `.map` on an existing arbitrary. See [deriving arbitraries](docs/deriving-arbitraries.md).
3. **Need to compose multiple independent values?** Use combiners like `fc.record`, `fc.tuple`, `fc.oneof`. See [combiners](docs/combiners.md).
4. **Need dependent generation** (second value depends on the first)? Use `.chain` with caution. See [deriving arbitraries](docs/deriving-arbitraries.md).
5. **Need to restrict values?** Prefer built-in constraints or `.map` tricks over `.filter`. See [deriving arbitraries](docs/deriving-arbitraries.md).
6. **Nothing above works?** Extend `Arbitrary` as a last resort. See [extending Arbitrary](docs/extending-arbitrary.md).

## Key guidelines

**Do** check built-in constraints before reaching for `.filter`
Eg.: use `fc.integer({ min: 1 })` instead of `fc.integer().filter(n => n >= 1)`, or `fc.nat()` instead of `fc.integer().filter(n => n >= 0)`

**Do** provide an `unmapper` when using `.map` if shrinking user-defined values matters

**Prefer** `.map` tricks over `.filter` to avoid discarding generated values
Eg.: use `fc.nat().map(n => n * 2)` for even numbers instead of `fc.integer().filter(n => n % 2 === 0)`

**Prefer** `fc.record` or `fc.tuple` over `.chain` when values are independent of each other

**Avoid** `.filter` with predicates that rarely match — it uses an infinite retry loop internally and can hang

**Avoid** `.chain` when `.map` or combiners suffice — `.chain` has limited shrinking capabilities

**Never** set `maxLength` on an arbitrary unless it is a requirement of the algorithm being tested
Prefer `size: '-1'` if generation is too slow on large inputs

**Never** constrain arbitraries beyond what the algorithm actually requires — use defaults as much as possible
