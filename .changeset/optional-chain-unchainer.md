---
"fast-check": minor
---

✨ Add an optional `unchainer` callback to `Arbitrary.chain` to shrink user-provided examples.

The callback recovers a source value, which is checked against the source arbitrary. Compatible examples shrink within the reconstructed chained arbitrary while keeping that source fixed. Generation and shrinking of generated values are unchanged.
