---
slug: /advanced/race-conditions/
---

# Race conditions

Easily detect race conditions in your JavaScript code

## Overview

Race conditions can easily occur in JavaScript due to its event-driven nature. Any situation where JavaScript has the ability to schedule tasks could potentially lead to race conditions.

> A race condition […] is the condition […] where the system's substantive behavior is dependent on the **sequence** or timing of other **uncontrollable events**.

_Source: https://en.wikipedia.org/wiki/Race_condition_

Identifying and fixing race conditions can be challenging as they can occur unexpectedly. It requires a thorough understanding of potential event flows and often involves using advanced debugging and testing tools. To address this issue, fast-check includes a set of built-in tools specifically designed to help in detecting race conditions. The [`scheduler`](/docs/core-blocks/arbitraries/others/#scheduler) arbitrary has been specifically designed for detecting and testing race conditions, making it an ideal tool for addressing these challenges in your testing process.

## The scheduler instance

The [`scheduler`](/docs/core-blocks/arbitraries/others/#scheduler) arbitrary is able to generate instances of [`Scheduler`](https://fast-check.dev/api-reference/interfaces/Scheduler.html). They come with following interface:

- `schedule: <T>(task: Promise<T>, label?: string, metadata?: TMetadata, act?: SchedulerAct) => Promise<T>` - Wrap an existing promise using the scheduler. The newly created promise will resolve when the scheduler decides to resolve it (see `waitFor`, `waitNext` and `waitIdle` methods).
- `scheduleFunction: <TArgs extends any[], T>(asyncFunction: (...args: TArgs) => Promise<T>, act?: SchedulerAct) => (...args: TArgs) => Promise<T>` - Wrap all the promise produced by an API using the scheduler. `scheduleFunction(callApi)`
- `scheduleSequence(sequenceBuilders: SchedulerSequenceItem<TMetadata>[], act?: SchedulerAct): { done: boolean; faulty: boolean, task: Promise<{ done: boolean; faulty: boolean }> }` - Schedule a sequence of operations. Each operation requires the previous one to be resolved before being started. Each of the operations will be executed until its end before starting any other scheduled operation.
- `waitNext: (count: number, customAct?: SchedulerAct)=> Promise<void>` - Wait and schedule exactly `count` scheduled tasks.
- `waitIdle: (customAct?: SchedulerAct) => Promise<void>` - Wait until the scheduler becomes idle. This includes currently scheduled tasks and any additional ones they recursively schedule. Cannot await tasks triggered by uncontrolled sources like `fetch` or external event emitters. Prefer `waitNext` or `waitFor` if you know what you are waiting for.
- `waitFor: <T>(unscheduledTask: Promise<T>, act?: SchedulerAct) => Promise<T>` - Wait as many scheduled tasks as need to resolve the received task. Contrary to `waitOne` or `waitAll` it can be used to wait for calls not yet scheduled when calling it (some test solutions like supertest use such trick not to run any query before the user really calls then on the request itself). Be aware that while this helper will wait eveything to be ready for `unscheduledTask` to resolve, having uncontrolled tasks triggering stuff required for `unscheduledTask` might make replay of failures harder as such asynchronous triggers stay out-of-control for fast-check.
- `report: () => SchedulerReportItem<TMetaData>[]` - Produce an array containing all the scheduled tasks so far with their execution status. If the task has been executed, it includes a string representation of the associated output or error produced by the task if any. Tasks will be returned in the order they get executed by the scheduler.

And deprecated primitives:

- `count(): number` - Number of pending tasks waiting to be scheduled by the scheduler — _deprecated since v4.2.0, no replacement_
- `waitOne: (act?: SchedulerAct) => Promise<void>` - Wait one scheduled task to be executed. Throws if there is no more pending tasks — _deprecated since v4.2.0, prefer `waitNext(1)`_
- `waitAll: (act?: SchedulerAct) => Promise<void>` - Wait all scheduled tasks, including the ones that might be created by one of the resolved task. Do not use if `waitAll` call has to be wrapped into an helper function such as `act` that can relaunch new tasks afterwards. In this specific case use a `while` loop running while `count() !== 0` and calling `waitOne` - _see CodeSandbox example on userProfile_ — _deprecated since v4.2.0, prefer `waitIdle`_

With:

```ts
type SchedulerSequenceItem<TMetadata> =
  | { builder: () => Promise<any>; label: string; metadata?: TMetadata }
  | (() => Promise<any>);
```

You can also define an hardcoded scheduler by using `fc.schedulerFor(ordering: number[])` - _should be passed through `fc.constant` if you want to use it as an arbitrary_. For instance: `fc.schedulerFor([1,3,2])` means that the first scheduled promise will resolve first, the third one second and at the end we will resolve the second one that have been scheduled.

## Scheduling methods

### schedule

Create a scheduled `Promise` based on an existing one — _aka. wrapped `Promise`_.
The life-cycle of the wrapped `Promise` will not be altered at all.
On its side the scheduled `Promise` will only resolve when the scheduler decides it.

Once scheduled by the scheduler, the scheduler will wait the wrapped `Promise` to resolve before sheduling anything else.

:::warning Catching exceptions is your responsability
Similar to any other `Promise`, if there is a possibility that the wrapped `Promise` may be rejected, you have to handle the output of the scheduled `Promise` on your end, just as you would with the original `Promise`.
:::

**Signature**

```ts
schedule: <T>(task: Promise<T>) => Promise<T>;
schedule: <T>(task: Promise<T>, label?: string, metadata?: TMetadata, customAct?: SchedulerAct) => Promise<T>;
```

**Usage**

Any algorithm taking raw `Promise` as input might be tested using this scheduler.

For instance, `Promise.all` and `Promise.race` are examples of such algorithms.

**Snippet**

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
await s.waitNext(1);
```

### scheduleFunction

Create a producer of scheduled `Promise`.

Many asynchronous codes utilize functions that can produce `Promise` based on inputs. For example, fetching from a REST API using `fetch("http://domain/")` or accessing data from a database `db.query("SELECT * FROM table")`.

`scheduleFunction` is able to re-order when these `Promise` resolveby waiting the go of the scheduler.

**Signature**

```ts
scheduleFunction: <TArgs extends any[], T>(asyncFunction: (...args: TArgs) => Promise<T>, customAct?: SchedulerAct) =>
  (...args: TArgs) =>
    Promise<T>;
```

**Usage**

Any algorithm making calls to asynchronous APIs can highly benefit from this wrapper to re-order calls.

:::warning Only postpone the resolution
`scheduleFunction` is only postponing the resolution of the function. The call to the function itself is started immediately when the caller calls something on the scheduled function.
:::

**Snippet**

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
// Not necessarily the first one that resolves,
// not necessarily the first one that got scheduled
await s.waitNext(1);
```

### scheduleSequence

Create a sequence of asynchrnous calls running in a precise order.

:::info While running, tasks prevent others to complete
One important fact about scheduled sequence is that whenever one task of the sequence gets scheduled, no other scheduled task in the scheduler can be unqueued while this task has not ended. It means that tasks defined within a scheduled sequence must not require other scheduled task to end to fulfill themselves — _it does not mean that they should not force the scheduling of other scheduled tasks_.
:::

**Signature**

```ts
type SchedulerSequenceItem =
    { builder: () => Promise<any>; label: string } |
    (() => Promise<any>)
;

scheduleSequence(sequenceBuilders: SchedulerSequenceItem[], customAct?: SchedulerAct): { done: boolean; faulty: boolean, task: Promise<{ done: boolean; faulty: boolean }> }
```

**Usage**

You want to check the status of a database, a webpage after many known operations.

:::tip Alternative
Most of the time, model based testing might be a better fit for that purpose.
:::

**Snippet**

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

await s.waitIdle();
// expect to see profile for user otherUserId2
```

## Advanced recipes

### Scheduling a function call

In some tests, we may want to experiment with scenarios where multiple queries are launched concurrently towards our service to observe its behavior in the context of concurrent operations.

```ts
const scheduleCall = <T>(s: Scheduler, f: () => Promise<T>) => {
  s.schedule(Promise.resolve('Start the call')).then(() => f());
};

// Calling doStuff will be part of the task scheduled in s
scheduleCall(s, () => doStuff());
```

### Scheduling a call to a mocked server

Unlike the behavior of `scheduleFunction`, actual calls to servers are not instantaneous, and you may want to schedule when the call reaches your mocked-server.

For instance, suppose you are creating a TODO-list application. In this app, users can only add a new TODO item if there is no other item with the same label. If you utilize the built-in `scheduleFunction` to test this feature, the mocked-server will always receive the calls in the same order as they were made.

```ts
const scheduleMockedServerFunction = <TArgs extends unknown[], TOut>(
  s: Scheduler,
  f: (...args: TArgs) => Promise<TOut>,
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
  f: (...args: TArgs) => Promise<TOut>,
) => {
  const scheduledF = s.scheduleFunction(f);
  return (...args: TArgs) => {
    return s.schedule(Promise.resolve('Server received the call')).then(() => scheduledF(...args));
  };
};
```

### Wrapping calls automatically using `act`

[`scheduler`](/docs/core-blocks/arbitraries/others/#scheduler) can be given an `act` function that will be called in order to wrap all the scheduled tasks. A code like the following one:

```js
fc.assert(
  fc.asyncProperty(fc.scheduler({ act }), async s => () {
    // Pushing tasks into the scheduler ...
    // ....................................
    await s.waitIdle();
  }))
```

This pattern can be helpful whenever you need to make sure that continuations attached to your tasks get called in proper contexts. For instance, when testing React applications, one cannot perform updates of states outside of `act`.

:::tip Finer act
The `act` function can be defined on case by case basis instead of being defined globally for all tasks. Check the `act` argument available on the methods of the scheduler.
:::

### Scheduling native timers

Occasionally, our asynchronous code depends on native timers provided by the JavaScript engine, such as `setTimeout` or `setInterval`. Unlike other asynchronous operations, timers are ordered, meaning that a timer set to wait for 10ms will be executed before a timer set to wait for 100ms. Consequently, they require special handling.

The code snippet below defines a custom `act` function able to schedule timers. It uses [Jest](https://jestjs.io/), but it can be modified for other testing frameworks if necessary.

```ts
// You should call: `jest.useFakeTimers()` at the beginning of your test

// The function below automatically schedules tasks for pending timers.
// It detects any timer added when tasks get resolved by the scheduler (via the act pattern).

// Instead of calling `await s.waitFor(p)`, you can call `await s.waitFor(p, buildWrapWithTimersAct(s))`.
// Instead of calling `await s.waitIdle()`, you can call `await s.waitIdle(buildWrapWithTimersAct(s))`.

function buildWrapWithTimersAct(s: fc.Scheduler) {
  let timersAlreadyScheduled = false;

  function scheduleTimersIfNeeded() {
    if (timersAlreadyScheduled || jest.getTimerCount() === 0) {
      return;
    }
    timersAlreadyScheduled = true;
    s.schedule(Promise.resolve('advance timers')).then(() => {
      timersAlreadyScheduled = false;
      jest.advanceTimersToNextTimer();
      scheduleTimersIfNeeded();
    });
  }

  return async function wrapWithTimersAct(f: () => Promise<unknown>) {
    try {
      await f();
    } finally {
      scheduleTimersIfNeeded();
    }
  };
}
```

## Model based testing and race conditions

Model-based testing features can be combined with race condition detection through the use of [`scheduledModelRun`](https://fast-check.dev/api-reference/functions/scheduledModelRun.html). By utilizing this function, the execution of the model will also be processed through the scheduler.

:::warning Do not depend on other scheduled tasks in the model
Neither `check` nor `run` should rely on the completion of other scheduled tasks to fulfill themselves. But they can still trigger new scheduled tasks as long as they don't wait for them to resolve.
:::
