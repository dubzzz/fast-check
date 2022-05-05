# [:house:](../README.md) Race conditions detection

In order to ease the detection of race conditions in your code, `fast-check` comes with a built-in asynchronous scheduler.
The aim of the scheduler - `fc.scheduler()` - is to reorder the order in which your async calls will resolve.

By doing this it can highlight potential race conditions in your code. Please refer to [code snippets](https://codesandbox.io/s/github/dubzzz/fast-check/tree/main/example?hidenavigation=1&module=%2F005-race%2Fautocomplete%2Fmain.spec.tsx&previewwindow=tests) for more details.

## Table of contents

- [Overview of the API](#overview-of-the-api)
- [Scheduling methods](#scheduling-methods)
  - [`schedule`](#schedule)
  - [`scheduleFunction`](#schedulefunction)
  - [`scheduleSequence`](#schedulesequence)
  - [Missing helpers](#missing-helpers)
- [Wrapping calls automatically using `act`](#wrapping-calls-automatically-using-act)
- [Model based testing and race conditions](#model-based-testing-and-race-conditions)

## Overview of the API

`fc.scheduler<TMetadata=unknown>()` is just an `Arbitrary` providing a `Scheduler` instance. The generated scheduler has the following interface:

- `schedule: <T>(task: Promise<T>, label?: string, metadata?: TMetadata) => Promise<T>` - Wrap an existing promise using the scheduler. The newly created promise will resolve when the scheduler decides to resolve it (see `waitOne` and `waitAll` methods).
- `scheduleFunction: <TArgs extends any[], T>(asyncFunction: (...args: TArgs) => Promise<T>) => (...args: TArgs) => Promise<T>` - Wrap all the promise produced by an API using the scheduler. `scheduleFunction(callApi)`
- `scheduleSequence(sequenceBuilders: SchedulerSequenceItem<TMetadata>[]): { done: boolean; faulty: boolean, task: Promise<{ done: boolean; faulty: boolean }> }` - Schedule a sequence of operations. Each operation requires the previous one to be resolved before being started. Each of the operations will be executed until its end before starting any other scheduled operation.
- `count(): number` - Number of pending tasks waiting to be scheduled by the scheduler.
- `waitOne: () => Promise<void>` - Wait one scheduled task to be executed. Throws if there is no more pending tasks.
- `waitAll: () => Promise<void>` - Wait all scheduled tasks, including the ones that might be created by one of the resolved task. Do not use if `waitAll` call has to be wrapped into an helper function such as `act` that can relaunch new tasks afterwards. In this specific case use a `while` loop running while `count() !== 0` and calling `waitOne` - _see CodeSandbox example on userProfile_.
- `waitFor: <T>(unscheduledTask: Promise<T>) => Promise<T>` - Wait as many scheduled tasks as need to resolve the received task. Contrary to `waitOne` or `waitAll` it can be used to wait for calls not yet scheduled when calling it (some test solutions like supertest use such trick not to run any query before the user really calls then on the request itself). Be aware that while this helper will wait eveything to be ready for `unscheduledTask` to resolve, having uncontrolled tasks triggering stuff required for `unscheduledTask` might make replay of failures harder as such asynchronous triggers stay out-of-control for fast-check.
- `report: () => SchedulerReportItem<TMetaData>[]` - Produce an array containing all the scheduled tasks so far with their execution status. If the task has been executed, it includes a string representation of the associated output or error produced by the task if any. Tasks will be returned in the order they get executed by the scheduler.

With:

```ts
type SchedulerSequenceItem<TMetadata> =
  | { builder: () => Promise<any>; label: string; metadata?: TMetadata }
  | (() => Promise<any>);
```

You can also define an hardcoded scheduler by using `fc.schedulerFor(ordering: number[])` - _should be passed through `fc.constant` if you want to use it as an arbitrary_. For instance: `fc.schedulerFor([1,3,2])` means that the first scheduled promise will resolve first, the third one second and at the end we will resolve the second one that have been scheduled.

## Scheduling methods

### `schedule`

Create a scheduled `Promise` based on an existing one - _aka. wrapped `Promise`_.
The life-cycle of the wrapped `Promise` will not be altered at all.
On its side the scheduled `Promise` will only resolve when the scheduler decides it to be resolved.

Once scheduled by the scheduler, the scheduler will wait the wrapped `Promise` to resolve - _if it was not already the case_ - before sheduling anything else.

**Signature:**

```ts
schedule: <T>(task: Promise<T>) => Promise<T>
schedule: <T>(task: Promise<T, label: string>) => Promise<T>
```

**Usages:**

Any algorithm taking raw `Promise` as input might be tested using this scheduler.

For instance, `Promise.all` and `Promise.race` are examples of such algorithms.

**More:**

```ts
// Let suppose:
// - s        : Scheduler
// - shortTask: Promise   - Very quick operation
// - longTask : Promise   - Relatively long operation

shortTask.then(() => {
  // not impacted by the scheduler
  // as it is directly using the original promise
});

const scheduledShortTask = s.schedule(shortTask);
const scheduledLongTask = s.schedule(longTask);

// Even if in practice, shortTask is quicker than longTask
// If the scheduler selected longTask to end first,
// it will wait longTask to end, then once ended it will resolve scheduledLongTask,
// while scheduledShortTask will still be pending until scheduled.
await s.waitOne();
```

### `scheduleFunction`

Create a producer of scheduled `Promise`.

Lots of our asynchronous codes make use of functions able to generate `Promise` based on inputs.
Fetching from a REST API using `fetch("http://domain/")` or accessing data from a database `db.query("SELECT * FROM table")` are examples of such producers.

`scheduleFunction` makes it possible to re-order when those outputed `Promise` resolve by providing a function that under the hood **directly** calls the producer but schedules its resolution so that it has to be scheduled by the scheduler.

**Signature:**

```ts
scheduleFunction: <TArgs extends any[], T>(asyncFunction: (...args: TArgs) => Promise<T>) => (...args: TArgs) => Promise<T>
```

**Usages:**

Any algorithm making calls to asynchronous APIs can highly benefit from this wrapper to re-order calls.

WARNING: `scheduleFunction` is only postponing the resolution of the function. The call to the function itself is started immediately when the caller calls something on the scheduled function.

**More:**

```ts
// Let suppose:
// - s             : Scheduler
// - getUserDetails: (uid: string) => Promise - API call to get details for a User

const getUserDetailsScheduled = s.scheduleFunction(getUserDetails);

getUserDetailsScheduled('user-001')
  // What happened under the hood?
  // - A call to getUserDetails('user-001') has been triggered
  // - The promise returned by the call to getUserDetails('user-001') has been registered to the scheduler
  .then((dataUser001) => {
    // This block will only be executed when the scheduler
    // will schedule this Promise
  });

// Unlock one of the scheduled Promise registered on s
// Not necessarily the first one that resolves
await s.waitOne();
```

### `scheduleSequence`

A scheduled sequence can be seen as a sequence a asynchronous calls we want to run in a precise order.

One important fact about scheduled sequence is that whenever one task of the sequence gets scheduled, **no other scheduled task in the scheduler can be unqueued** while this task has not ended. It means that tasks defined within a scheduled sequence must not require other scheduled task to end to fulfill themselves - _it does not mean that they should not force the scheduling of other scheduled tasks_.

**Signature:**

```ts
type SchedulerSequenceItem =
    { builder: () => Promise<any>; label: string } |
    (() => Promise<any>)
;

scheduleSequence(sequenceBuilders: SchedulerSequenceItem[]): { done: boolean; faulty: boolean, task: Promise<{ done: boolean; faulty: boolean }> }
```

**Usages:**

You want to check the status of a database, a webpage after many known operations.

Most of the time, model based testing might be a better fit for that purpose.

**More:**

```jsx
// Let suppose:
// - s: Scheduler

const initialUserId = '001';
const otherUserId1 = '002';
const otherUserId2 = '003';

// render profile for user {initialUserId}
// Note: api calls to get back details for one user are also scheduled
const { rerender } = render(<UserProfilePage userId={initialUserId} />);

s.scheduleSequence([
  async () => rerender(<UserProfilePage userId={otherUserId1} />),
  async () => rerender(<UserProfilePage userId={otherUserId2} />),
]);

await s.waitAll();
// expect to see profile for user otherUserId2
```

### Missing helpers

**Scheduling a function call**

In some tests, we want to try cases where we launch multiple concurrent queries towards our service in order to see how it behaves in the context of concurrent operations.

```ts
const scheduleCall = <T>(s: Scheduler, f: () => Promise<T>) => {
  s.schedule(Promise.resolve('Start the call')).then(() => f());
};

// Calling doStuff will be part of the task scheduled in s
scheduleCall(s, () => doStuff());
```

**Scheduling a call to a mocked server**

Contrary the behaviour of `scheduleFunction`, real calls to servers are not immediate and you might want to also schedule when the call _reaches_ your mocked-server.

Let's imagine you are building a TODO-list app. Your users can add a TODO only if no other TODO has the same label. If you use the built-in `scheduleFunction` to test it, the mocked-server will always receive the calls in the same order as the one they were done.

```ts
const scheduleMockedServerFunction = <TArgs extends unknown[], TOut>(
  s: Scheduler,
  f: (...args: TArgs) => Promise<TOut>
) => {
  return (...args: TArgs) => {
    return s.schedule(Promise.resolve('Server received the call')).then(() => f(...args));
  };
};

const newAddTodo = scheduleMockedServerFunction(s, (label) => mockedApi.addTodo(label));
// With newAddTodo = s.scheduleFunction((label) => mockedApi.addTodo(label))
// The mockedApi would have received todo-1 first, followed by todo-2
// When each of those calls resolve would have been the responsibility of s
// In the contrary, with scheduleMockedServerFunction, the mockedApi might receive todo-2 first.
newAddTodo('todo-1'); // .then
newAddTodo('todo-2'); // .then

// or...

const scheduleMockedServerFunction = <TArgs extends unknown[], TOut>(
  s: Scheduler,
  f: (...args: TArgs) => Promise<TOut>
) => {
  const scheduledF = s.scheduleFunction(f);
  return (...args: TArgs) => {
    return s.schedule(Promise.resolve('Server received the call')).then(() => scheduledF(...args));
  };
};
```

**Scheduling timers like setTimeout or setInterval**

Sometimes our asynchronous code rely on the use of native timers offered by the JavaScript engine like: `setTimeout` or `setInterval`.
Contrary to other asynchronous operations, timers are ordered. A timer waiting 10ms will be executed before a timer waiting 100ms.
As a consequence, they need a very special treatment.

The following snippet is relying on Jest.
Nonetheless it can be adapted for other test runners if needed.

```js
// You should call: `jest.useFakeTimers()` at the beginning of your test

// The method will automatically schedule tasks to enqueue pending timers if needed.
// Instead of calling: `await s.waitAll()`
// You can call: `await waitAllWithTimers(s)`
const waitAllWithTimers = async (s) => {
  let alreadyScheduledTaskToUnqueueTimers = false;
  const countWithTimers = () => {
    // Append a scheduled task to unqueue pending timers (if task missing and pending timers)
    if (!alreadyScheduledTaskToUnqueueTimers && jest.getTimerCount() !== 0) {
      alreadyScheduledTaskToUnqueueTimers = true;
      s.schedule(Promise.resolve('advance timers if any')).then(() => {
        alreadyScheduledTaskToUnqueueTimers = false;
        jest.advanceTimersToNextTimer();
      });
    }
    return s.count();
  };
  while (countWithTimers() !== 0) {
    await s.waitOne();
  }
};
```

Alternatively you can wrap the scheduler produced by fast-check to add timer capabilities to it:

```js
// You should call: `jest.useFakeTimers()` at the beginning of your test
// You should replace: `fc.scheduler()` by `fc.scheduler().map(withTimers)`

const withTimers = (s) => {
  let alreadyScheduledTaskToUnqueueTimers = false;
  const appendScheduledTaskToUnqueueTimersIfNeeded = () => {
    // Append a scheduled task to unqueue pending timers (if task missing and pending timers)
    if (!alreadyScheduledTaskToUnqueueTimers && jest.getTimerCount() !== 0) {
      alreadyScheduledTaskToUnqueueTimers = true;
      s.schedule(Promise.resolve('advance timers if any')).then(() => {
        alreadyScheduledTaskToUnqueueTimers = false;
        jest.advanceTimersToNextTimer();
      });
    }
  };

  return {
    schedule(...args) {
      return s.schedule(...args);
    },
    scheduleFunction(...args) {
      return s.scheduleFunction(...args);
    },
    scheduleSequence(...args) {
      return s.scheduleSequence(...args);
    },
    count() {
      return s.count();
    },
    toString() {
      return s.toString();
    },
    async waitOne() {
      appendScheduledTaskToUnqueueTimersIfNeeded();
      await s.waitOne();
    },
    async waitAll() {
      appendScheduledTaskToUnqueueTimersIfNeeded();
      while (s.count()) {
        await s.waitOne();
        appendScheduledTaskToUnqueueTimersIfNeeded();
      }
    },
  };
};
```

## Wrapping calls automatically using `act`

`fc.scheduler({ act })` can be given an `act` function that will be called in order to wrap all the scheduled tasks. A code like the following one:

```js
fc.assert(
  fc.asyncProperty(fc.scheduler(), async s => () {
    // Pushing tasks into the scheduler ...
    // ....................................
    while (s.count() !== 0) {
      await act(async () => {
        // This construct is mostly needed when you want to test stuff in React
        // In the context of act from React, using waitAll would not have worked
        // as some scheduled tasks are triggered after waitOne resolved
        // and because of act (effects...)
        await s.waitOne();
      });
    }
  }))
```

Is equivalent to:

```js
fc.assert(
  fc.asyncProperty(fc.scheduler({ act }), async s => () {
    // Pushing tasks into the scheduler ...
    // ....................................
    await s.waitAll();
  }))
```

A simplified implementation for `waitOne` would be:

```js
async waitOne() {
  await act(async () => {
    await getTaskToBeResolved();
  })
}
async waitAll() {
  while (count() !== 0) {
    await waitOne();
  }
}
```

## Model based testing and race conditions

Model based testing capabilities can be used to help race conditions detection by using the runner `fc.scheduledModelRun`.

By using `fc.scheduledModelRun` even the execution of the model is scheduled using the scheduler.

One important fact to know when mixing model based testing with schedulers is that neither `check` nor `run` should rely on the completion of other scheduled tasks to fulfill themselves but they can - _and most of the time have to_ - trigger new scheduled tasks. No other scheduled task will be resolved during the execution of `check` or `run`.
