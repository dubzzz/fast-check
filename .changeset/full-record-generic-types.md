---
"fast-check": major
---

♻️ Preserve generic record result types when all keys are required, removing unsafe casts in `entityGraph`.

Models constructed dynamically with only an index signature may now need an explicit model shape to retain required named keys in the inferred result.
