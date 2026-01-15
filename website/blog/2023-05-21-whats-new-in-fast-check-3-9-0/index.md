---
title: What's new in fast-check 3.9.0?
authors: [dubzzz]
tags: [release, scheduler, race-conditions, async-testing]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

In this release, our primary focus has been to enhance the race condition detection mechanisms, making them stronger and more effective. Additionally, we did significant updates of the documentation, ensuring it provides comprehensive and up-to-date information.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## Local act

Starting from version 2.2.0, our arbitrary `fc.scheduler` has supported the ability to pass custom `act` functions. However, until now, it was not possible to set them at a more specific level. In version 3.9.0, we have introduced the capability to pass `act` functions at a granular level:

- either during the definition of scheduled tasks,
- or when releasing them.

### Genesis of act

Initially, the primary purpose of the `act` option was to be able to test React components against race conditions. Indeed, when writing tests for React components or hooks, you may have encountered the following warning log:

```txt
Warning: An update to TestComponent inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act
```

This warning occurs whenever attempting to perform state updates outside of the appropriate context. They can easily be triggered when manually manipulating the timing of `Promise` resolution or rejection. In the example below, we demonstrate a scenario where we need to use `act` statements to guard the execution of calls that involve resolving promises (which may be tied to state updates).

<Tabs>
  <TabItem value="test" label="Test" default>

```js
test('should update to the value of the last promise', async () => {
  let resolve1 = null;
  let resolve2 = null;
  const promise1 = new Promise((r) => (resolve1 = r));
  const promise2 = new Promise((r) => (resolve2 = r));

  const { result, rerender } = renderHook((p) => usePromiseAsState(p), {
    initialProps: promise1,
  });
  rerender(promise2);
  expect(result.current).toBe(undefined);

  await act(async () => {
    resolve1(1);
  });
  expect(result.current).toBe(undefined);

  await act(async () => {
    resolve2(2);
  });
  expect(result.current).toBe(2);
});
```

  </TabItem>
  <TabItem value="code" label="Code">

```js
// Take a promise and translate it into a state
function usePromiseAsState(promise) {
  const [value, setValue] = useState(undefined);

  useEffect(() => {
    let canceled = false;
    setValue(undefined);
    promise.then(
      (value) => !canceled && setValue(value),
      () => {},
    );
    return () => (canceled = true);
  }, [promise]);

  return value;
}
```

  </TabItem>
</Tabs>

In the snippet above, if we don't wrap the statement `resolve2(2)` within an `act`, we would have encountered the warning as `resolve2(2)` emulates the resolution of `promise2` and thus immediately triggers a state update.

As fast-check supports race condition detection even for React code, it has to provide some simple ways for users to set how to wrap resolutions. This is the reason why we support `act`.

### The new act

Following snippet is an updated version of the code above with race condition detection backed by fast-check:

```js
test('should update to the value of the last promise', async () => {
  await fc.assert(
    fc.asyncProperty(fc.scheduler(), async (s) => {
      const promise1 = s.schedule(Promise.resolve(1), undefined, undefined, act);
      const promise2 = s.schedule(Promise.resolve(2), undefined, undefined, act);

      const { result, rerender } = renderHook((p) => usePromiseAsState(p), {
        initialProps: promise1,
      });
      rerender(promise2);
      expect(result.current).toBe(undefined);

      await s.waitAll();
      expect(result.current).toBe(2);
    }),
  );
});
```

This snippet specifies how to wrap each `Promise` when defining it. It lets the author of the test the ability to define for each scheduled task how to wrap it.

:::tip Alternative with act at wait level
Instead of specifying for each scheduled task how to wrap it, we can wrap them all the same way by passing the `act` function at wait time. In order to do that, we mostly have to replace:

- `s.schedule(..., undefined, undefined, act)` by `s.schedule(...)`,
- and `s.waitAll()` by `s.waitAll(act)`.

:::

