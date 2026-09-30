---
"fast-check": major
---

💥 Drop `timeout` from `Parameters`

Replace `{ timeout: timeMs }` with `{ plugins: [fc.timeout(timeMs)] }` when calling `fc.assert` or `fc.check`. For a shared timeout, replace `fc.configureGlobal({ timeout: timeMs })` with `fc.installGlobalPlugin(fc.timeout(timeMs))`.

Global and local timeout plugins both apply; local plugins do not override installed global plugins. To keep setup and teardown outside the timeout, migrate property hooks to `fc.beforeEach` and `fc.afterEach` plugins placed before `fc.timeout(timeMs)`.
