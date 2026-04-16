# Write Efficient Assertions

> **⚠️ Scope:** How to write clear, maintainable, and debuggable assertions?

**🔧 Recommended tooling:** `vitest`

## Choosing the right matcher

**👍 Prefer** specific matchers over generic equality

```ts
// ❌ Less informative on failure
expect(items.length).toBe(3);
expect(value > 0).toBe(true);

// ✅ Better error messages and intent
expect(items).toHaveLength(3);
expect(value).toBeGreaterThan(0);
```

**👍 Prefer** `toEqual` for deep object comparison, `toBe` for primitives and references

```ts
// ✅ Primitives
expect(count).toBe(42);

// ✅ Objects (deep equality)
expect(user).toEqual({ name: 'Alice', age: 30 });

// ✅ Same reference check
expect(singleton).toBe(cachedInstance);
```

**👍 Prefer** `toMatchObject` for partial object matching

don't overuse it

```ts
// ✅ Only checks specified properties
expect(response).toMatchObject({
  status: 200,
  data: { id: expect.any(Number) },
});
```

## Assertion clarity

**✅ Do** assert on one aspect per assertion for clearer failure messages

```ts
// ❌ Hard to know which part failed
expect(result.status === 200 && result.data.length > 0).toBe(true);

// ✅ Clear which assertion failed
expect(result.status).toBe(200);
expect(result.data.length).toBeGreaterThan(0);
```

**✅ Do** use custom matchers or helper functions for complex checks

```ts
// ✅ Encapsulate complex validation
expect(date).toBeValidISODate();
expect(user).toHavePermission('admin');
```

**👎 Avoid** asserting on stringified values

```ts
// ❌ Fragile and hard to debug
expect(JSON.stringify(obj)).toBe('{"a":1,"b":2}');

// ✅ Structured comparison
expect(obj).toEqual({ a: 1, b: 2 });
```

## Error message quality

**👍 Prefer** matchers that produce diff-friendly output

```ts
// ❌ No diff on failure
expect(array.includes(item)).toBe(true);

// ✅ Shows actual vs expected
expect(array).toContain(item);
```

**👍 Prefer** `toThrow` with specific message or type

```ts
// ❌ Any error passes
expect(() => parse(input)).toThrow();

// ✅ Specific error matching
expect(() => parse(input)).toThrow(SyntaxError);
expect(() => parse(input)).toThrow(/unexpected token/i);
```

## Async assertions

**✅ Do** use `await expect(...).resolves` or `.rejects` for promises

```ts
// ✅ Clean async assertion
await expect(fetchUser(1)).resolves.toMatchObject({ id: 1 });
await expect(fetchUser(-1)).rejects.toThrow('Invalid ID');
```

**❌ Don't** forget to `await` async assertions

```ts
// ❌ Test passes even if promise rejects
expect(asyncFn()).resolves.toBe(42);

// ✅ Properly awaited
await expect(asyncFn()).resolves.toBe(42);
```

## Negative assertions

**👎 Avoid** `.not` when a positive matcher exists

```ts
// ❌ Double negative, harder to read
expect(list).not.toHaveLength(0);

// ✅ Positive intent
expect(list.length).toBeGreaterThan(0);
```

**✅ Do** use `.not` for exclusion checks

```ts
// ✅ Clear exclusion intent
expect(roles).not.toContain('admin');
expect(result).not.toBeNull();
```
