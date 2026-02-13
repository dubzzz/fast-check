---
title: What's new in fast-check 3.11.0?
authors: [dubzzz]
tags: [release, ulid, identifiers]
---

This release comes with a new arbitrary called `ulid`. This arbitrary is responsible to generate ULID strings

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## ULID

The arbitrary `ulid` has been introduced to ease the creation of ULID ids.

```js
fc.ulid();
// Examples of generated values:
// • "7AVDFZJAXCM0F25E3SZZZZZZYZ"
// • "7ZZZZZZZYP5XN60H51ZZZZZZZP"
// • "2VXXEMQ2HWRSNWMP9PZZZZZZZA"
// • "15RQ23H1M8YB80EVPD2EG8W7K1"
// • "6QV4RKC7C8ZZZZZZZFSF7PWQF5"
// • …
```

## Other changes

We have recently enhanced our README by adding additional badges that emphasize the overall security and quality of open-source projects:

<a href="https://securityscorecards.dev/viewer/?platform=github.com&org=dubzzz&repo=fast-check"><img src="https://api.securityscorecards.dev/projects/github.com/dubzzz/fast-check/badge" alt="OpenSSF Scorecard" /></a><a href="https://bestpractices.coreinfrastructure.org/projects/7450"><img src="https://bestpractices.coreinfrastructure.org/projects/7450/badge" alt="OpenSSF Best Practices" /></a>

Following these changes, we did significant improvements and successfully reduced the number of red flags reported by them.

## Changelog since 3.10.0

The version 3.11.0 is based on version 3.10.0.

### Features

- ([PR#4020](https://github.com/dubzzz/fast-check/pull/4020)) Implement arbitrary for ulid

### Fixes

- ([PR#3956](https://github.com/dubzzz/fast-check/pull/3956)) CI: Define code owners
- ([PR#3961](https://github.com/dubzzz/fast-check/pull/3961)) CI: Fix configuration of CodeQL
- ([PR#3973](https://github.com/dubzzz/fast-check/pull/3973)) CI: Make changelog workflow able to push
- ([PR#3975](https://github.com/dubzzz/fast-check/pull/3975)) CI: Add scorecard security workflow
- ([PR#3991](https://github.com/dubzzz/fast-check/pull/3991)) CI: Properly reference tags in GH Actions
- ([PR#3993](https://github.com/dubzzz/fast-check/pull/3993)) CI: Configure renovate for security bumps
- ([PR#3994](https://github.com/dubzzz/fast-check/pull/3994)) CI: Stop ignoring examples in renovate
- ([PR#3995](https://github.com/dubzzz/fast-check/pull/3995)) CI: Enable some more Scorecard's checks
- ([PR#4007](https://github.com/dubzzz/fast-check/pull/4007)) CI: Fix CI tests for types against next
- ([PR#4008](https://github.com/dubzzz/fast-check/pull/4008)) CI: Show vulnerabilities in renovate
- ([PR#3976](https://github.com/dubzzz/fast-check/pull/3976)) Doc: Add some OpenSSF badges
- ([PR#4034](https://github.com/dubzzz/fast-check/pull/4034)) Doc: Add new contributor vecerek
- ([PR#4010](https://github.com/dubzzz/fast-check/pull/4010)) Security: Move dockerfile content to devcontainer
- ([PR#4000](https://github.com/dubzzz/fast-check/pull/4000)) Security: Drop raw install of npm
- ([PR#3987](https://github.com/dubzzz/fast-check/pull/3987)) Security: Pin npm version for publish
- ([PR#3985](https://github.com/dubzzz/fast-check/pull/3985)) Security: Pin image in Dockerfile of devcontainer
- ([PR#3983](https://github.com/dubzzz/fast-check/pull/3983)) Security: Safer workflows' permissions
- ([PR#3957](https://github.com/dubzzz/fast-check/pull/3957)) Security: Lock GH-Actions dependencies
