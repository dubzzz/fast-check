---
"fast-check": minor
---

✨ Add timeout enforcement for blocking synchronous work

`fc.timeout` now checks elapsed time for synchronous predicates and synchronous portions of asynchronous predicates, including work after an `await`.

Synchronous predicates were previously documented as unaffected by this plugin. They now fail when they reach the configured time limit, so existing checks using `fc.timeout` may start reporting failures. Synchronous code still runs to completion before its timeout is reported.
