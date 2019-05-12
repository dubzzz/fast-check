# [:house:](../README.md) Tips

Simple tips to unlock all the power of fast-check with only few changes.

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

A full example is available [here](https://github.com/dubzzz/fast-check/tree/master/example/model-based-testing).

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
