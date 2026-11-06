---
"fast-check": minor
---

Add a `beforeAll` plugin hook for synchronous or asynchronous setup once per assertion. Run all setup hooks in declaration order before decorating or assessing the property. Report setup failures through `onAllRunsComplete` with zero runs and the first setup error as `errorInstance`, while skipping teardown.
