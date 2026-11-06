---
"fast-check": minor
---

✨ Add an optional `'pre' | 'post'` position to `installGlobalPlugin`. The default remains `'pre'`; `'post'` installs plugins after those passed to the runner and before default plugins, preserving custom error reporting precedence. `noGlobalPlugins` disables both positions.