:::warning Alternative with act at scheduler level
While it was the only approach available in the past, we now recommend users to adopt the usage of `act` at either the wait level or the scheduling level. Defining `act` on `fc.scheduler` is not optimal when it comes to custom manual examples, as it would require passing the custom `act` to the manually created instances of `fc.schedulerFor` as well (supported but easy to forget).
:::

:::tip Not restricted to React
The `act` pattern is not restricted to React. While it was initially designed for React, it can be highly beneficial whenever you need to encapsulate calls and introduce a specific context around them. For example, we used it to manipulate timers in the new documentation, as demonstrated in [the section on scheduling native timers](/docs/advanced/race-conditions/#scheduling-native-timers).
:::

## Bug fixes

### Cap timeouts

Prior to this release, timeouts greater than `0x7fffffff` were downgraded to `0`. This behavior was a result of `setTimeout` and related functions automatically converting received values to acceptable ones, which could potentially cause unexpected outcomes.

More on [PR#3892](https://github.com/dubzzz/fast-check/pull/3892).

### Infinite loop in scheduled models

When relying on `scheduledModelRun`, some users may have encountered situations where the model runs indefinitely. The original code was waiting for the model to execute, but occasionally it failed to release the necessary tasks to reach its completion. As a result, the model remained in an endless waiting state, unable to terminate.

More on [PR#3887](https://github.com/dubzzz/fast-check/pull/3887).

## Changelog since 3.8.0

The version 3.9.0 is based on version 3.8.3, but let see what's changed since 3.8.0 itself.

### Features

- ([PR#3889](https://github.com/dubzzz/fast-check/pull/3889)) Add ability to customize `act` per call
- ([PR#3890](https://github.com/dubzzz/fast-check/pull/3890)) Add ability to customize `act` per wait

### Fixes

- ([PR#3892](https://github.com/dubzzz/fast-check/pull/3892)) Bug: Cap timeout values to 0x7fff_ffff
- ([PR#3887](https://github.com/dubzzz/fast-check/pull/3887)) Bug: Always schedule models until the end
- ([PR#3723](https://github.com/dubzzz/fast-check/pull/3723)) CI: Switch to docusaurus for the documentation
- ([PR#3729](https://github.com/dubzzz/fast-check/pull/3729)) CI: Pre-setup devcontainer with GH Actions
- ([PR#3728](https://github.com/dubzzz/fast-check/pull/3728)) CI: Change gh-pages deploy process
- ([PR#3732](https://github.com/dubzzz/fast-check/pull/3732)) CI: Move back to github-pages-deploy-action
- ([PR#3735](https://github.com/dubzzz/fast-check/pull/3735)) CI: Add gtag for analytics
- ([PR#3744](https://github.com/dubzzz/fast-check/pull/3744)) CI: Drop website build on `build:all`
- ([PR#3751](https://github.com/dubzzz/fast-check/pull/3751)) CI: Update `baseUrl` on the ain documentation
- ([PR#3754](https://github.com/dubzzz/fast-check/pull/3754)) CI: Drop version from website
- ([PR#3754](https://github.com/dubzzz/fast-check/pull/3754)) CI: Drop version from website
- ([PR#3759](https://github.com/dubzzz/fast-check/pull/3759)) CI: Drop the need for a branch on doc
- ([PR#3775](https://github.com/dubzzz/fast-check/pull/3775)) CI: Publish all packages in one workflow
- ([PR#3780](https://github.com/dubzzz/fast-check/pull/3780)) CI: Do not relaunch build on new tag
- ([PR#3792](https://github.com/dubzzz/fast-check/pull/3792)) CI: Remove parse5 when checking types
- ([PR#3804](https://github.com/dubzzz/fast-check/pull/3804)) CI: Build documentation with LFS enabled
- ([PR#3880](https://github.com/dubzzz/fast-check/pull/3880)) CI: Stabilize tests on `jsonValue`
- ([PR#3876](https://github.com/dubzzz/fast-check/pull/3876)) Clean: Drop legacy documentation
- ([PR#3724](https://github.com/dubzzz/fast-check/pull/3724)) Doc: Add fuzz keywords
- ([PR#3734](https://github.com/dubzzz/fast-check/pull/3734)) Doc: Add search capability to the doc
- ([PR#3738](https://github.com/dubzzz/fast-check/pull/3738)) Doc: Fix broken links to api-reference
- ([PR#3745](https://github.com/dubzzz/fast-check/pull/3745)) Doc: Document core building blocks in new documentation
- ([PR#3750](https://github.com/dubzzz/fast-check/pull/3750)) Doc: More details into tips/larger-entries...
- ([PR#3753](https://github.com/dubzzz/fast-check/pull/3753)) Doc: Add some more configuration tips in the documentation
- ([PR#3755](https://github.com/dubzzz/fast-check/pull/3755)) Doc: Update all links to target fast-check.dev
- ([PR#3757](https://github.com/dubzzz/fast-check/pull/3757)) Doc: Quick a11y pass on the documentation
- ([PR#3758](https://github.com/dubzzz/fast-check/pull/3758)) Doc: Move missing configuration parts to new doc
- ([PR#3760](https://github.com/dubzzz/fast-check/pull/3760)) Doc: Link directly to the target page not to 30x ones
- ([PR#3761](https://github.com/dubzzz/fast-check/pull/3761)) Doc: Fix broken links in new doc
- ([PR#3800](https://github.com/dubzzz/fast-check/pull/3800)) Doc: Add "advanced" part of the documentation
- ([PR#3803](https://github.com/dubzzz/fast-check/pull/3803)) Doc: Update our-first-property-based-test.md: typo, punctuation
- ([PR#3828](https://github.com/dubzzz/fast-check/pull/3828)) Doc: Fix typos in docs
- ([PR#3820](https://github.com/dubzzz/fast-check/pull/3820)) Doc: First iteration on race conditions tutorial
- ([PR#3834](https://github.com/dubzzz/fast-check/pull/3834)) Doc: Rework intro of race condition tutorial
- ([PR#3836](https://github.com/dubzzz/fast-check/pull/3836)) Doc: Merge category and intro for race condition
- ([PR#3837](https://github.com/dubzzz/fast-check/pull/3837)) Doc: Replace categories by real pages
- ([PR#3838](https://github.com/dubzzz/fast-check/pull/3838)) Doc: Add video explaining race condition in UI
- ([PR#3842](https://github.com/dubzzz/fast-check/pull/3842)) Doc: Note about solving race conditions
- ([PR#3843](https://github.com/dubzzz/fast-check/pull/3843)) Doc: Better colors for dark theme
- ([PR#3850](https://github.com/dubzzz/fast-check/pull/3850)) Doc: Points to projects in our ecosystem
- ([PR#3852](https://github.com/dubzzz/fast-check/pull/3852)) Doc: List some bugs found thanks to fast-check
- ([PR#3860](https://github.com/dubzzz/fast-check/pull/3860)) Doc: Use GitHub logo instead of label
- ([PR#3858](https://github.com/dubzzz/fast-check/pull/3858)) Doc: Rework homepage page of fast-check.dev
- ([PR#3863](https://github.com/dubzzz/fast-check/pull/3863)) Doc: Rework display of the homepage for small screens
- ([PR#3864](https://github.com/dubzzz/fast-check/pull/3864)) Doc: Properly display the quick nav buttons
- ([PR#3871](https://github.com/dubzzz/fast-check/pull/3871)) Doc: Update all links to new documentation
- ([PR#3867](https://github.com/dubzzz/fast-check/pull/3867)) Doc: Create proper images in website/
- ([PR#3872](https://github.com/dubzzz/fast-check/pull/3872)) Doc: Reference image from LFS in README
- ([PR#3875](https://github.com/dubzzz/fast-check/pull/3875)) Doc: First blog post on docusaurus switch
- ([PR#3774](https://github.com/dubzzz/fast-check/pull/3774)) Security: Attach provenance to the packages
- ([PR#3719](https://github.com/dubzzz/fast-check/pull/3719)) Script: Ensure proper package definition
- ([PR#3835](https://github.com/dubzzz/fast-check/pull/3835)) Test: Add tests for snippets in the website
