---
title: What's new in fast-check 4.10.0?
authors: [dubzzz]
tags: [release, plugins]
---

Let's pave the way for the upcoming v5. fast-check 4.10.0 comes with the idea of easing the migration path to v5. As such, it should be seen as an intermediate version easing the move to v5. It introduces a reduced and simplified version of our plugin API and moves several existing built-in behaviors into plugins before we drop their previous entry points in v5. It also marks APIs planned for removal as deprecated when replacements are already available in v4.10.0, with notices explaining how to switch.

Continue reading to explore the detailed updates it brings.

{/* truncate */}

## Plugins

One of the core additions of v5 will be its plugin API. In v4.10.0, we already introduce a first, still evolving version of it. The plugin API will provide deeper capabilities to integrate advanced behaviors in fast-check, but you'll have to wait v5.

The API that we expose in v4.10.0 will probably change a bit for v5. Indeed, v4.10.0 still carries the complexity of synchronous versus asynchronous properties. This complexity, added to other blockers inherent to v4 and earlier versions, prevented us from shipping our ideal API in v4. That said, it is close to it.

As such, the `afterAll` and `onAllRunsComplete` hooks are likely to stay as they are in v5, possibly with additional primitives to make error formatting easier. But, we have not yet settled on the design of the other hooks for v5.

## The built-in plugins

The reason why we introduced our plugin API directly in v4 was that we wanted to take the opportunity to deprecate various parameters accessible directly when invoking `assert`.

In v4.10.0, we introduce seven built-in plugins to replace several of those parameters as well as the existing property hooks:

## Deprecation notices

Thanks to all the hard work above, we are happy (and sad at the same time) to announce the deprecation of several of our APIs. Our aim is, and has always been, to ease the use of the library by making it easier to understand and use. These deprecations fit well with that goal.

The deprecated APIs remain available in v4.10.0, so you can migrate progressively ahead of v5. Their deprecation notices point to replacements you can use today.

## Changelog since 4.9.0

The version 4.10.0 is based on version 4.9.0.

### Features

- ([PR#7216](https://github.com/dubzzz/fast-check/pull/7216)) Introduce a plugin API
- ([PR#7221](https://github.com/dubzzz/fast-check/pull/7221)) Refine plugin API
- ([PR#7222](https://github.com/dubzzz/fast-check/pull/7222)) Add ability to configure plugins globally
- ([PR#7224](https://github.com/dubzzz/fast-check/pull/7224)) Add the `beforeEach` plugin to hook in life-cycle
- ([PR#7227](https://github.com/dubzzz/fast-check/pull/7227)) Create an `afterEach` plugin
- ([PR#7232](https://github.com/dubzzz/fast-check/pull/7232)) Deprecate life-cycle methods
- ([PR#7235](https://github.com/dubzzz/fast-check/pull/7235)) Support teardown of `beforeEach` plugin
- ([PR#7228](https://github.com/dubzzz/fast-check/pull/7228)) Add `timeout` plugin to stop long running predicates
- ([PR#7237](https://github.com/dubzzz/fast-check/pull/7237)) Deprecate timeout from parameters
- ([PR#7238](https://github.com/dubzzz/fast-check/pull/7238)) Pass a store to plugins
- ([PR#7239](https://github.com/dubzzz/fast-check/pull/7239)) Add extra plugin's method called `onAllRunsComplete`
- ([PR#7240](https://github.com/dubzzz/fast-check/pull/7240)) Deprecate `reporter` and `asyncReporter` from parameters
- ([PR#7229](https://github.com/dubzzz/fast-check/pull/7229)) Add plugin to interrupt after time limit
- ([PR#7245](https://github.com/dubzzz/fast-check/pull/7245)) Support `failOnInterrupt` on the plugin
- ([PR#7230](https://github.com/dubzzz/fast-check/pull/7230)) Add plugins to drop runs on already covered cases
- ([PR#7259](https://github.com/dubzzz/fast-check/pull/7259)) Add ability to decorate `generate` via Plugins
- ([PR#7231](https://github.com/dubzzz/fast-check/pull/7231)) Add the `unbiased` plugin to generate without bias
- ([PR#7260](https://github.com/dubzzz/fast-check/pull/7260)) Deprecate parameters superseded by plugins
- ([PR#7261](https://github.com/dubzzz/fast-check/pull/7261)) Deprecate v5 removals

### Fixes

- ([PR#7225](https://github.com/dubzzz/fast-check/pull/7225)) Bug: Proper ordering between plugins
- ([PR#7127](https://github.com/dubzzz/fast-check/pull/7127)) CI: Announce on Bluesky when drafting the release
- ([PR#7217](https://github.com/dubzzz/fast-check/pull/7217)) CI: Dedupe packages for pnpm
- ([PR#7137](https://github.com/dubzzz/fast-check/pull/7137)) Doc: Release note for 4.9.0
- ([PR#7226](https://github.com/dubzzz/fast-check/pull/7226)) Doc: Fix admonition titles on the website
- ([PR#7246](https://github.com/dubzzz/fast-check/pull/7246)) Doc: Add jkomyno as code contributor
- ([PR#7251](https://github.com/dubzzz/fast-check/pull/7251)) Performance: Single timer for `interruptAfterTimeLimit`