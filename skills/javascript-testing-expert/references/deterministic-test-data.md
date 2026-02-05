# Deterministic test data

> **⚠️ Scope:** How to keep tests reproducible and deterministic when dealing with random data, fake data generators or platform-dependent values like dates?

**🔧 Recommended tooling:** `vitest`, `fast-check`  
**🔧 Optional tooling:** `@fast-check/vitest`

## If test depends on unused data...

**✅ Do** suggest to change the type definition to only pick the required fields if the data is never used and the limitation occurs due to type system

```ts
// ❌ Problematic: force the test to define a name, while not being used
type User = { name: string; birthday: string };
function computeAge(user: User); // only using user.birthday

// ✅ Good: only relevant fields will have to be passed
function computeAge(user: Pick<User, 'birthday'>);
```

**👍 Prefer** generating a dummy placeholder value using `fast-check`

```ts
// ✅ Good: if one day, name starts to be used, nasty and unexpected impacts would be detected
// with 'it' imported from '@fast-check/vitest'
it('should compute a positive age', ({ g }) => {
  // Arrange
  const user: User = {
    name: g(fc.string), // unused
    birthday: '2010-02-03',
  };

  // Act
  const age = computeAge(user);

  // Assert
  expect(age).toBeGreaterThan(0);
});
```

## If test platform-dependent data...

**✅ Do** stub platform-dependent values when they impact the code under test: date, time, locale...

**👍 Prefer** stubbing today using `vi.setSystemTime`

**👍 Prefer** controlling stubs using `fast-check`

```ts
// ❌ Problematic: output depends on the current day
const age = computeAge(user);

// 🤷 Slightly better: output will be the same throughout the runs
vi.setSystemTime(new Date('2010-02-04'));
const age = computeAge(user);

// ✅ Good: we make sure that the code under state will behave well whatever the date
// Given this test just checks that the age is >0 when provided a date before today, we actually don't care about checking the real age and as such a property based test approach is suitable to make sure that this invariant stays true for all cases.
vi.setSystemTime(g(fc.date, { min: new Date('2010-02-04'), noInvalidDate: true }));
const age = computeAge(user);
```

## If test depends on random or fake data...

**✅ Do** wire random or fake data generation through `fast-check`

```tsx
// ❌ Problematic: distinct executions would led to different inputs with some possibly causing a test failure without any mean to reproduce it or to know the inputs that were involved
it('should be able to login', async () => {
  // Arrange
  const user = userEvent.setup();
  const username = faker.internet.username();
  const password = faker.internet.password();
  const onRedirect = vi.fn();

  // Act
  render(<LoginForm onRedirect={onRedirect} />);
  await user.type(screen.getByRole('input', { name: 'username' }), username);
  await user.type(screen.getByRole('input', { name: 'password' }), password);
  await user.click(screen.getByRole('button', { name: 'login' }));

  // Assert
  expect(onRedirect).toHaveBeenCalledTimes(1);
});

// 🤷 Slightly better: random value is under the control of fast-check
// with 'it' imported from '@fast-check/vitest'
it('should be able to login', async ({ g }) => {
  // Arrange
  const user = userEvent.setup();
  const username = g(fakerToArb, (faker) => faker.internet.username);
  const password = g(fakerToArb, (faker) => faker.internet.password);
  const onRedirect = vi.fn();

  // Act
  render(<LoginForm onRedirect={onRedirect} />);
  await user.type(screen.getByRole('input', { name: 'username' }), username);
  await user.type(screen.getByRole('input', { name: 'password' }), password);
  await user.click(screen.getByRole('button', { name: 'login' }));

  // Assert
  expect(onRedirect).toHaveBeenCalledTimes(1);
});

// ✅ Good: we pushed the test slightly further by fully moving to property based testing
// In some cases, it might make the test harder to read for users not used to property based testing. Depending on how complex it is to have the equivalent arbitraries from built-in ones, consider sticking with `g`.
// with 'it' imported from '@fast-check/vitest'
it.prop([fc.string(), fc.string()])('should be able to login', async (username, password) => {
  // Arrange
  const user = userEvent.setup();
  const onRedirect = vi.fn();

  // Act
  render(<LoginForm onRedirect={onRedirect} />);
  await user.type(screen.getByRole('input', { name: 'username' }), username);
  await user.type(screen.getByRole('input', { name: 'password' }), password);
  await user.click(screen.getByRole('button', { name: 'login' }));

  // Assert
  expect(onRedirect).toHaveBeenCalledTimes(1);
});
```

### Connecting fake data libraries in `fast-check`...

**✅ Do** pass the random generator provided by `fast-check` up to the fake library and wraps everything within an instance of arbitrary

```ts
// Source: https://fast-check.dev/blog/2024/07/18/integrating-faker-with-fast-check/
import { Faker, Randomizer, base } from '@faker-js/faker';
import fc from 'fast-check';

class FakerBuilder<TValue> extends fc.Arbitrary<TValue> {
  constructor(private readonly generator: (faker: Faker) => TValue) {
    super();
  }
  generate(mrng: fc.Random, biasFactor: number | undefined): fc.Value<TValue> {
    const randomizer: Randomizer = {
      next: (): number => mrng.nextDouble(),
      seed: () => {}, // no-op, no support for updates of the seed, could even throw
    };
    const customFaker = new Faker({ locale: base, randomizer });
    return new fc.Value(this.generator(customFaker), undefined);
  }
  canShrinkWithoutContext(value: unknown): value is TValue {
    return false;
  }
  shrink(value: TValue, context: unknown): fc.Stream<fc.Value<TValue>> {
    return fc.Stream.nil();
  }
}

function fakerToArb<TValue>(generator: (faker: Faker) => TValue): fc.Arbitrary<TValue> {
  return new FakerBuilder(generator);
}
```

Example of usage

```ts
fc.assert(
  fc.property(
    fakerToArb((faker) => faker.person.firstName),
    fakerToArb((faker) => faker.person.lastName),
    (firstName, lastName) => {
      // code
    },
  ),
);
```
