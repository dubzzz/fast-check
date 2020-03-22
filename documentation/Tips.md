# [:house:](../README.md) Tips

Simple tips to unlock all the power of fast-check with only few changes.

## Table of contents

- [Filter invalid combinations using pre-conditions](#filter-invalid-combinations-using-pre-conditions)
- [Model based testing or UI test](#model-based-testing-or-ui-test)
- [Detect race conditions](#detect-race-conditions)
- [Opt for verbose failures](#opt-for-verbose-failures)
- [Log within a predicate](#log-within-a-predicate)
- [Preview generated values](#preview-generated-values)
- [Replay after failure](#replay-after-failure)
- [Replay after failure for commands](#replay-after-failure-for-commands)
- [Add custom examples next to generated ones](#add-custom-examples-next-to-generated-ones)
- [Combine with other faker or random generator libraries](#combine-with-other-faker-or-random-generator-libraries)
- [Setup global settings](#setup-global-settings)
- [Avoid tests to reach the timeout of your test runner](#avoid-tests-to-reach-the-timeout-of-your-test-runner)
- [Customize the reported error](#customize-the-reported-error)
- [Create a CodeSandbox link on error](#create-a-codesandbox-link-on-error)
- [Migrate from jsverify to fast-check](#migrate-from-jsverify-to-fast-check)
- [Supported targets from node to deno](#supported-targets-from-node-to-deno)

## Filter invalid combinations using pre-conditions

Filtering invalid combinations of generated entries can be done in two ways in fast-check:
- at arbitrary level using `.filter(...)`
- at property level using `fc.pre(expectedToBeTrue)`

This part describes the usage of `fc.pre(...)`. More details on `.filter(...)` in [Advanced Arbitraries](./AdvancedArbitraries.md).

`fc.pre(...)` can be used anywhere within check functions. For instance, you might write:

```js
fc.assert(
  fc.property(
    fc.nat(), fc.nat(),
    (a, b) => {
      // runs not having a < b will be disgarded
      fc.pre(a < b);
      // ... your code
      // ... and possibly other preconditions using fc.pre(...)
    }
  )
)
```

Whenever it encounters a failing precondition, the framework generates another value and forgets about this run - *neither failed nor succeeded*.

The advantage of `fc.pre(...)` over `.filter(...)` is that runs having too many rejected values will be marked as faulty. When used in combination of `fc.check(...)` it can help to design new filtered arbitraries as the number of skipped values will be computed and available in the output.

However when your arbitrary is safe enough, switching to `.filter(...)` might be taken into for two reasons:
- easier to share the arbitrary across multiple tests
- higher performances - contrary to `fc.pre`, `fc.filter` is not exception-based making it faster

## Model based testing or UI test

Model based testing approach have been introduced into fast-check to ease UI testing or state machine tests.

The idea of the approach is to define commands that could be applied to your system. The framework then picks zero, one or more commands and run them sequentially if they can be executed on the current state.

A full example is available [here](https://github.com/dubzzz/fast-check/tree/master/example/004-stateMachine/musicPlayer).

Let's take the case of a list class with `pop`, `push`, `size` methods as an example.

```typescript
class List {
  data: number[] = [];
  push = (v: number) => this.data.push(v);
  pop = () => this.data.pop()!;
  size = () => this.data.length;
}
```

Model based testing requires a model. A model is a simplified version of the real system. In this precise case our model would contain only a single integer representing the size of the list.

```typescript
type Model = { num: number };
```

Then we have to define a command for each of the available operations on our list. Commands come with two methods:
- `check(m: Readonly<Model>): boolean`: true if the command can be executed given the current state
- `run(m: Model, r: RealSystem): void`: execute the command on the system and update the model accordingly. Check for potential problems or inconsistencies between the model and the real system - throws in such case.

```typescript
class PushCommand implements fc.Command<Model, List> {
  constructor(readonly value: number) {}
  check = (m: Readonly<Model>) => true;
  run(m: Model, r: List): void {
    r.push(this.value); // impact the system
    ++m.num;            // impact the model
  }
  toString = () => `push(${this.value})`;
}
class PopCommand implements fc.Command<Model, List> {
  check(m: Readonly<Model>): boolean {
    // should not call pop on empty list
    return m.num > 0;
  }
  run(m: Model, r: List): void {
    assert.equal(typeof r.pop(), 'number');
    --m.num;
  }
  toString = () => 'pop';
}
class SizeCommand implements fc.Command<Model, List> {
  check = (m: Readonly<Model>) => true;
  run(m: Model, r: List): void {
    assert.equal(r.size(), m.num);
  }
  toString = () => 'size';
}
```

Now that all or commands are ready we can run everything:

```typescript
// define the possible commands and their inputs
const allCommands = [
  fc.integer().map(v => new PushCommand(v)),
  fc.constant(new PopCommand()),
  fc.constant(new SizeCommand())
];
// run everything
fc.assert(
  fc.property(fc.commands(allCommands, 100), cmds => {
    const s = () => ({ model: { num: 0 }, real: new List() });
    fc.modelRun(s, cmds);
  })
);
```

The code above can easily be applied to other state machines, APIs or UI. In the case of asynchronous operations you need to implement `AsyncCommand` and use `asyncModelRun`.

**NOTE:** Contrary to other arbitraries, commands built using `fc.commands` requires an extra parameter for replay purposes. In addition of passing `{ seed, path }` to `fc.assert`, `fc.commands` must be called with `{ replayPath: string }`.

## Detect race conditions

Even if JavaScript is mostly a mono-threaded language, it is quite easy to introduce race conditions in your code.

`fast-check` comes with a built-in feature accessible through `fc.scheduler` that will help you to detect such issues earlier during the development. It basically re-orders the execution of your promises or async tasks in order to make it crash under unexpected orderings.

The best way to see it in action is certainly to check the snippets provided in our [CodeSandbox@005-race](https://codesandbox.io/s/github/dubzzz/fast-check/tree/master/example?hidenavigation=1&module=%2F005-race%2Fautocomplete%2Fmain.spec.tsx&previewwindow=tests).

Here is a very simple React-based example that you can play with on [CodeSandbox](https://codesandbox.io/s/github/dubzzz/fast-check/tree/master/example?hidenavigation=1&module=%2F005-race%2FuserProfile%2Fmain.spec.tsx&previewwindow=tests):

```jsx
/* Component */

import { getUserProfile } from './api.js'
function UserPageProfile(props) {
  const { userId } = props;
  const [userData, setUserData] = React.useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      const data = await getUserProfile(props.userId);
      setUserData(data);
    };
    fetchUser();
  }, [userId]);

  if (userData === null) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <div data-testid="user-id">Id: {userData.id}</div>
      <div data-testid="user-name">Name: {userData.name}</div>
    </div>
  );
}

/* Test with react testing library */

test('should not display data related to another user', () =>
  fc.assert(
    fc.asyncProperty(
      fc.array(fc.uuid(), fc.uuid(), fc.scheduler(),
      async (uid1, uid2, s) => {
        // Arrange
        getUserProfile.mockImplementation(
          s.scheduleFunction(async (userId) => ({ id: userId, name: userId })));

        // Act
        const { rerender, queryByTestId } = render(<UserProfilePage userId={uid1} />);
        s.scheduleSequence([
          async () => {
            rerender(<UserProfilePage userId={uid2} />);
          }
        ]);
        while (s.count() !== 0) {
          await act(async () => {
            await s.waitOne();
          });
        }

        // Assert
        expect((await queryByTestId('user-id')).textContent).toBe(`Id: ${uid2}`);
      })
      .beforeEach(async () => {
        jest.resetAllMocks();
        cleanup();
      })
  ));
```

In case of failure, the reported error will contain the scheduler that caused the issue along with other generated values if any.
Here is what an error can look like in case we only asked for a scheduler:

```
 Property failed after 1 tests
 { seed: -22040264, path: "0", endOnFailure: true }
 Counterexample: [schedulerFor()`
 -> [task${1}] promise resolved with value "A"     
 -> [task${3}] promise resolved with value "C"
 -> [task${2}] promise resolved with value "B"`]
 Shrunk 0 time(s)
```

Given such failure you can either replay it by using the provided `{ seed, path, endOnFailure }` - _see [Replay after failure](#replay-after-failure)_ -
or put the scheduler as an example to be used for every future run - _see [Add custom examples next to generated ones](#add-custom-examples-next-to-generated-ones)_.

If you want to add this example in your set of custom examples you have to use `fc.schedulerFor` and copy the counterexample coming from the stack trace into the `examples` given to `fc.assert` as follow:

```js
test('should run with custom scheduler then generated ones', () =>
  fc.assert(
    fc.property(fc.scheduler(), (s) => {/* Test */}),
    {
      examples: [
        [fc.schedulerFor()`
 -> [task${1}] promise resolved with value "A"     
 -> [task${3}] promise resolved with value "C"
 -> [task${2}] promise resolved with value "B"`]
      ]
    }
  ));
```

## Opt for verbose failures

By default, the failures reported by `fast-check` feature most relevant data:
- seed
- path towards the minimal counterexample
- number of tries before the first failure
- depth of the shrink
- minimal counterexample

`fast-check` comes with a verbose mode, which can help users while trying to dig into a failure.

For instance, let's suppose the following property failed:
```js
fc.assert(
    fc.property(
        fc.string(), fc.string(), fc.string(),
        (a,b,c) => contains(a+b+c, b)));
```

The output will look something like:
```
Error: Property failed after 1 tests (seed: 1527423434693, path: 0:0:0): ["","",""]
Shrunk 1 time(s)
Got error: Property failed by returning false

Hint: Enable verbose mode in order to have the list of all failing values encountered during the run
```

In order to enable the `verbose` mode, we just need to give a second parameter to `fc.assert` as follow:
```js
fc.assert(
    fc.property(
        fc.string(), fc.string(), fc.string(),
        (a,b,c) => contains(a+b+c, b)),
    {verbose: true});
```

Verbose logs give more details on the error as they will contain all the counterexamples encountered while shrinking the inputs. The example above results in:
```
Error: Property failed after 1 tests (seed: 1527423434693, path: 0:0:0): ["","",""]
Shrunk 2 time(s)
Got error: Property failed by returning false

Encountered failures were:
- ["","JeXPqIQ6",">q"]
- ["","",">q"]
- ["","",""]
```

With that output, we notice that our `contains` implementation seems to fail when the `pattern` we are looking for is the beginning of the string we are looking in.

Verbosity can be set to produce even more verbose logs by setting `verbose` flag to:
- `0`: `None` - default, equivalent to `false`
- `1`: `Verbose` - equivalent to `true`
- `2`: `VeryVerbose` - logs all the produced values in case of failure

Refer to `fc.VerbosityLevel` for more details.

## Log within a predicate

In order to ease the diagnosis of red properties, fast-check introduced an internal logger that can be used to log stuff inside the predicate itself.

The advantage of this logger is that one logger is linked to one run so that the counterexample comes with its own logs (and not the ones of previous failures leading to this counterexample). Logs will only be shown in case of failure contrary to `console.log` that would pop everywhere.

Usage is quite simple, logger is one of the features available inside the `Context` interface:

```typescript
fc.assert(
    fc.property(
        fc.string(),
        fc.string(),
        fc.context(), // comes with a log method
        (a: number, b: number, ctx: fc.Context): boolean => {
            const intermediateResult = /* ... */;
            ctx.log(`Intermediate: ${intermediateResult}`);
            return check(intermediateResult);
        }
    )
)
```

## Preview generated values

Before writing down your test, it might be great to confirm that the arbitrary you will be using produce the values you want.

This can be done very easily by using either `fc.sample` or `fc.statistics`.

The following code constructs an array containing the first 10 values that would have been generated by the arbitrary `fc.anything()` if used inside a `fc.assert` or `fc.check`:

```typescript
fc.sample(
    fc.anything(), // arbitrary or property to extract the values from
    10             // number of values to extract
);
```

In some cases, having a sample is not enough and we want more insights about the generated data.
For instance, I might be interested by the share of even numbers generated by `fc.nat()`.
For that purpose I can use `fc.statistics` as follow:

```typescript
fc.statistics(
    fc.nat(),    // arbitrary or property to extract the values from
    n => n % 2 === 0 ? 'Even number' : 'Odd number', // classifier
    10000        // number of values to extract
);
// Possible output (console.log):
// Odd number...50.30%
// Even number..49.70%
```

## Replay after failure

`fast-check` comes with a must have feature: replay a failing case immediately given its seed and path (seed only to replay all).

Whenever `fc.assert` encounters a failure, it displays an error log featuring both the seed and the path to replay it. For instance, in the output below the seed is 1525890375951 and the path 0:0.

```
Error: Property failed after 1 tests
{ seed: 1525890375951, path: 0:0, endOnFailure: true }
Counterexample: [0]
Shrunk 1 time(s)
Got error: Property failed by returning false
```

In order to replay the failure on the counterexample - `[0]`, you have to change your code as follow:

```typescript
// Original code
fc.assert(
  fc.property(
    fc.nat(),
    checkEverythingIsOk
  )
);

// Replay code: straight to the minimal counterexample
// Only replay the minimal counterexample
fc.assert(
  fc.property(
    fc.nat(),
    checkEverythingIsOk
  ),
  {
    seed: 1525890375951,
    path: "0:0",
    endOnFailure: true
  }
);
```

**NOTE:** Replaying `fc.commands` requires passing an additional flag called `replayPath` when building this arbitrary (see below).

## Replay after failure for commands

As any other built-in arbitrary, `fc.commands` is replayable but the process is a bit different.

Whenever `fc.assert` encounters a failure with `fc.commands`, it displays an error log featuring both the seed, path and replayPath to replay it. For instance, in the output below the seed is 670108017, the path 96:5 and the replayPath is AAAAABAAE:VF.

```
Property failed after 97 tests
{ seed: 670108017, path: "96:5", endOnFailure: true }
Counterexample: [PlayToken[0],NewGame,PlayToken[1],Refresh /*replayPath="AAAAABAAE:VF"*/]
Shrunk 1 time(s)
Got error: Error: expect(received).toEqual(expected)
```

In order to replay the failure on the counterexample - `[PlayToken[0],NewGame,PlayToken[1],Refresh]`, you have to change your code as follow:

```typescript
// Original code
fc.assert(
  fc.property(
    fc.commands(/* array of commands */),
    checkEverythingIsOk
  )
);

// Replay code: straight to the minimal counterexample
// Only replay the minimal counterexample
fc.assert(
  fc.property(
    fc.commands(
      /* array of commands */,
      {
        replayPath: "AAAAABAAE:VF"
      }
    ),
    checkEverythingIsOk
  ),
  {
    seed: 670108017,
    path: "96:5",
    endOnFailure: true
  }
);
```

**NOTE:** Why is there something specific to do for `fc.commands`?
In order to come with a more efficient and faster shrinker, `fc.commands` takes into account the commands that have really been executed.
Basically if the framework generated the following commands `[A,B,C,A,A,C]` but only executed `[A,-,C,A,-,-]` it will shrink only `[A,C,A]`.
The value stored into `replayPath` encodes the history of what was really executed in order not re-run anything on replay.

## Add custom examples next to generated ones

Sometimes it might be useful to run your test on some custom examples you think useful: either because they caused your code to fail in the past or because you explicitely want to confirm it succeeds on this specific example.

Whatever the reason, the framework provides you the ability to set a custom list of examples into the settings of `fc.assert`.
Those examples will be executed first followed by the values generated by the framework. It does not impact the number of values that will be tested against your property - *meaning that if you add 5 custom examples, you remove 5 generated values from the run*.

The syntax is the following:

```typescript
// For a one parameter property
fc.assert(
  fc.property(
    fc.nat(),
    myCheckFunction
  ),
  {
    examples: [
      [0], // first example I want to test
      [Number.MAX_SAFE_INTEGER]
    ]
  }
)

// For a multiple parameters property
fc.assert(
  fc.property(
    fc.string(), fc.string(), fc.string(),
    myCheckFunction
  ),
  {
    examples: [
      ['', '', '']
    ]
  }
)
```

Please keep in mind that property based testing frameworks are fully able to find corner-cases with no help at all.

## Combine with other faker or random generator libraries

In order to integrate external faker or random generator libraries within fast-check, the generators have to be wrapped as arbitraries.

The minimal requirement that needs to be fulfilled by the wrapped library is to provide a way to be seeded and reproducible. fast-check cannot offer replay capabilities if the underlying generators are not able to generate the same values from one run to another.

Here are some examples of how external faker libraries can be wrapped within fast-check.

With [faker](https://www.npmjs.com/package/faker) - seed based faker:

```js
const fc = require('fast-check');
const faker = require('faker');

const fakerToArb = (fakerGen) => {
  return fc.integer()
    .noBias()   // same probability to generate each of the allowed integers
    .noShrink() // shrink on a seed makes no sense
    .map(seed => {
      faker.seed(seed);  // seed the generator
      return fakerGen(); // call it
    });
};

const streetAddressArb = fakerToArb(faker.address.streetAddress);
const customArb = fakerToArb(() => faker.fake("{{name.lastName}}, {{name.firstName}} {{name.suffix}}"));
```

With [lorem-ipsum](https://www.npmjs.com/package/lorem-ipsum) - random generator based faker:

```js
const fc = require('fast-check');
const { loremIpsum } = require("lorem-ipsum");

const loremArb = fc.infiniteStream(fc.double().noBias())
  .noShrink()
  .map(s => {
    const rng = () => s.next().value; // prng like Math.random but controlled by fast-check
    return loremIpsum({ random: rng });
  });
```

Please note that in the two examples above, the resulting arbitraries will not have full shrinking capabilities. But they offer a full support for random value generation.

## Setup global settings

All the runners provided by fast-check come with an optional parameter to customize how the runner will behave (see `fc.assert`, `fc.check`, `fc.sample` or `fc.statistics`). In the past, this parameter had to be provided runner by runner otherwise user would have fallbacked on the default values hardcoded in fast-check code. For instance, if one wanted to override the default number of runs of properties, it would have written:

```typescript
test('test #1', () => {
  fc.assert(
    myProp1,
    { numRuns: 10 }
  )
})
test('test #2', () => {
  fc.assert(
    myProp2,
    { numRuns: 10 } // duplicated
  )
})
```

Starting at version `1.18.0`, the code above can be changed into:

```typescript
fc.configureGlobal({ numRuns: 10 }) // see below for the recommended way (Jest/Mocha)
test('test #1', () => {
  fc.assert(myProp1)
})
test('test #2', () => {
  fc.assert(myProp2)
})
```

**With Mocha**

*Create a new setup file that will be executed before executing the test code itself - use `--file=mocha.setup.js` option to reference this file*

```js
// mocha.setup.js
const fc = require("fast-check");
fc.configureGlobal({ numRuns: 10 });
```

**With Jest**

*Edit the configuration of Jest to add your own setup file - usually the configuration is defined in jest.config.js*
```js
// jest.config.js
module.exports = {
  setupFiles: ["./jest.setup.js"]
};
```

*Create a new setup file that will be executed before executing the test code itself*

```js
// jest.setup.js
const fc = require("fast-check");
fc.configureGlobal({ numRuns: 10 });
```

## Avoid tests to reach the timeout of your test runner

Most of the time, test runners like Jest, Mocha or even Jasmine come with default timeouts. Whenever one test takes longer than this time limit, the test runner might stop it immediately. Unfortunately whenever fast-check gets stopped at the middle of a run, it cannot give back the seed nor the path that were used during this test.

Here are some possible reasons why you may encounter timeouts with property based testing:
- (1) an entry generated by fast-check took longer than expected
- (2) shrinking process takes longer than expected - the main target of shrinking process is to report the user with the very minimal failing case, in order to achieve that it has to try many sub-inputs

In order to prevent your tests from timing out in your CI, you may [setup global settings](#setup-global-settings) with the following configuration:

```js
fc.configureGlobal({
  interruptAfterTimeLimit: 4000, // Default timeout in Jest 5000ms
  markInterruptAsFailure: true,  // When set to true, timeout during initial cases (1) will be marked as an error
                                 // When set to false, timeout during initial cases (1) will not be considered as a failure
});
```

If you opt for `markInterruptAsFailure: true`, you can still limit the time taken by long running tests locally by tweaking the settings passed into `fc.assert` with a value of `numRuns` smaller than your default one.

## Customize the reported error

By default, `fc.assert` automatically handles and formats the failures that occur when running your properties.

Nonetheless, in some cases you might be interested into customizing, extending or even changing what should be a failure or how it should be formated.
In order to customize it, you can define your own reporting strategy by passing a custom reporter to `fc.assert`:

```javascript
fc.assert(
  // You can either use it with `fc.property`
  // or `fc.asyncProperty`
  fc.property(...),
  {
    reporter(out) {
      // Let's say we want to re-create the default reporter of `assert`
      if (out.failed) {
        // `defaultReportMessage` is an utility that make you able to have the exact
        // same report as the one that would have been generated by `assert`
        throw new Error(fc.defaultReportMessage(out));
      }
    }
  }
)
```

In case your reporter is relying on asynchronous code, you can specify it by setting `asyncReporter` instead of `reporter`.
Contrary to `reporter` that will be used for both synchronous and asynchronous properties, `asyncReporter` is forbidden for synchronous properties and makes them throw.

In the past, before `reporter` or `asyncReporter`, writing your own `fc.assert` including your own reporter would have been written as follow:

```javascript
const throwIfFailed = (out) => {
  if (out.failed) {
    throw new Error(fc.defaultReportMessage(out));
  }
}
const myCustomAssert = (property, parameters) => {
  const out = fc.check(property, parameters);

  if (property.isAsync()) {
    return out.then(runDetails => {
      throwIfFailed(runDetails)
    });
  }
  throwIfFailed(out);
}
```

## Create a CodeSandbox link on error

_If you have not read about ways to customize the reporter used by `fc.assert` please refer to the section above._

In some situations, it can be useful to directly publish a minimal reproduction of an issue in order to be able to play with it.
Custom reporters can be used to provide such capabilities.

For instance, you can automatically generate CodeSandbox environments in case of failed property with the snippet below:

```javascript
import { getParameters } from 'codesandbox/lib/api/define';

const buildCodeSandboxReporter = (createFiles) => {
  return function reporter(runDetails) {
    if (!runDetails.failed) {
      return;
    }
    const counterexample = runDetails.counterexample;
    const originalErrorMessage = fc.defaultReportMessage(runDetails);
    if (counterexample === undefined) {
      throw new Error(originalErrorMessage);
    }
    const files = {
      ...createFiles(counterexample),
      'counterexample.js': {
        content: `export const counterexample = ${fc.stringify(counterexample)}`
      },
      'report.txt': {
        content: originalErrorMessage
      }
    }
    const url = `https://codesandbox.io/api/v1/sandboxes/define?parameters=${getParameters({ files })}`;
    throw new Error(`${originalErrorMessage}\n\nPlay with the failure here: ${url}`);
  }
}

fc.assert(
  fc.property(...),
  {
    reporter: buildCodeSandboxReporter(counterexample => ({
      'index.js': {
        content: 'console.log("Code to reproduce the issue")'
      }
    }))
  }
)
```

The official documentation explaining how to build CodeSandbox environments from an url is available here: https://codesandbox.io/docs/importing#get-request

## Migrate from jsverify to fast-check

The npm package [jsverify-to-fast-check](https://www.npmjs.com/package/jsverify-to-fast-check) comes with a set of tools to help users to migrate from jsverify to fast-check smoothly.

## Supported targets from node to deno

Here are some alternatives ways to import fast-check into your project.

Node with CommonJS:
```js
const fc = require('fast-check');
```

Node with ES Modules:
```js
import fc from 'fast-check';
```

Deno:
```js
import fc from "https://cdn.skypack.dev/fast-check";
```

Web Browser:
```html
<script type="module">
  import fc from "https://cdn.skypack.dev/fast-check";
  // code...
</script>
```

More details on [pika](https://www.pika.dev/npm/fast-check/).
