---
title: What's new in fast-check 3.16.0?
authors: [dubzzz]
tags: [what's new, seo]
---

This release makes `fc.pre` safer in terms of typings. It leverages the "[assertion function](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions)" capability offered by TypeScript. This version has also been focused on preparing the monorepo to move to ECMAScript modules to build itself and on making our documentation better.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## Assertion function

Since 3.16.0, `fc.pre` plays fully its role of [assertion function](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions) both on JavaScript and TypeScript side. As such, it helps you to refine your types as you walk through the test. No more need to add extra type assertions after it (thinking of `as` or `!`).

```ts
// entries: {value: T}
const match = entries.find((e) => e.value === needle);
fc.pre(match !== undefined);
// ✅ Now (≥3.16.0): match: {value: T}
// ❌ Previous (<3.16.0): match: {value: T} | undefined
```

## Towards ECMAScript modules

ECMAScript modules is the official successor of CommonJS for Node.js, Require/AMD/UMD/… for the Web. Its aim is to provide a uniform way to import JavaScript files whatever the targeted runtime.

When fast-check started, ECMAScript modules were barely supported by Node.js. Over time, they progressively appeared in Node.js with a first unflagged version being 12.17.0. At that time, the ecosystem of packages was still far from ready and compatible to offer fast-check a way to move to it so we sticked to CommonJS.

Today, the ecosystem is increasingly embracing ECMAScript modules. As such we started to move one after the other our packages by adding `"type": "module"` to our `package.json`. At the moment, we migrated all our projects except two: `/packages/fast-check` (work in progress) and `/website` (blocked: not supported yet by Docusaurus). The target is to have them migrated for the next major of fast-check. The change should have no visible impact on our users as we still plan to publish both versions: ECMAScript modules and CommonJS.

## Towards more efficient documentation

Our documentation serves as a vital resource for our users. As such we want it to be as performant as possible.

In the early days of February we started to assess its performance on [PageSpeed](https://pagespeed.web.dev/) (an online version of Lighthouse). We extracted some low hanging fruits that we tackled immediately to make the grade better without any change of our infrastructure. But we quickly noticed some improvements would require a change of our hosting provider. So we moved to Netlify as it provides a better control over the headers of the files served by the service including cache-control and content-security-policy.

We are now close to 100/100 on Mobile:

![Results of PageSpeed against the homepage of fast-check.dev on the 4th of March, 2024](@site/static/img/blog/2024-03-04-whats-new-in-fast-check-3-16-0--pagespeed.png)

The most important changes have been:

- Avoiding layout shifts when images appear by defining the size in advance in the DOM — _Images can be the cause of unwanted layout shifts. By providing an explicit `height` and `width` to them (directly in the DOM) we dropped most of these shifts_
- Better cache control by switching towards another hosting solution — _Static assets must be cached! With GitHub Pages they used to be cached for only a few minutes making the cache useless_
- Dropping Google Analytics — _We measured that it was responsible for 50% of the JavaScript bundle and 50% of the blocking time of the main thread_
- Serving images with the right ratio — _If the image has a format 16/9, we don't display it in 16/10 but use it's ratio_
- Serving images with the right size, not larger - _If the image is used for an avatar displayed at 64x64, then we serve an image having the exact size and ratio (neither larger nor smaller)_
- Serving optimized SVG — _SVG files can be optimized to remove unnecessary details that do not impact appearance_

## Changelog since 3.15.0

The version 3.16.0 is based on version 3.15.1, but let see what's changed since 3.15.0 itself.

### Features

- ([PR#4709](https://github.com/dubzzz/fast-check/pull/4709)) Make `fc.pre` an assertion function

### Fixes

- ([PR#4736](https://github.com/dubzzz/fast-check/pull/4736)) Bug: Wrong logo ratio on small screen
- ([PR#4591](https://github.com/dubzzz/fast-check/pull/4591)) CI: Move build chain to ESM for root of monorepo
- ([PR#4598](https://github.com/dubzzz/fast-check/pull/4598)) CI: Add `onBrokenAnchors`'check on Docusaurus
- ([PR#4606](https://github.com/dubzzz/fast-check/pull/4606)) CI: Configuration files for VSCode
- ([PR#4650](https://github.com/dubzzz/fast-check/pull/4650)) CI: Move examples build chain to ESM
- ([PR#4747](https://github.com/dubzzz/fast-check/pull/4747)) CI: Deploy website on Netlify
- ([PR#4751](https://github.com/dubzzz/fast-check/pull/4751)) CI: Drop configuration of GitHub Pages
- ([PR#4756](https://github.com/dubzzz/fast-check/pull/4756)) CI: Make CI fail on invalid deploy
- ([PR#4776](https://github.com/dubzzz/fast-check/pull/4776)) CI: Drop Google Analytics
- ([PR#4769](https://github.com/dubzzz/fast-check/pull/4769)) Clean: Drop legacy patch on React 17
- ([PR#4554](https://github.com/dubzzz/fast-check/pull/4554)) Doc: Add `idonttrustlikethat-fast-check` in ecosystem.md
- ([PR#4563](https://github.com/dubzzz/fast-check/pull/4563)) Doc: Add new contributor nielk
- ([PR#4669](https://github.com/dubzzz/fast-check/pull/4669)) Doc: Add `@effect/schema` in ecosystem
- ([PR#4677](https://github.com/dubzzz/fast-check/pull/4677)) Doc: Add `jsonwebtoken` to track record
- ([PR#4712](https://github.com/dubzzz/fast-check/pull/4712)) Doc: Fix console errors of website
- ([PR#4713](https://github.com/dubzzz/fast-check/pull/4713)) Doc: Add extra spacing on top of CTA
- ([PR#4730](https://github.com/dubzzz/fast-check/pull/4730)) Doc: Optimize image assets on homepage
- ([PR#4732](https://github.com/dubzzz/fast-check/pull/4732)) Doc: Optimize SVG assets
- ([PR#4735](https://github.com/dubzzz/fast-check/pull/4735)) Doc: Less layout shift with proper sizes
- ([PR#4750](https://github.com/dubzzz/fast-check/pull/4750)) Doc: Add link to Netlify
- ([PR#4754](https://github.com/dubzzz/fast-check/pull/4754)) Doc: Better assets on the homepage of the website
- ([PR#4768](https://github.com/dubzzz/fast-check/pull/4768)) Doc: Add new contributors ej-shafran and gruhn
- ([PR#4771](https://github.com/dubzzz/fast-check/pull/4771)) Doc: Blog post for 3.15.0
- ([PR#4753](https://github.com/dubzzz/fast-check/pull/4753)) Security: Configure CSP for fast-check.dev
- ([PR#4761](https://github.com/dubzzz/fast-check/pull/4761)) Security: Enforce Content-Security-Policy on our website
- ([PR#4772](https://github.com/dubzzz/fast-check/pull/4772)) Security: Relax CSP policy to support Algolia
- ([PR#4665](https://github.com/dubzzz/fast-check/pull/4665)) Test: Fix `isCorrect` check on double
- ([PR#4666](https://github.com/dubzzz/fast-check/pull/4666)) Test: Stabilize flaky URL-related test
