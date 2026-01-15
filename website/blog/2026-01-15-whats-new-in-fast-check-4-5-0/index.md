---
title: What's new in fast-check 4.5.0?
authors: [dubzzz]
tags: [release, entityGraph, graphs, data-modeling]
---

Relational structures are among the hardest kinds of data to generate. Not only do entities need to be well-defined, but their links must also point to existing entities while satisfying a set of constraints. This release introduces a built-in helper that lets you describe your schema to generate properly linked relational data from it.

With this release, we aim to go beyond simple unit-level data and offer primitives to build significantly more complex inputs. This should make it easier to extend your usage of property-based testing further. Why not trying it against higher-level algorithms?

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## Why support relational structures?

Many higher-level algorithms operate on data with cross-links. For instance, if your algorithm works with an organizational chart of employees, you probably want each employee to have a single manager and do not want a manager to be managed by one of their subordinates even transitively.

Without `entityGraph`, building such structure would have required a fair amount of code. That code was often tricky to get right and mistakes could easily slip in. As a result, the test code itself sometimes became something that needed to be tested.

With `entityGraph`, relational schemas become first-class citizens. We believe this helper will prove useful for many advanced use cases and will help extend the property-based testing paradigm to a broader class of problems.

## Modeling relational data

### Unconstrained graph

A graph is nothing more than a relational structure with nodes being connected to one another. With `entityGraph`, we can easily generate graphs. For example, we will show how to use it to produce values of the shape `{ node: Node[] }`, with `Node` defined as:

```ts
type Node = {
  id: string; // each node has its own id, no duplicated ids
  linkTo: Node[];
};
```

Let’s start with a very permissive definition. We will allow nodes to be totally unrelated, to form cycles or even to reference themselves. A possible generated graph could look like this:

```mermaid
stateDiagram-v2
    n0 --> n1
    n1 --> n1
    n0 --> n2
    n1 --> n0
    n2 --> n3
    n5 --> n1
    n6 --> n7
    n4
```

To build such graphs, you can write:

```ts
fc.entityGraph(
  { node: { id: fc.uuid() } },
  { node: { linkTo: { arity: 'many', type: 'node' } } },
  { unicityConstraints: { node: (value) => value.id } },
);
```

This definition puts almost no restrictions on the generated structure, making it a good starting point for experimentation.

### Connected graph

While being able to generate an arbitrary graph is useful, most real-world use cases require additional guarantees to make the data suitable for testing.

For example, you might require all nodes to be reacheable from a single entry point. Here is an example of such a graph:

```mermaid
stateDiagram-v2
    n0 --> n1
    n1 --> n1
    n0 --> n2
    n1 --> n0
    n2 --> n3
    n3 --> n4
    n4 --> n2
    n2 --> n5
```

To request this kind of structure, you need to tweak our previous declaration as follows:

```ts
fc.entityGraph(
  { node: { id: fc.uuid() } },
  { node: { linkTo: { arity: 'many', type: 'node' } } },
  {
    initialPoolConstraints: { node: { maxLength: 1 } }, // <-- line added
    unicityConstraints: { node: (value) => value.id },
  },
);
```

With this configuration, all nodes are guaranteed to be reachable from the first node in the generated array.

### Directed acyclic graph

In some cases, connectivity alone is not sufficient. You may want to enforce even stronger structural constraints.

For instance, you may want to generate a directed acyclic graph — DAG. Such a structure forbids cycles and can encode additional assumptions in your tests. Here is an example of a DAG:

```mermaid
stateDiagram-v2
    n0 --> n1
    n0 --> n2
    n2 --> n3
    n3 --> n4
    n2 --> n5
    n1 --> n3
```

A DAG can be expressed as follows:

```ts
fc.entityGraph(
  { node: { id: fc.uuid() } },
  { node: { linkTo: { arity: 'many', type: 'node' } } },
  {
    initialPoolConstraints: { node: { maxLength: 1, strategy: 'successor' } }, // <-- line changed
    unicityConstraints: { node: (value) => value.id },
  },
);
```

By selecting the successor strategy, we ensure that links only point forward to prevent cycles.

### Graph with backlinks

So far, we have only modeled outgoing relationships. However, in some scenarios it is just as important to reason about incoming ones.

To support this use case, `entityGraph` lets you define inverse relations so that backlinks are automatically populated in the generated structure.

In this scenario, we expect nodes of the following shape:

```ts
type Node = {
  id: string; // each node has its own id, no duplicated ids
  linkTo: Node[];
  linkFrom: Node[];
};
```

This can be achieved with a small change:

```ts
fc.entityGraph(
  { node: { id: fc.uuid() } },
  {
    node: {
      linkTo: { arity: 'many', type: 'node' },
      linkFrom: { arity: 'inverse', type: 'node', forwardRelationship: 'linkTo' }, // line added
    },
  },
  { unicityConstraints: { node: (value) => value.id } },
);
```

