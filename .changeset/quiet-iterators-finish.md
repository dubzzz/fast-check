---
"fast-check": minor
---

✨ Hide unobserved iterator lengths when stringifying. Display `/*…*/` until the iterator is known to be exhausted. With `noHistory`, display `/*n emitted…*/` while completion is unknown and `/*n emitted*/` once the iterator is exhausted, without exposing the total length.
