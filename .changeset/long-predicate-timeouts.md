---
"fast-check": patch
---

🐛 Honor the full delay passed to `fc.timeout` when it exceeds 2,147,483,647 milliseconds. Passing `Infinity` disables the timeout.