With this configuration, whenever a node appears in the `linkTo` list of one node, it will automatically be listed in the corresponding `linkFrom` array.

### Organigram

A company organigram can be seen as a particular kind of graph. In our organigram, we want each employee to have zero or one manager and cycles to be forbidden.

This structure fits naturally on top of the graph examples we have already seen. For instance, if we want employees to have the following shape:

```ts
type Employee = {
  name: string;
  manager: Employee | undefined;
};
```

We can describe it as follows:

```ts
fc.entityGraph(
  { employee: { name: fc.string() } },
  { employee: { manager: { arity: '0-1', type: 'employee', strategy: 'successor' } } },
);
```

The arity set to 0-1 enforces that each employee has at most one manager, while the successor strategy prevents cycles by ensuring that management relationships always go forward.

### Organigram with a single root

While the previous organigram enforces a valid management hierarchy, it may produce multiple roots meaning several top managers.

In some cases, you may want to enforce a single root, such as a CEO. One way to achieve this with `entityGraph` is to invert the relationship and generate managees from their manager.

In this variant, employees have the following shape:

```ts
type Employee = {
  name: string;
  managees: Employee[];
};
```

This structure can be defined as follows:

```ts
fc.entityGraph(
  { employee: { name: fc.string() } },
  { employee: { managees: { arity: 'many', type: 'employee', strategy: 'exclusive' } } },
  { initialPoolConstraints: { employee: { maxLength: 1 } } }, // single root, at index 0
);
```

The exclusive strategy ensures that no employee appears in the managees list of more than one manager, while the initial pool constraint enforces a single root. Together, these constraints guarantee a tree-shaped organigram with exactly one top-level employee.

## Changelog since 4.4.0

The version 4.5.0 is based on version 4.4.0.

### Features

- ([PR#6333](https://github.com/dubzzz/fast-check/pull/6333)) Add `entityGraph` for schema-based structures
- ([PR#6336](https://github.com/dubzzz/fast-check/pull/6336)) Take into account the depth in `entityGraph`
- ([PR#6340](https://github.com/dubzzz/fast-check/pull/6340)) Add initial pool constraints to `entityGraph`
- ([PR#6341](https://github.com/dubzzz/fast-check/pull/6341)) Add strategies to `entityGraph`
- ([PR#6342](https://github.com/dubzzz/fast-check/pull/6342)) Allow recursions on many rels for `entityGraph`
- ([PR#6343](https://github.com/dubzzz/fast-check/pull/6343)) Tweak unicity of entities produced by `entityGraph`
- ([PR#6400](https://github.com/dubzzz/fast-check/pull/6400)) Support inverse relations in `entityGraph`

### Fixes

- ([PR#6375](https://github.com/dubzzz/fast-check/pull/6375)) Bug: Fix workflow authentication by enabling credential persistence
- ([PR#6369](https://github.com/dubzzz/fast-check/pull/6369)) CI: Fix vulnerabilities in our GitHub workflows
- ([PR#6370](https://github.com/dubzzz/fast-check/pull/6370)) CI: Add workflow security audit with zizmor
- ([PR#6374](https://github.com/dubzzz/fast-check/pull/6374)) CI: Fix vulnerabilities in build-status workflow
- ([PR#6397](https://github.com/dubzzz/fast-check/pull/6397)) CI: Ignore trusted publishing for pkg-pr-new
- ([PR#6410](https://github.com/dubzzz/fast-check/pull/6410)) CI: Fix generate-changelog script
- ([PR#6365](https://github.com/dubzzz/fast-check/pull/6365)) Doc: Release note for version 4.4.0
- ([PR#6379](https://github.com/dubzzz/fast-check/pull/6379)) Doc: Fix dead links in the documentation
- ([PR#6378](https://github.com/dubzzz/fast-check/pull/6378)) Doc: Connect AskAI in docsearch from Algolia
- ([PR#6380](https://github.com/dubzzz/fast-check/pull/6380)) Doc: Update Content-Security-Policy for AskAI
- ([PR#6367](https://github.com/dubzzz/fast-check/pull/6367)) Doc: Rework JSDoc for entityGraph and related types
- ([PR#6383](https://github.com/dubzzz/fast-check/pull/6383)) Doc: Enhance `entityGraph` documentation
- ([PR#6337](https://github.com/dubzzz/fast-check/pull/6337)) Refactor: Allocate unlinked versions earlier in `entityGraph`
- ([PR#6339](https://github.com/dubzzz/fast-check/pull/6339)) Refactor: Split code of `entityGraph` into sub-helpers
- ([PR#6345](https://github.com/dubzzz/fast-check/pull/6345)) Refactor: Import all files with an extension
- ([PR#6398](https://github.com/dubzzz/fast-check/pull/6398)) Script: Ask AIs to be concise when naming PRs
- ([PR#6389](https://github.com/dubzzz/fast-check/pull/6389)) Test: Replace @ts-ignore with @ts-expect-error
