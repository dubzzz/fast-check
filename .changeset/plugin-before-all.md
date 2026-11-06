---
"fast-check": minor
---

Add a `beforeAll` plugin hook for synchronous or asynchronous setup once per assertion. Run setup in declaration order before decorating or assessing the property, and reject with the setup error without running completion or teardown hooks if setup fails.
