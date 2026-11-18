---
"fast-check": major
---

💥 Require Node.js 22.12.0, ES2025 runtime APIs, and TypeScript 5.8 for fast-check 5.

The ESM package can be loaded through either `import` or `require` on the minimum Node.js version. Other runtimes need native iterator helpers and the documented timer, performance, and abort APIs. TypeScript 5.8 and 5.9 consumers can enable iterator typings with `ESNext.Iterator`; CommonJS consumers should use `NodeNext` module resolution.
