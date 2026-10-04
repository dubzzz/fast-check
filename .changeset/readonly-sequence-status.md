---
"fast-check": patch
---

♻️ Expose `scheduleSequence` status through read-only getters

The returned `done` and `faulty` flags remain live views of sequence progress, but can no longer be assigned. Read these flags to monitor progress instead of modifying them. Freezing the returned handle no longer prevents the scheduler from updating its internal status.
