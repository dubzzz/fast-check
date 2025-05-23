---
slug: /advanced/model-based-testing/
---

# Model based testing

Turn fast-check into a crazy QA

## Overview

Model-based testing can also be referred to as [Monkey testing](https://en.wikipedia.org/wiki/Monkey_testing) to some extent. The basic concept is to put our system under stress by providing it with random inputs. With model-based testing, we compare our system to a highly simplified version of it: the model.

:::info The model, an optional helper
While the model part can assist you in writing your tests by storing intermediate states, past actions, or even mimicking the system, it is entirely optional. Model-based testing can be performed without it as well.
:::

In the context of fast-check, model-based testing involves defining a set of commands that can be seen as potential actions to be executed on your system. Each command consists of two elements: a check to verify if the action can be executed in the current context, and the action itself, which also performs assertions. Typically, we rely on the model to verify if the action is suitable and apply the action to both the system and the model.

:::warning The model, a simplified version of the system
Although the model can be a useful tool, it's important to use it carefully. Model's goal is to simplify the system, but there is a risk that it may mimic the system too closely, leading to errors. The model should not be a carbon copy of the system but a simplified representation of it. It's crucial to avoid testing the code by comparing it to itself.
:::

## Write model-based tests

### Define the commands

In fast-check, the commands have to implement the interface [`ICommand`](https://fast-check.dev/api-reference/interfaces/ICommand.html). They basically come with three important methods:

- `check(model)` — Ensure that the model is in the appropriate state to execute the action
- `run(model, real)` — Execute the action
- `toString()` — Serialize the command for error reports

:::tip Example of commands
If your system is a music player, here are some commands you may have: play, pause, next track, add track…
:::

### Generate the commands

Then, to ingest your previously defined commands into fast-check as an arbitrary, you can use the [`commands`](https://fast-check.dev/api-reference/functions/commands.html) arbitrary. This function takes an array of commands as input and compiles them to produce a scenario that can be applied to your system.

:::info Isn't commands just an array builder?
Yes and no!

- Yes, because `commands(myCommands)` could be mimicked by `array(oneof(...myCommands))`.
- No, as it better fits the needs of model based testing. The `commands` helper is like an enhanced version of the `array` designed to meet the requirements of model-based testing. Unlike the `array` arbitrary, it can efficiently shrink failing scenarios.

:::

### Print the commands

To better report the state when a model fails, you may need to capture the state within the scope of the command when it executes. This is particularly useful when commands depend on variables passed via the constructor and possibly impact different parts of the system depending on its state and past commands.

For example, consider a command like "go to track…". It can be parameterized with either the "track name" or the "track position". If the command is fed with a "track name" parameter, there is a high risk that it may not match any existing track available in the system, unless it has been ensured beforehand. On the other hand, if the command is parameterized with "track position", it can work regardless of the set of tracks in the system, as long as there is at least one. In other words, the check will only verify that a track exists and the command is allowed to go to the track from the current state. The command will then go to the track whose name is `allTracks[this.trackPosition % allTracks.length]`. As a user, you would certainly prefer to see "go to track 'the super track'" instead of "go to track 1200".

To achieve this, you may need to modify your command as follows:

```js
class GoToTrackCommand {
  constructor(trackPosition) {
    this.trackPosition = trackPosition;
  }
  check(m) {
    return m.allTracks.length !== 0;
  }
  run(m, r) {
    this.trackName = m.allTracks[this.trackPosition % m.allTracks.length];
    // execute 'go to track' on the system (r) and impact the model (m) if needed
  }
  toString() {
    return `go to track '${this.trackName}'`;
  }
}
```

### Run the commands

Commands have to be executed from the predicate. fast-check provides three model-based runners to run your commands:

- [`modelRun`](https://fast-check.dev/api-reference/functions/modelRun.html) — Apply to any synchronous system: the commands have to be synchronous
- [`asyncModelRun`](https://fast-check.dev/api-reference/functions/asyncModelRun.html) — Can work with asynchronous commands
- [`scheduledModelRun`](https://fast-check.dev/api-reference/functions/scheduledModelRun.html) — Can work with asynchronous commands in a scheduled way for a better detection of race conditions

### Example

Let's take the case of a list class with `pop`, `push`, `size` methods.

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
    ++m.num; // impact the model
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

Now that all our commands are ready, we can run everything:

```typescript
// define the possible commands and their inputs
const allCommands = [
  fc.integer().map((v) => new PushCommand(v)),
  fc.constant(new PopCommand()),
  fc.constant(new SizeCommand()),
];
// run everything
fc.assert(
  fc.property(fc.commands(allCommands, { size: '+1' }), (cmds) => {
    const s = () => ({ model: { num: 0 }, real: new List() });
    fc.modelRun(s, cmds);
  }),
);
```

## Replay model-based tests

Contrary to other arbitraries, commands built using `commands` requires an extra parameter for replay purposes. In addition of passing `{ seed, path }` to `assert`, `commands` must be called with `{ replayPath: string }`.

Whenever `assert` encounters a failure with `commands`, it displays an error log featuring both the seed, path and replayPath to replay it. For instance, in the output below the seed is 670108017, the path 96:5 and the replayPath is AAAAABAAE:VF.

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

// Replay code: straight to the minimal counterexample.
// It only replays the minimal counterexample.
fc.assert(
  fc.property(
    fc.commands(
      /* array of commands */,
      { replayPath: 'AAAAABAAE:VF' }
    ),
    checkEverythingIsOk
  ),
  { seed: 670108017, path: '96:5', endOnFailure: true }
);
```

:::info Why is there something specific to do for commands?
In order to come with a more efficient shrinker, `commands` takes into account the commands that have really been executed.
Basically if the framework generated the following commands `[A,B,C,A,A,C]` but only executed `[A,-,C,A,-,-]` it will shrink only `[A,C,A]`.
The value stored into `replayPath` encodes the history of what was really executed in order not re-run any intermediate step on replay.
:::
