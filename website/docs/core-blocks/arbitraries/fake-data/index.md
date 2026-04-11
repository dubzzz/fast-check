---
sidebar_position: 0
slug: /core-blocks/arbitraries/fake-data/
description: Ready-made generators for realistic-shape values — UUIDs, emails, URLs, IPs, filenames — when your code branches on the shape of its inputs.
---

# Fake Data

The fake-data arbitraries produce values that *look* like production data: UUIDs, email addresses, IPv4/IPv6, URLs, filenames, MIME types. Each one is a convenience wrapper built on top of primitives and composites, pre-configured so that generated values satisfy a recognisable format.

Reach for them when **your code branches on the shape** of its input — a regex that expects a valid email, a parser that only accepts well-formed URLs, a router that inspects filename extensions. Feeding such code a plain `fc.string()` would spend almost every run in the error path and tell you nothing about the happy path you actually care about.

:::warning Do not over-use fake data
Fake-data arbitraries have narrower shrink spaces than primitives: a shrunk counterexample for `fc.emailAddress()` is still a valid email, not an empty string. When your code does **not** care about the format, plain primitives give better coverage *and* tighter counterexamples. Use fake data to unblock a specific branch, not as a default.
:::

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```
