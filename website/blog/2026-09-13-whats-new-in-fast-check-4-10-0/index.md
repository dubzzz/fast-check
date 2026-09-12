Let's pave the way for the upcoming v5. fast-check 4.10.0 comes with the idea of easing the migration path to v5. As such, it should be seen as an intermediate version easing the move to v5. It introduces a reduced and simplified version of our plugin API and moves several existing built-in behaviors into plugins before we drop their previous entry points in v5. It also marks APIs planned for removal as deprecated when replacements are already available in v4.10.0, with notices explaining how to switch.

Read on to explore what this release brings.

---

## Plugins

One of the core additions of v5 will be its plugin API. In v4.10.0, we already introduce a first, still evolving version of it. The plugin API will provide deeper capabilities to integrate advanced behaviors in fast-check, but you'll have to wait v5.

The API that we expose in v4.10.0 will probably change a bit for v5. Indeed, v4.10.0 still carries the complexity of synchronous versus asynchronous properties. This complexity, added to other blockers inherent to v4 and earlier versions, prevented us from shipping our ideal API in v4. That said, it is close to it.

As such, the `afterAll` and `onAllRunsComplete` hooks are likely to stay as they are in v5, possibly with additional primitives to make error formatting easier. But, we have not yet settled on the design of the other hooks for v5.

## The built-in plugins

The reason why we introduced our plugin API directly in v4 was that we wanted to take the opportunity to deprecate various parameters accessible directly when invoking `assert`.

In v4.10.0, we introduce seven built-in plugins to replace several of those parameters as well as the existing property hooks: