---
sidebar_position: 1
slug: /migration-guide/from-3.x-to-4.x/
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# From 3.x to 4.x

Simple migration guide to fast-check v4 starting from fast-check v3

## Changes in minimal requirements

| Name                    | New requirement | Previous requirement |
| ----------------------- | --------------- | -------------------- |
| TypeScript _(optional)_ | ≥5.0            | ≥4.1                 |

Related pull requests: [#5577](https://github.com/dubzzz/fast-check/pull/5577)

## Update to latest v3.x

Version 4 of fast-check introduces significant changes as part of its major release, including breaking changes. However, many of these changes can be addressed while still using the latest minor release of version 3.

To ensure a smoother migration to version 4, we recommend first upgrading to the latest minor release of version 3. Then, review and address the following deprecation notices to align your codebase with supported patterns.

### Changes on `record`

In earlier versions, the `record` arbitrary included a flag named `withDeletedKeys`. Starting with version 2.11.0, this flag was deprecated and replaced by a new flag called `requiredKeys`. In version 4.0.0, the deprecated `withDeletedKeys` flag has been removed entirely.

To migrate, update your usage of the `record` arbitrary as follows:

<Tabs>
  <TabItem value="before" label="Before">

```ts
fc.record(definition, { withDeletedKeys: true });
fc.record(definition, { withDeletedKeys: false });
```

  </TabItem>
  <TabItem value="after" label="After" default>

```ts
fc.record(definition, { requiredKeys: [] }); // previously: "withDeletedKeys: true"
fc.record(definition, {}); // equivalent to "requiredKeys: undefined", previously: "withDeletedKeys: false"
```

  </TabItem>
</Tabs>

Related pull requests: [#5578](https://github.com/dubzzz/fast-check/pull/5578)
