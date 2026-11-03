---
"fast-check": major
---

Remove the `check` runner. Use `await fc.assert(property, parameters)` to run a property.
Handle run details directly in a plugin's `onAllRunsComplete` callback: throw to report a failure, or return nothing when the outcome is acceptable.
Set `noDefaultPlugins: true` to replace default failure reporting with your own reporting.
