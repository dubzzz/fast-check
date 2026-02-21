# Spec File Structure

> **⚠️ Scope:** How to organize code inside a test file?

**✅ Do** put `it` within `describe`, when using `it`

**👍 Prefer** `it` over `test`

**✅ Do** name the `describe` with the name of the function being tested

**✅ Do** use a dedicated `describe` for each function being tested

**✅ Do** start naming `it` with "should" and consider that the name should be clear, as consise as possible and could be read as a sentence implicitly prefixed by "it"

**✅ Do** start with simple and documenting tests

**✅ Do** continue with advanced tests looking for edge-cases

**❌ Don't** delimitate explicitely simple from advanced tests, just but them in the right order withou any comment showing where each section starts

**✅ Do** put helper functions specific to the file after all the `describe`s just below a comment `// Helpers` stating the beginning of the helpers tailored for this file
