---
"fast-check": major
---

Remove the `check` runner. Use `await fc.assert(property, parameters)` to run a property.
To inspect run details, capture them in a plugin's `onAllRunsComplete` callback.
Set `noDefaultPlugins: true` to disable default failure reporting when handling the results yourself.
