---
slug: /core-blocks/arbitraries/combiners/recursive-structure/
---

# Recursive Structure

Define arbitraries able to generate recursive structures.

## letrec

Generate recursive structures.

Prefer `fc.letrec` over `fc.memo`. Most of the features offered by `fc.memo` can now be implemented with `fc.letrec`.

**Signatures:**

- `fc.letrec(builder)`

**with:**

- `builder` — _builder function defining how to build the recursive structure, it answers to the signature `(tie) => `object with key corresponding to the name of the arbitrary and with vaue the arbitrary itself. The `tie` function given to builder should be used as a placeholder to handle the recursion. It takes as input the name of the arbitrary to use in the recursion._

**Usages:**

```js
// Setup the tree structure:
const { tree } = fc.letrec((tie) => ({
  // Warning: In version 2.x and before, there is no automatic control over the depth of the generated data-structures.
  // As a consequence to avoid your data-structures to be too deep, it is highly recommended to add the constraint `depthFactor`
  // onto your usages of `option` and `oneof` and to put the arbitrary without recursion first.
  // In version 3.x, `depthSize` (previously `depthFactor`) and `withCrossShrink` will be enabled by default.
  tree: fc.oneof({ depthSize: 'small', withCrossShrink: true }, tie('leaf'), tie('node')),
  node: fc.record({
    left: tie('tree'),
    right: tie('tree'),
  }),
  leaf: fc.nat(),
}));
// Use the arbitrary:
tree;
// Examples of generated values:
// • 1948660480
// • {"left":2147483625,"right":28}
// • {__proto__:null,"left":{__proto__:null,"left":21,"right":2147483628},"right":2147483619}
// • 423794071
// • 27
// • …

fc.letrec((tie) => ({
  node: fc.record({
    value: fc.nat(),
    left: fc.option(tie('node'), { maxDepth: 1, depthIdentifier: 'tree' }),
    right: fc.option(tie('node'), { maxDepth: 1, depthIdentifier: 'tree' }),
  }),
})).node;
// Note: You can limit the depth of the generated structrures by using the constraint `maxDepth` (see `option` and `oneof`).
//   On the example above we need to specify `depthIdentifier` to share the depth between left and right branches...
// Examples of generated values:
// • {__proto__:null,"value":2147483632,"left":{__proto__:null,"value":1485877161,"left":null,"right":null},"right":{__proto__:null,"value":685791529,"left":null,"right":null}}
// • {__proto__:null,"value":1056088736,"left":null,"right":{__proto__:null,"value":2147483623,"left":null,"right":null}}
// • {"value":1227733267,"left":{"value":21,"left":null,"right":null},"right":{"value":2147483644,"left":null,"right":null}}
// • {"value":17,"left":null,"right":{"value":12,"left":null,"right":null}}
// • {"value":17,"left":{__proto__:null,"value":12,"left":null,"right":null},"right":{__proto__:null,"value":591157184,"left":null,"right":null}}
// • …

// Setup the depth identifier shared across all nodes:
const depthIdentifier = fc.createDepthIdentifier();
// Use the arbitrary:
fc.letrec((tie) => ({
  node: fc.record({
    value: fc.nat(),
    left: fc.option(tie('node'), { maxDepth: 1, depthIdentifier }),
    right: fc.option(tie('node'), { maxDepth: 1, depthIdentifier }),
  }),
})).node;
// Note: Calling `createDepthIdentifier` is another way to pass a value for `depthIdentifier`. Compared to the string-based
// version, demo-ed in the snippet above, it has the benefit to never collide with other identifiers manually specified.
// Examples of generated values:
// • {__proto__:null,"value":2147483645,"left":{"value":9,"left":null,"right":null},"right":null}
// • {__proto__:null,"value":7,"left":null,"right":{__proto__:null,"value":96999551,"left":null,"right":null}}
// • {"value":3,"left":{__proto__:null,"value":1312350013,"left":null,"right":null},"right":null}
// • {"value":2051975271,"left":{"value":2147483645,"left":null,"right":null},"right":{"value":1305755095,"left":null,"right":null}}
// • {"value":2,"left":{"value":1530374940,"left":null,"right":null},"right":null}
// • …

fc.letrec((tie) => ({
  node: fc.record({
    value: fc.nat(),
    left: fc.option(tie('node'), { maxDepth: 1 }),
    right: fc.option(tie('node'), { maxDepth: 1 }),
  }),
})).node;
// ...If we don't specify it, the maximal number of right in a given path will be limited to 1, but may include intermediate left.
//    Thus the resulting trees might be deeper than 1.
// Examples of generated values:
// • {__proto__:null,"value":14,"left":{__proto__:null,"value":1703987241,"left":null,"right":{"value":643118365,"left":null,"right":null}},"right":{__proto__:null,"value":1029204262,"left":{__proto__:null,"value":1968117159,"left":null,"right":null},"right":null}}
// • {__proto__:null,"value":26,"left":{__proto__:null,"value":1662273887,"left":null,"right":{__proto__:null,"value":525337883,"left":null,"right":null}},"right":{__proto__:null,"value":797448699,"left":{"value":657617990,"left":null,"right":null},"right":null}}
// • {__proto__:null,"value":2121842454,"left":null,"right":{"value":1835255719,"left":{__proto__:null,"value":1989636808,"left":null,"right":null},"right":null}}
// • {"value":1438784023,"left":{__proto__:null,"value":24,"left":null,"right":{__proto__:null,"value":420442369,"left":null,"right":null}},"right":{"value":9,"left":{__proto__:null,"value":1424795296,"left":null,"right":null},"right":null}}
// • {__proto__:null,"value":1331332801,"left":null,"right":{__proto__:null,"value":1001840875,"left":{__proto__:null,"value":1327656949,"left":null,"right":null},"right":null}}
// • …

fc.letrec((tie) => ({
  tree: fc.oneof({ maxDepth: 2 }, { arbitrary: tie('leaf'), weight: 0 }, { arbitrary: tie('node'), weight: 1 }),
  node: fc.record({ left: tie('tree'), right: tie('tree') }),
  leaf: fc.nat(),
})).tree;
// Note: Exact depth of 2: not more not less.
// Note: If you use multiple `option` or `oneof` to define such recursive structure
//   you may want to specify a `depthIdentifier` so that they share the exact same depth.
//   See examples above for more details.
// Examples of generated values:
// • {__proto__:null,"left":{"left":1313545969,"right":13},"right":{"left":9,"right":27}}
// • {"left":{__proto__:null,"left":17,"right":5},"right":{__proto__:null,"left":874941432,"right":25}}
// • {"left":{"left":18,"right":1121202},"right":{"left":831642574,"right":1975057275}}
// • {__proto__:null,"left":{__proto__:null,"left":1542103881,"right":9},"right":{__proto__:null,"left":1645153719,"right":21}}
// • {"left":{__proto__:null,"left":749002681,"right":2069272340},"right":{__proto__:null,"left":16,"right":16}}
// • …

fc.statistics(
  fc.letrec((tie) => ({
    node: fc.record({
      value: fc.nat(),
      left: fc.option(tie('node')),
      right: fc.option(tie('node')),
    }),
  })).node,
  (v) => {
    function size(n) {
      if (n === null) return 0;
      else return 1 + size(n.left) + size(n.right);
    }
    const s = size(v);
    let lower = 1;
    const next = (n) => (String(n)[0] === '1' ? n * 5 : n * 2);
    while (next(lower) <= s) {
      lower = next(lower);
    }
    return `${lower} to ${next(lower) - 1} items`;
  },
);
// Computed statistics for 10k generated values:
// For size = "xsmall":
// • 5 to 9 items....42.99%
// • 10 to 49 items..39.82%
// • 1 to 4 items....17.19%
// For size = "small":
// • 10 to 49 items..85.95%
// • 5 to 9 items.....5.35%
// • 1 to 4 items.....4.35%
// • 50 to 99 items...4.35%
// For size = "medium":
// • 100 to 499 items..83.03%
// • 50 to 99 items....10.05%
// • 1 to 4 items.......3.78%
// • 10 to 49 items.....2.93%
// • 5 to 9 items.......0.14%

fc.statistics(
  fc.letrec((tie) => ({
    node: fc.record({
      value: fc.nat(),
      children: fc.oneof(
        { depthIdentifier: 'node' },
        fc.constant([]),
        fc.array(tie('node'), { depthIdentifier: 'node' }),
      ),
    }),
  })).node,
  (v) => {
    function size(n) {
      if (n === null) return 0;
      else return 1 + n.children.reduce((acc, child) => acc + size(child), 0);
    }
    const s = size(v);
    let lower = 1;
    const next = (n) => (String(n)[0] === '1' ? n * 5 : n * 2);
    while (next(lower) <= s) {
      lower = next(lower);
    }
    return `${lower} to ${next(lower) - 1} items`;
  },
);
// Computed statistics for 10k generated values:
// For size = "xsmall":
// • 1 to 4 items..100.00%
// For size = "small":
// • 1 to 4 items....60.16%
// • 10 to 49 items..23.99%
// • 5 to 9 items....15.83%
// • 50 to 99 items...0.02%
// For size = "medium":
// • 1 to 4 items......51.31%
// • 50 to 99 items....26.41%
// • 10 to 49 items....16.16%
// • 100 to 499 items...5.93%
// • 5 to 9 items.......0.14%
```

Resources: [API reference](/docs/api/functions/letrec).  
Available since 1.16.0.

## memo

Generate recursive structures.

:::tip Prefer `fc.letrec` when feasible
Initially `fc.memo` has been designed to offer a higher control over the generated depth. Unfortunately it came with a cost: the arbitrary itself is costly to build.
Most of the features offered by `fc.memo` can now be done using `fc.letrec` coupled with `fc.option` or `fc.oneof`.
Whenever possible, we recommend using `fc.letrec` instead of `fc.memo`.
:::

**Signatures:**

- `fc.memo(builder)`

**with:**

- `builder` — _builder function defining how to build the recursive structure. It receives as input the remaining depth and has to return an arbitrary (potentially another `memo` or itself)_

**Usages:**

```js
// Setup the tree structure:
const tree = fc.memo((n) => fc.oneof(leaf(), node(n)));
const node = fc.memo((n) => {
  if (n <= 1) return fc.record({ left: leaf(), right: leaf() });
  return fc.record({ left: tree(), right: tree() }); // tree() is equivalent to tree(n-1)
});
const leaf = fc.nat;
// Use the arbitrary:
tree(2);
// Note: Only produce trees having a maximal depth of 2
// Examples of generated values:
// • 24
// • {"left":{__proto__:null,"left":1696460155,"right":2147483646},"right":135938859}
// • 9
// • {"left":27,"right":{"left":2147483633,"right":2147483631}}
// • {"left":29,"right":{"left":2,"right":367441398}}
// • …
```

Resources: [API reference](/docs/api/functions/memo).  
Available since 1.16.0.

## entityGraph

Generate interconnected entities with relationships based on a schema definition.

This arbitrary creates structured data where entities can reference each other through defined relationships. The generated values automatically include links between entities, making it ideal for testing graph structures, relational data, or interconnected object models. Unlike `fc.letrec`, this helper supports cycles and shared references between instances by default, though these can be controlled through strategy options.

The output is an object where each key corresponds to an entity type and the value is an array of entities of that type. Entities contain both their data fields and relationship links.

**Signatures:**

- `fc.entityGraph(arbitraries, relations)`
- `fc.entityGraph(arbitraries, relations, {initialPoolConstraints?,unicityConstraints?,noNullPrototype?})`

**with:**

- `arbitraries` — _defines the data fields for each entity type (non-relational properties). This is a record where each key is an entity type name and the value defines the arbitraries for that entity's fields, similar to `fc.record`_
- `relations` — _defines how entities reference each other (relational properties). This is a record where each key is an entity type name and the value defines the relationships from that entity to others_
  - _each relationship has the structure: `{arity, type, strategy?}` or `{arity: 'inverse', type, forwardRelationship}`_
    - `arity` — _cardinality of the relationship. `"0-1"` for an optional reference (produces undefined or a single instance), `"1"` for a required reference (always produces a single instance), `"many"` for a multi-valued reference (produces an array, possibly empty, with no duplicate references based on object identity), `"inverse"` for an inverse relationship (automatically computed array of entities that reference this entity through a specified forward relationship)_
    - `type` — _the name of the target entity type (must be one of the keys in `arbitraries`)_
    - `strategy?` — default: `'any'` — _constrains which target entities are eligible (not applicable for inverse relationships). `'any'` means no restrictions, `'exclusive'` means each target can only be referenced once (prevents sharing), `'successor'` means target must appear after the source in the entity array (prevents cycles and self-references)_
    - `forwardRelationship` — _for inverse relationships only: the name of the forward relationship property in the target type that references this entity type. The inverse relationship will automatically contain all entities that reference this entity through that forward relationship_
- `initialPoolConstraints?` — _controls the number of entities generated for each entity type in the initial pool (baseline set created before relationships are established). Provide an object mapping entity type names to constraints objects with `minLength?` and `maxLength?` properties (same as used by `fc.array`). Other entities may be created later to satisfy relationship requirements_
- `unicityConstraints?` — _defines uniqueness criteria for entities of each type to prevent duplicates. Provide a selector function that extracts a key from each entity. Entities with identical keys (compared using `Object.is`) are considered duplicates and only one instance will be kept_
- `noNullPrototype?` — default: `false` — _do not generate values with null prototype, only generate objects based on the Object-prototype_

**Usages:**

```js
fc.entityGraph(
  { node: { id: fc.stringMatching(/^[A-Z][a-z]*$/) } },
  { node: { linkTo: { arity: 'many', type: 'node' } } },
  {
    initialPoolConstraints: { node: { maxLength: 1 } },
    unicityConstraints: { node: (value) => value.id },
    noNullPrototype: true,
  },
);
// Note: Generate a directed graph where nodes can link to multiple other nodes
// - Entity type: node with an id field (string matching pattern)
// - Relationship: linkTo with arity 'many' allows each node to reference zero or more other nodes
// - Produces: { node: [{ id: "Abc", linkTo: [<node#1>, <node#0>] }, ...] }
// Characteristics of this configuration:
// - Enforces unique ids (unicityConstraints)
// - Allows cycles between nodes (e.g., A → B → C → A) — use strategy: 'successor' to prevent
// - Allows self-references (e.g., A → A) — use strategy: 'successor' to prevent
// - Creates a single connected graph (maxLength: 1 in initialPoolConstraints) — remove this constraint to allow multiple disconnected graphs
// Examples of generated values:
// • {"node":[{"id":"Fat","linkTo":[<node#0>,<node#1>,<node#2>,<node#3>,<node#4>,<node#5>]},{"id":"Hhcy","linkTo":[<node#4>,<node#0>,<node#5>,<node#2>,<node#6>]},{"id":"Fugqgozyke","linkTo":[<node#1>,<node#2>,<node#7>,<node#6>]},{"id":"Ox","linkTo":[<node#2>]},{"id":"Aka","linkTo":[<node#1>,<node#0>,<node#5>,<node#6>]},{"id":"Lfkhlpt","linkTo":[]},{"id":"Et","linkTo":[]},{"id":"Csmmmwemzx","linkTo":[<node#6>,<node#8>,<node#2>,<node#1>,<node#0>,<node#5>,<node#7>,<node#4>,<node#9>]},{"id":"Yuvlumzbvug","linkTo":[<node#3>,<node#6>,<node#8>,<node#10>,<node#9>,<node#7>,<node#0>,<node#5>,<node#1>,<node#4>]},{"id":"E","linkTo":[]},{"id":"Kuwagy","linkTo":[]}]}
// • {"node":[{"id":"Bzed","linkTo":[<node#0>,<node#1>,<node#2>,<node#3>,<node#4>,<node#5>]},{"id":"Fokz","linkTo":[<node#5>,<node#2>,<node#1>,<node#4>,<node#0>,<node#6>,<node#7>,<node#8>,<node#9>]},{"id":"Xv","linkTo":[<node#4>,<node#3>,<node#0>,<node#1>,<node#2>,<node#6>,<node#5>,<node#7>,<node#8>]},{"id":"B","linkTo":[<node#8>,<node#6>,<node#0>,<node#9>,<node#3>,<node#1>,<node#5>]},{"id":"Cfn","linkTo":[<node#7>,<node#9>,<node#8>,<node#6>,<node#5>,<node#10>,<node#4>,<node#3>,<node#1>,<node#2>]},{"id":"Dle","linkTo":[]},{"id":"Yt","linkTo":[]},{"id":"Zoq","linkTo":[<node#2>,<node#6>,<node#8>,<node#10>]},{"id":"Eb","linkTo":[<node#10>,<node#8>,<node#9>,<node#1>,<node#2>,<node#4>,<node#5>,<node#0>,<node#3>,<node#11>,<node#6>,<node#7>]},{"id":"Ge","linkTo":[<node#4>,<node#6>]},{"id":"Lay","linkTo":[<node#11>,<node#4>,<node#0>,<node#3>,<node#5>]},{"id":"Isizavgyrp","linkTo":[<node#0>,<node#8>,<node#2>]}]}
// • {"node":[{"id":"Cket","linkTo":[<node#0>,<node#1>,<node#2>,<node#3>,<node#4>,<node#5>,<node#6>,<node#7>]},{"id":"Urkob","linkTo":[]},{"id":"Cjcall","linkTo":[<node#5>,<node#0>,<node#7>,<node#8>,<node#3>,<node#9>,<node#1>]},{"id":"Bracwgykkhc","linkTo":[<node#10>,<node#6>]},{"id":"Lvallerc","linkTo":[<node#0>,<node#2>,<node#10>,<node#7>,<node#1>,<node#5>,<node#3>]},{"id":"Hpsxb","linkTo":[<node#9>,<node#4>,<node#5>]},{"id":"Ea","linkTo":[<node#2>,<node#7>,<node#3>,<node#8>]},{"id":"Jacaller","linkTo":[<node#2>,<node#11>,<node#9>,<node#8>,<node#1>,<node#7>]},{"id":"Bviw","linkTo":[<node#0>,<node#6>]},{"id":"O","linkTo":[]},{"id":"Xffjfx","linkTo":[]},{"id":"Xz","linkTo":[]}]}
// • {"node":[{"id":"Crlow","linkTo":[<node#0>]}]}
// • {"node":[{"id":"Yvvzps","linkTo":[<node#1>,<node#0>]},{"id":"Tljfbfaczg","linkTo":[<node#1>,<node#2>,<node#0>]},{"id":"Basdwcabc","linkTo":[<node#0>,<node#1>,<node#3>]},{"id":"Gzlrx","linkTo":[]}]}
// • …

fc.entityGraph(
  {
    employee: { name: fc.stringMatching(/^[A-Z][a-z]*$/) },
    team: { name: fc.stringMatching(/^[A-Z][a-z]*$/) },
  },
  {
    employee: { team: { arity: '1', type: 'team' } },
    team: {},
  },
  {
    initialPoolConstraints: { team: { maxLength: 0 } },
    unicityConstraints: { employee: (value) => value.name, team: (value) => value.name },
    noNullPrototype: true,
  },
);
// Note: Generate employees and teams where each employee belongs to exactly one team
// - Entity types: employee and team, both with name fields
// - Relationship: each employee has a required reference to one team (arity: '1')
// - Produces: { employee: [{ name: "Alice", team: <team#0> }, ...], team: [{ name: "Engineering" }, ...] }
// Characteristics of this configuration:
// - Enforces unique names for both employees and teams (unicityConstraints)
// - Every team has at least one employee (maxLength: 0 for team in initialPoolConstraints) — remove this to allow teams without employees
// Examples of generated values:
// • {"employee":[{"name":"Qx","team":<team#0>},{"name":"Zwjqfdtlqq","team":<team#1>},{"name":"Z","team":<team#1>},{"name":"G","team":<team#2>}],"team":[{"name":"Jqehbi"},{"name":"I"},{"name":"Edtlvyy"}]}
// • {"employee":[{"name":"Nzj","team":<team#0>}],"team":[{"name":"Erl"}]}
// • {"employee":[{"name":"R","team":<team#0>},{"name":"Z","team":<team#0>}],"team":[{"name":"Vj"}]}
// • {"employee":[{"name":"Aygjtsyxra","team":<team#0>}],"team":[{"name":"Dzyegexo"}]}
// • {"employee":[{"name":"Dl","team":<team#0>},{"name":"Betu","team":<team#0>},{"name":"Emijqo","team":<team#1>}],"team":[{"name":"Qgi"},{"name":"Azwya"}]}
// • …

fc.entityGraph(
  { employee: { name: fc.stringMatching(/^[A-Z][a-z]*$/) } },
  { employee: { manager: { arity: '0-1', type: 'employee', strategy: 'successor' } } },
  { unicityConstraints: { employee: (value) => value.name }, noNullPrototype: true },
);
// Note: Generate employees with optional manager relationships, preventing cycles
// - Entity type: employee with name field
// - Relationship: manager with arity '0-1' (optional) and strategy 'successor' (prevents cycles)
// - Produces: { employee: [{ name: "Alice", manager: <employee#1> }, { name: "Bob", manager: undefined }, ...] }
// Characteristics of this configuration:
// - Enforces unique names (unicityConstraints)
// - Prevents cycles (e.g., A manages B who manages A) due to strategy: 'successor' — use 'any' to allow cycles
// - Prevents self-management (e.g., A manages A) due to strategy: 'successor' — use 'any' to allow
// - Allows multiple disconnected hierarchies (e.g., A manages B, C manages D, with no links between groups) — add initialPoolConstraints: { employee: { maxLength: 1 } } to create a single connected hierarchy
// Examples of generated values:
// • {"employee":[{"name":"Yaneke","manager":<employee#1>},{"name":"Hiklfqlsebw","manager":<employee#3>},{"name":"Qwfalrgawh","manager":<employee#7>},{"name":"Aeozilmmf","manager":<employee#5>},{"name":"Axha","manager":undefined},{"name":"Qvofk","manager":<employee#7>},{"name":"Brnbobcda","manager":<employee#8>},{"name":"L","manager":<employee#9>},{"name":"Ugrtcuqu","manager":<employee#10>},{"name":"Aptu","manager":undefined},{"name":"Daeycsttz","manager":undefined}]}
// • {"employee":[{"name":"Zrzjxnwafac","manager":undefined},{"name":"Cmdjqp","manager":<employee#2>},{"name":"Yvyw","manager":<employee#3>},{"name":"Eiiwordiopx","manager":<employee#4>},{"name":"Ec","manager":<employee#5>},{"name":"L","manager":undefined}]}
// • {"employee":[{"name":"Bmjxomjkqbt","manager":<employee#2>},{"name":"Unvtcwbh","manager":<employee#2>},{"name":"Yiigrvmtwrj","manager":<employee#3>},{"name":"Ieowu","manager":<employee#5>},{"name":"Ajzdocrr","manager":<employee#6>},{"name":"Nbx","manager":<employee#7>},{"name":"Lxwihulupvl","manager":<employee#7>},{"name":"I","manager":<employee#8>},{"name":"Cz","manager":undefined}]}
// • {"employee":[{"name":"Zq","manager":<employee#1>},{"name":"Oqrx","manager":<employee#2>},{"name":"Ykey","manager":<employee#3>},{"name":"Coqizwz","manager":<employee#4>},{"name":"Ersejkqxchz","manager":undefined}]}
// • {"employee":[{"name":"Y","manager":<employee#9>},{"name":"K","manager":<employee#3>},{"name":"Orey","manager":<employee#9>},{"name":"Rodqacc","manager":<employee#5>},{"name":"Isumtqskwe","manager":<employee#8>},{"name":"Virizoyw","manager":undefined},{"name":"Xcafapplyhx","manager":undefined},{"name":"Lapply","manager":<employee#9>},{"name":"Ear","manager":<employee#9>},{"name":"Rxyjfmzjz","manager":<employee#10>},{"name":"Ehzhfve","manager":<employee#11>},{"name":"Bmwzcedml","manager":undefined}]}
// • …

fc.entityGraph(
  { employee: { name: fc.stringMatching(/^[A-Z][a-z]*$/) } },
  { employee: { managees: { arity: 'many', type: 'employee', strategy: 'exclusive' } } },
  {
    initialPoolConstraints: { employee: { maxLength: 1 } },
    unicityConstraints: { employee: (value) => value.name },
    noNullPrototype: true,
  },
);
// Note: Generate employees with managees relationships, preventing shared references
// - Entity type: employee with name field
// - Relationship: managees with arity 'many' (array) and strategy 'exclusive' (each employee can only be a managee of one manager)
// - Produces: { employee: [{ name: "Alice", managees: [<employee#1>, <employee#2>] }, { name: "Bob", managees: [] }, ...] }
// Characteristics of this configuration:
// - Enforces unique names (unicityConstraints)
// - Prevents shared managees (each employee can only be managed by one person) due to strategy: 'exclusive'
// - Creates a single hierarchy rooted at the first employee (maxLength: 1 in initialPoolConstraints) — remove this to allow multiple disconnected hierarchies
// Examples of generated values:
// • {"employee":[{"name":"Lcjv","managees":[<employee#1>,<employee#2>]},{"name":"Dobppajkdb","managees":[<employee#3>,<employee#4>,<employee#5>,<employee#6>]},{"name":"Nnexi","managees":[<employee#7>,<employee#8>,<employee#9>,<employee#10>,<employee#11>,<employee#12>,<employee#13>,<employee#14>,<employee#15>]},{"name":"Aeyuquttqac","managees":[<employee#16>,<employee#17>,<employee#18>]},{"name":"Ezbc","managees":[<employee#19>,<employee#20>]},{"name":"E","managees":[]},{"name":"Zomlbcmvs","managees":[<employee#21>,<employee#22>]},{"name":"Fqase","managees":[<employee#23>,<employee#24>,<employee#25>]},{"name":"H","managees":[]},{"name":"Xwqdavn","managees":[<employee#26>,<employee#27>]},{"name":"Xqzcvuhdvs","managees":[]},{"name":"Cq","managees":[<employee#28>]},{"name":"Vsz","managees":[]},{"name":"Xref","managees":[]},{"name":"U","managees":[<employee#29>,<employee#30>,<employee#31>,<employee#32>,<employee#33>,<employee#34>]},{"name":"Qvcn","managees":[]},{"name":"Op","managees":[<employee#35>]},{"name":"Cbol","managees":[]},{"name":"Dxgy","managees":[]},{"name":"Xc","managees":[<employee#36>,<employee#37>,<employee#38>,<employee#39>,<employee#40>]},{"name":"Vec","managees":[]},{"name":"Yb","managees":[]},{"name":"Cjndbqo","managees":[<employee#41>]},{"name":"Bref","managees":[]},{"name":"Dboycdxcuxa","managees":[]},{"name":"Sxijdbfbp","managees":[]},{"name":"Zud","managees":[]},{"name":"Adyd","managees":[]},{"name":"Rv","managees":[]},{"name":"Wvoxfgs","managees":[]},{"name":"Ctxk","managees":[<employee#42>]},{"name":"Xamf","managees":[<employee#43>,<employee#44>,<employee#45>,<employee#46>,<employee#47>,<employee#48>,<employee#49>,<employee#50>]},{"name":"Altetaio","managees":[<employee#51>,<employee#52>,<employee#53>,<employee#54>]},{"name":"Gx","managees":[<employee#55>,<employee#56>,<employee#57>,<employee#58>,<employee#59>,<employee#60>,<employee#61>,<employee#62>,<employee#63>,<employee#64>,<employee#65>]},{"name":"Bbwbhbndw","managees":[]},{"name":"Udecvz","managees":[]},{"name":"Aakda","managees":[<employee#66>,<employee#67>]},{"name":"Qpce","managees":[]},{"name":"Y","managees":[]},{"name":"Gl","managees":[<employee#68>,<employee#69>,<employee#70>,<employee#71>,<employee#72>,<employee#73>,<employee#74>,<employee#75>,<employee#76>,<employee#77>,<employee#78>,<employee#79>]},{"name":"Xadavybe","managees":[]},{"name":"Rjkru","managees":[]},{"name":"Ivywmrefyn","managees":[<employee#80>,<employee#81>,<employee#82>,<employee#83>]},{"name":"Bkey","managees":[]},{"name":"Cr","managees":[<employee#84>,<employee#85>,<employee#86>,<employee#87>,<employee#88>,<employee#89>,<employee#90>,<employee#91>,<employee#92>,<employee#93>]},{"name":"Jdic","managees":[]},{"name":"G","managees":[]},{"name":"Oeaaf","managees":[]},{"name":"Wvlvssr","managees":[]},{"name":"Bbzeazdajvk","managees":[<employee#94>]},{"name":"Zlnamev","managees":[]},{"name":"Yp","managees":[]},{"name":"Cufrbo","managees":[]},{"name":"Jeao","managees":[<employee#95>,<employee#96>,<employee#97>]},{"name":"Mref","managees":[<employee#98>,<employee#99>,<employee#100>,<employee#101>,<employee#102>,<employee#103>,<employee#104>,<employee#105>,<employee#106>,<employee#107>,<employee#108>,<employee#109>]},{"name":"Wexlobtes","managees":[]},{"name":"Ehqz","managees":[<employee#110>,<employee#111>,<employee#112>,<employee#113>,<employee#114>,<employee#115>,<employee#116>,<employee#117>,<employee#118>,<employee#119>,<employee#120>]},{"name":"Dugmabgmyy","managees":[]},{"name":"Ieybfbe","managees":[]},{"name":"Bnnyjv","managees":[]},{"name":"Dqezzsb","managees":[]},{"name":"Vxfjhwiqkis","managees":[]},{"name":"Efpjsjodlcc","managees":[]},{"name":"Zarg","managees":[]},{"name":"Vcdx","managees":[]},{"name":"Ixqgui","managees":[]},{"name":"Brzqfbmecag","managees":[]},{"name":"C","managees":[]},{"name":"Aeynewtwz","managees":[]},{"name":"Xaodn","managees":[]},{"name":"Nlyamfie","managees":[<employee#121>,<employee#122>,<employee#123>,<employee#124>,<employee#125>,<employee#126>,<employee#127>,<employee#128>]},{"name":"Ugaaqggso","managees":[<employee#129>,<employee#130>,<employee#131>,<employee#132>,<employee#133>,<employee#134>,<employee#135>,<employee#136>,<employee#137>,<employee#138>,<employee#139>]},{"name":"Wcallerc","managees":[]},{"name":"Ie","managees":[]},{"name":"Cuhrylyxh","managees":[]},{"name":"Wcgpqql","managees":[]},{"name":"Nkrwgal","managees":[]},{"name":"Wbbeweb","managees":[]},{"name":"Sxww","managees":[]},{"name":"Wra","managees":[]},{"name":"Wehj","managees":[]},{"name":"Q","managees":[]},{"name":"Iakeytxdapp","managees":[]},{"name":"Aetyesalep","managees":[]},{"name":"Gzsyct","managees":[]},{"name":"L","managees":[]},{"name":"Ec","managees":[]},{"name":"Yk","managees":[]},{"name":"Acal","managees":[]},{"name":"B","managees":[]},{"name":"Flbd","managees":[<employee#140>,<employee#141>,<employee#142>,<employee#143>,<employee#144>]},{"name":"Bstr","managees":[]},{"name":"Wyci","managees":[]},{"name":"Azqdbgsvep","managees":[]},{"name":"Ez","managees":[]},{"name":"Aewecrwbx","managees":[]},{"name":"Yaacallh","managees":[]},{"name":"Ccui","managees":[]},{"name":"Lbsdjxcdk","managees":[]},{"name":"Zlihd","managees":[]},{"name":"Detb","managees":[]},{"name":"Psjrzks","managees":[]},{"name":"Zcon","managees":[]},{"name":"Akey","managees":[]},{"name":"Gaw","managees":[<employee#145>,<employee#146>,<employee#147>,<employee#148>,<employee#149>]},{"name":"Eref","managees":[]},{"name":"Bnxt","managees":[]},{"name":"Edozyhxzkz","managees":[]},{"name":"A","managees":[]},{"name":"Cbnu","managees":[]},{"name":"Nghblkez","managees":[]},{"name":"Oc","managees":[]},{"name":"Tmz","managees":[]},{"name":"Fdrwy","managees":[]},{"name":"Xzv","managees":[]},{"name":"Bvyrq","managees":[]},{"name":"Sxlirt","managees":[]},{"name":"Rnthwdlkf","managees":[]},{"name":"Eqz","managees":[]},{"name":"Czheql","managees":[]},{"name":"V","managees":[]},{"name":"Kva","managees":[<employee#150>,<employee#151>,<employee#152>,<employee#153>,<employee#154>,<employee#155>,<employee#156>,<employee#157>,<employee#158>,<employee#159>,<employee#160>,<employee#161>]},{"name":"Vdbcbcodz","managees":[]},{"name":"Eorwkuqjzye","managees":[]},{"name":"Gv","managees":[]},{"name":"Wyg","managees":[]},{"name":"Dkdrrcncyvi","managees":[]},{"name":"Wxe","managees":[]},{"name":"Sprlls","managees":[]},{"name":"Lnjppxlnxk","managees":[]},{"name":"Xi","managees":[]},{"name":"Zkqnhjjn","managees":[]},{"name":"Qveyw","managees":[]},{"name":"Bxargum","managees":[]},{"name":"Ycy","managees":[]},{"name":"Ypc","managees":[]},{"name":"Oqkwnfcph","managees":[]},{"name":"Ffqoiqbfxzv","managees":[]},{"name":"Z","managees":[]},{"name":"Vkey","managees":[]},{"name":"Cuoqheyimft","managees":[]},{"name":"Dotdl","managees":[]},{"name":"Xxkd","managees":[]},{"name":"Cwq","managees":[]},{"name":"Wbpr","managees":[<employee#162>,<employee#163>,<employee#164>,<employee#165>,<employee#166>,<employee#167>,<employee#168>,<employee#169>,<employee#170>,<employee#171>,<employee#172>,<employee#173>]},{"name":"Wuapxszkup","managees":[]},{"name":"Gs","managees":[]},{"name":"Ye","managees":[]},{"name":"Rfmvyki","managees":[]},{"name":"Xzz","managees":[]},{"name":"Dtsblb","managees":[]},{"name":"Waasue","managees":[]},{"name":"Ceak","managees":[]},{"name":"Dqipflps","managees":[]},{"name":"Pkitz","managees":[]},{"name":"Bkeyhylwq","managees":[]},{"name":"Mbvlmea","managees":[]},{"name":"Dnnposm","managees":[]},{"name":"Tcs","managees":[]},{"name":"Gnyxexy","managees":[]},{"name":"D","managees":[]},{"name":"Dtpoblvlw","managees":[]},{"name":"Fyqau","managees":[]},{"name":"Ayvy","managees":[]},{"name":"Cvy","managees":[]},{"name":"Tyrwrogv","managees":[]},{"name":"Mkey","managees":[]},{"name":"Gocszyehf","managees":[]},{"name":"Wz","managees":[]},{"name":"Ogti","managees":[]},{"name":"Carguments","managees":[<employee#174>]},{"name":"Wozu","managees":[]},{"name":"Rx","managees":[]},{"name":"Muez","managees":[]},{"name":"Cixvz","managees":[]}]}
// • {"employee":[{"name":"Cyymlengtho","managees":[<employee#1>,<employee#2>,<employee#3>,<employee#4>,<employee#5>,<employee#6>]},{"name":"Y","managees":[<employee#7>,<employee#8>,<employee#9>,<employee#10>,<employee#11>,<employee#12>,<employee#13>,<employee#14>,<employee#15>]},{"name":"Ejdtzs","managees":[<employee#16>,<employee#17>]},{"name":"Zozxrdvwb","managees":[<employee#18>,<employee#19>,<employee#20>,<employee#21>,<employee#22>]},{"name":"Uprototyp","managees":[<employee#23>,<employee#24>]},{"name":"Qfc","managees":[<employee#25>,<employee#26>,<employee#27>,<employee#28>,<employee#29>,<employee#30>,<employee#31>,<employee#32>,<employee#33>]},{"name":"Whewfruu","managees":[<employee#34>,<employee#35>,<employee#36>,<employee#37>,<employee#38>,<employee#39>,<employee#40>,<employee#41>,<employee#42>,<employee#43>,<employee#44>,<employee#45>]},{"name":"Gvv","managees":[]},{"name":"Ed","managees":[]},{"name":"Vibohyrveeq","managees":[]},{"name":"Ycall","managees":[<employee#46>,<employee#47>,<employee#48>]},{"name":"Adcewavxvj","managees":[]},{"name":"Z","managees":[<employee#49>,<employee#50>,<employee#51>,<employee#52>,<employee#53>,<employee#54>,<employee#55>,<employee#56>]},{"name":"Hcdjzqdhx","managees":[]},{"name":"Vn","managees":[]},{"name":"Vww","managees":[<employee#57>,<employee#58>,<employee#59>,<employee#60>]},{"name":"Mmk","managees":[]},{"name":"Drototyp","managees":[]},{"name":"Bbfxfmdbtsl","managees":[]},{"name":"Halxyacxn","managees":[]},{"name":"Zgqcys","managees":[]},{"name":"Nami","managees":[<employee#61>,<employee#62>,<employee#63>,<employee#64>,<employee#65>,<employee#66>,<employee#67>,<employee#68>,<employee#69>,<employee#70>,<employee#71>]},{"name":"Qaccrd","managees":[<employee#72>,<employee#73>,<employee#74>,<employee#75>,<employee#76>,<employee#77>,<employee#78>,<employee#79>,<employee#80>,<employee#81>,<employee#82>]},{"name":"Anavstd","managees":[<employee#83>,<employee#84>,<employee#85>,<employee#86>,<employee#87>,<employee#88>,<employee#89>]},{"name":"Vwv","managees":[<employee#90>,<employee#91>,<employee#92>,<employee#93>,<employee#94>,<employee#95>,<employee#96>]},{"name":"Ec","managees":[]},{"name":"Xlbccall","managees":[]},{"name":"Dlpakede","managees":[]},{"name":"Zkey","managees":[<employee#97>,<employee#98>,<employee#99>,<employee#100>,<employee#101>,<employee#102>,<employee#103>,<employee#104>,<employee#105>,<employee#106>]},{"name":"Ye","managees":[<employee#107>,<employee#108>,<employee#109>,<employee#110>]},{"name":"Abfmovdifwu","managees":[]},{"name":"Zdbiu","managees":[]},{"name":"Cbat","managees":[<employee#111>,<employee#112>,<employee#113>,<employee#114>,<employee#115>,<employee#116>]},{"name":"K","managees":[]},{"name":"En","managees":[]},{"name":"Dc","managees":[]},{"name":"Zqmig","managees":[<employee#117>,<employee#118>,<employee#119>,<employee#120>,<employee#121>,<employee#122>,<employee#123>,<employee#124>]},{"name":"Jucceihuzy","managees":[]},{"name":"Cn","managees":[<employee#125>,<employee#126>,<employee#127>,<employee#128>,<employee#129>,<employee#130>,<employee#131>,<employee#132>,<employee#133>,<employee#134>]},{"name":"Bo","managees":[<employee#135>,<employee#136>,<employee#137>,<employee#138>,<employee#139>,<employee#140>]},{"name":"Gzhcqd","managees":[]},{"name":"Cwjnjsnwjt","managees":[<employee#141>,<employee#142>,<employee#143>,<employee#144>,<employee#145>,<employee#146>,<employee#147>,<employee#148>,<employee#149>]},{"name":"Davrtlqlbh","managees":[<employee#150>]},{"name":"Ball","managees":[<employee#151>,<employee#152>,<employee#153>,<employee#154>]},{"name":"Vswoncfjlzq","managees":[]},{"name":"Qvyfjkuuf","managees":[]},{"name":"Avwycg","managees":[<employee#155>]},{"name":"Zmzp","managees":[]},{"name":"Ts","managees":[]},{"name":"Dref","managees":[]},{"name":"Ers","managees":[]},{"name":"Qapply","managees":[]},{"name":"Bdyrqaxivd","managees":[]},{"name":"Bc","managees":[]},{"name":"Ac","managees":[]},{"name":"Yndeoacn","managees":[]},{"name":"Coqhssi","managees":[]},{"name":"We","managees":[]},{"name":"Bry","managees":[]},{"name":"A","managees":[]},{"name":"Fzfd","managees":[]},{"name":"Bxk","managees":[]},{"name":"Enwxk","managees":[]},{"name":"Bcnea","managees":[]},{"name":"Aenf","managees":[]},{"name":"Eegbif","managees":[]},{"name":"Ump","managees":[]},{"name":"Q","managees":[]},{"name":"Xl","managees":[]},{"name":"Zmmrdekwkr","managees":[]},{"name":"Ccaller","managees":[]},{"name":"D","managees":[<employee#156>,<employee#157>,<employee#158>,<employee#159>,<employee#160>,<employee#161>,<employee#162>,<employee#163>,<employee#164>]},{"name":"Decallerpbu","managees":[<employee#165>]},{"name":"Exxyedfvosb","managees":[]},{"name":"Di","managees":[]},{"name":"Drgi","managees":[]},{"name":"Mvaein","managees":[]},{"name":"Xjnk","managees":[<employee#166>,<employee#167>]},{"name":"C","managees":[<employee#168>,<employee#169>,<employee#170>,<employee#171>,<employee#172>,<employee#173>,<employee#174>,<employee#175>,<employee#176>]},{"name":"Dbyewcmnabs","managees":[]},{"name":"Vbekf","managees":[]},{"name":"Vpfnamecon","managees":[]},{"name":"Ey","managees":[]},{"name":"Davr","managees":[<employee#177>,<employee#178>,<employee#179>,<employee#180>,<employee#181>,<employee#182>]},{"name":"Nxp","managees":[]},{"name":"Tec","managees":[]},{"name":"Rrs","managees":[<employee#183>,<employee#184>]},{"name":"Csn","managees":[<employee#185>,<employee#186>,<employee#187>,<employee#188>]},{"name":"Dd","managees":[<employee#189>,<employee#190>,<employee#191>,<employee#192>,<employee#193>]},{"name":"Enlo","managees":[]},{"name":"Wrdt","managees":[]},{"name":"Aknamegppr","managees":[]},{"name":"Zzsodqy","managees":[]},{"name":"Cmr","managees":[]},{"name":"Ypzmedbgbec","managees":[]},{"name":"Bwdnf","managees":[]},{"name":"Alvbvexz","managees":[]},{"name":"Yu","managees":[]},{"name":"Addp","managees":[]},{"name":"Cc","managees":[<employee#194>,<employee#195>,<employee#196>,<employee#197>,<employee#198>,<employee#199>,<employee#200>,<employee#201>,<employee#202>]},{"name":"Jkfcbidr","managees":[]},{"name":"Eoqwjddl","managees":[]},{"name":"Aarefcle","managees":[]},{"name":"Rr","managees":[]},{"name":"Vpzjww","managees":[]},{"name":"Ctbindre","managees":[]},{"name":"Qk","managees":[<employee#203>,<employee#204>,<employee#205>,<employee#206>]},{"name":"Cxwa","managees":[<employee#207>,<employee#208>]},{"name":"Aajutlrx","managees":[<employee#209>,<employee#210>,<employee#211>]},{"name":"Anev","managees":[]},{"name":"Zirkqeweyzz","managees":[<employee#212>]},{"name":"W","managees":[]},{"name":"Blengthcal","managees":[]},{"name":"Txuzuax","managees":[<employee#213>]},{"name":"Hmbgga","managees":[]},{"name":"Abrirkuovc","managees":[<employee#214>,<employee#215>,<employee#216>,<employee#217>,<employee#218>,<employee#219>,<employee#220>,<employee#221>,<employee#222>]},{"name":"Dzemdmkqwq","managees":[]},{"name":"Uxa","managees":[]},{"name":"Cr","managees":[<employee#223>,<employee#224>,<employee#225>,<employee#226>,<employee#227>,<employee#228>,<employee#229>,<employee#230>]},{"name":"Bvbjcc","managees":[]},{"name":"Yexnfsf","managees":[<employee#231>]},{"name":"Drpulwhu","managees":[]},{"name":"Eufhcctwg","managees":[<employee#232>,<employee#233>,<employee#234>,<employee#235>]},{"name":"Hkzfraej","managees":[]},{"name":"Za","managees":[<employee#236>]},{"name":"Qpsimcx","managees":[]},{"name":"Br","managees":[<employee#237>,<employee#238>,<employee#239>,<employee#240>,<employee#241>,<employee#242>,<employee#243>,<employee#244>]},{"name":"Kjwlcvhtirk","managees":[]},{"name":"Kjxxlbyagb","managees":[]},{"name":"Eri","managees":[]},{"name":"Ygryarrohor","managees":[]},{"name":"O","managees":[<employee#245>,<employee#246>,<employee#247>,<employee#248>,<employee#249>,<employee#250>]},{"name":"Ej","managees":[]},{"name":"Nudczqddwze","managees":[]},{"name":"Dcufpbnb","managees":[]},{"name":"Kbvuht","managees":[]},{"name":"Aqtmxlqgxf","managees":[]},{"name":"Ohz","managees":[]},{"name":"Bicgonzlq","managees":[]},{"name":"Ceball","managees":[]},{"name":"Gco","managees":[]},{"name":"V","managees":[]},{"name":"E","managees":[<employee#251>,<employee#252>,<employee#253>,<employee#254>,<employee#255>,<employee#256>]},{"name":"Eknnj","managees":[]},{"name":"Bnf","managees":[]},{"name":"Acab","managees":[]},{"name":"Dzyeiez","managees":[]},{"name":"Xq","managees":[]},{"name":"Clewk","managees":[]},{"name":"Cdyb","managees":[]},{"name":"Enbwrejzl","managees":[]},{"name":"M","managees":[]},{"name":"Yaxuaczya","managees":[]},{"name":"Ddb","managees":[<employee#257>,<employee#258>,<employee#259>,<employee#260>,<employee#261>,<employee#262>,<employee#263>]},{"name":"U","managees":[]},{"name":"B","managees":[<employee#264>,<employee#265>,<employee#266>,<employee#267>,<employee#268>,<employee#269>,<employee#270>]},{"name":"Agervo","managees":[<employee#271>,<employee#272>,<employee#273>,<employee#274>,<employee#275>,<employee#276>,<employee#277>]},{"name":"Spl","managees":[]},{"name":"Lriui","managees":[]},{"name":"Nn","managees":[]},{"name":"Vr","managees":[]},{"name":"Auvvo","managees":[]},{"name":"Bg","managees":[]},{"name":"Bch","managees":[<employee#278>,<employee#279>,<employee#280>,<employee#281>]},{"name":"Zk","managees":[]},{"name":"Bifvwnfxqut","managees":[]},{"name":"Cdcallerz","managees":[]},{"name":"X","managees":[]},{"name":"Ex","managees":[]},{"name":"Ajzbcjnu","managees":[]},{"name":"Abceeducefc","managees":[]},{"name":"Cdphyhyvma","managees":[]},{"name":"Qcalllc","managees":[]},{"name":"Evvjzmgpw","managees":[]},{"name":"Vu","managees":[]},{"name":"Pdcq","managees":[]},{"name":"Fvxaw","managees":[]},{"name":"J","managees":[<employee#282>,<employee#283>,<employee#284>,<employee#285>,<employee#286>]},{"name":"Xnt","managees":[]},{"name":"Krjoceca","managees":[]},{"name":"Cac","managees":[]},{"name":"Bwcd","managees":[]},{"name":"P","managees":[]},{"name":"Sprotpro","managees":[]},{"name":"Eh","managees":[]},{"name":"Zet","managees":[]},{"name":"Dw","managees":[]},{"name":"Buwdlgvdmc","managees":[]},{"name":"Brojue","managees":[]},{"name":"And","managees":[]},{"name":"Edqphq","managees":[]},{"name":"Sc","managees":[]},{"name":"Azsjryrbm","managees":[]},{"name":"Cp","managees":[]},{"name":"Bcon","managees":[]},{"name":"Ebb","managees":[]},{"name":"Wcfbeqwad","managees":[]},{"name":"Qaaxu","managees":[]},{"name":"Atkw","managees":[]},{"name":"L","managees":[]},{"name":"Asgp","managees":[]},{"name":"Dbdy","managees":[]},{"name":"Zcal","managees":[]},{"name":"Baui","managees":[]},{"name":"Asfo","managees":[]},{"name":"Wjagnyskue","managees":[]},{"name":"Dakrpebyr","managees":[]},{"name":"Cfwejcixvl","managees":[]},{"name":"Pwbz","managees":[]},{"name":"Yzc","managees":[]},{"name":"Kz","managees":[]},{"name":"Bcal","managees":[]},{"name":"Dkey","managees":[<employee#287>,<employee#288>,<employee#289>]},{"name":"Zgnmijn","managees":[]},{"name":"Eeycn","managees":[]},{"name":"Dypy","managees":[]},{"name":"Xcifs","managees":[]},{"name":"Smqsibrfj","managees":[]},{"name":"Qnuf","managees":[<employee#290>,<employee#291>,<employee#292>,<employee#293>]},{"name":"Wtypelca","managees":[]},{"name":"Oyzlp","managees":[<employee#294>,<employee#295>,<employee#296>,<employee#297>,<employee#298>,<employee#299>,<employee#300>,<employee#301>,<employee#302>,<employee#303>]},{"name":"Ccjgegywx","managees":[]},{"name":"F","managees":[]},{"name":"Xg","managees":[]},{"name":"Np","managees":[]},{"name":"Lnzqubwckib","managees":[]},{"name":"Rxea","managees":[]},{"name":"Wrdnvpfgjgw","managees":[]},{"name":"Ksvyarxw","managees":[<employee#304>,<employee#305>,<employee#306>]},{"name":"Yt","managees":[]},{"name":"Bgwsqc","managees":[]},{"name":"Mwhgqighlxd","managees":[]},{"name":"Ur","managees":[]},{"name":"Bnxwi","managees":[]},{"name":"Yti","managees":[]},{"name":"Dxcofkqa","managees":[]},{"name":"Clengthdjhe","managees":[]},{"name":"Ename","managees":[]},{"name":"Tdca","managees":[<employee#307>,<employee#308>,<employee#309>]},{"name":"Hjjdzhhxe","managees":[]},{"name":"Bargume","managees":[]},{"name":"Bihz","managees":[]},{"name":"Kowr","managees":[]},{"name":"Wxwyz","managees":[]},{"name":"Ciohyo","managees":[]},{"name":"Muaq","managees":[]},{"name":"Ea","managees":[]},{"name":"Qcmrwsy","managees":[]},{"name":"Fn","managees":[]},{"name":"Wf","managees":[]},{"name":"Uenzgcte","managees":[]},{"name":"Gkbmyae","managees":[]},{"name":"Ghli","managees":[]},{"name":"Xxc","managees":[<employee#310>,<employee#311>,<employee#312>,<employee#313>]},{"name":"Edfac","managees":[]},{"name":"Bdc","managees":[]},{"name":"Xrdxfkmaa","managees":[<employee#314>,<employee#315>,<employee#316>,<employee#317>,<employee#318>,<employee#319>,<employee#320>,<employee#321>]},{"name":"Wfgrsezxju","managees":[]},{"name":"Iwv","managees":[]},{"name":"Eren","managees":[]},{"name":"Cprototypeg","managees":[]},{"name":"Ju","managees":[]},{"name":"Azl","managees":[]},{"name":"Mecwcx","managees":[]},{"name":"Jxdebcfix","managees":[]},{"name":"Eyg","managees":[<employee#322>]},{"name":"Flaayqxvwmv","managees":[]},{"name":"Rndacaller","managees":[]},{"name":"Urototdcons","managees":[]},{"name":"Uj","managees":[]},{"name":"Bnascyvtn","managees":[]},{"name":"Iedzoqxw","managees":[]},{"name":"Gbcm","managees":[]},{"name":"Wdzrw","managees":[]},{"name":"Eqhiwjtehv","managees":[]},{"name":"Bydexb","managees":[<employee#323>,<employee#324>,<employee#325>,<employee#326>]},{"name":"Oapply","managees":[]},{"name":"Vxtw","managees":[]},{"name":"Gp","managees":[]},{"name":"Gebscbp","managees":[<employee#327>,<employee#328>,<employee#329>,<employee#330>]},{"name":"Wtluy","managees":[]},{"name":"Dca","managees":[]},{"name":"Edcforbo","managees":[]},{"name":"Dasi","managees":[]},{"name":"Efg","managees":[]},{"name":"Bws","managees":[]},{"name":"Hkucaal","managees":[]},{"name":"Amwislj","managees":[]},{"name":"Bfkeyaargu","managees":[<employee#331>,<employee#332>]},{"name":"Rvknkuehnl","managees":[]},{"name":"Dqc","managees":[]},{"name":"Krke","managees":[]},{"name":"Bt","managees":[]},{"name":"Bcallerx","managees":[]},{"name":"Axcgvp","managees":[]},{"name":"Awbd","managees":[]},{"name":"Eigtksfzt","managees":[]},{"name":"Tjd","managees":[]},{"name":"Cy","managees":[]},{"name":"Faefysp","managees":[]},{"name":"Kzec","managees":[<employee#333>,<employee#334>,<employee#335>]},{"name":"Lkey","managees":[]},{"name":"Qolocqbknp","managees":[<employee#336>,<employee#337>,<employee#338>,<employee#339>]},{"name":"Bzj","managees":[]},{"name":"Hbi","managees":[]},{"name":"Pad","managees":[]},{"name":"Jxrdocuyyc","managees":[]},{"name":"Ii","managees":[]},{"name":"Ejdunblb","managees":[]},{"name":"Dbvtqzwhp","managees":[]},{"name":"T","managees":[]},{"name":"Dzqpzwkmw","managees":[]},{"name":"Hykentsb","managees":[]},{"name":"Ndxacya","managees":[]},{"name":"Zbs","managees":[]},{"name":"Axctffe","managees":[]},{"name":"Elzu","managees":[]},{"name":"Ecowh","managees":[]},{"name":"Ehtojqohwm","managees":[<employee#340>,<employee#341>,<employee#342>,<employee#343>,<employee#344>,<employee#345>,<employee#346>,<employee#347>,<employee#348>]},{"name":"Bkfdfskzqy","managees":[<employee#349>,<employee#350>,<employee#351>,<employee#352>,<employee#353>,<employee#354>]},{"name":"Exuzxw","managees":[]},{"name":"Cda","managees":[]},{"name":"Oototypalla","managees":[]},{"name":"Fdgc","managees":[]},{"name":"Ullzfzy","managees":[]},{"name":"Wqihvggn","managees":[]},{"name":"Bsuuqwlppzn","managees":[]},{"name":"Awhgwg","managees":[]},{"name":"Ccevvyam","managees":[]},{"name":"Eu","managees":[<employee#355>]},{"name":"Sydcb","managees":[]},{"name":"Reaydbixxdm","managees":[]},{"name":"Cjep","managees":[]},{"name":"Xx","managees":[]},{"name":"Eqjcbre","managees":[]},{"name":"Vvtpg","managees":[]},{"name":"Ewyzhgjcg","managees":[]},{"name":"Cqayonv","managees":[]},{"name":"Hulsoxkxf","managees":[]},{"name":"Cjme","managees":[<employee#356>]},{"name":"Zlength","managees":[]},{"name":"Dcallercons","managees":[]},{"name":"Ebbel","managees":[]},{"name":"Wmrdeomk","managees":[]},{"name":"Hfn","managees":[]},{"name":"Eqsm","managees":[<employee#357>,<employee#358>,<employee#359>,<employee#360>,<employee#361>,<employee#362>,<employee#363>,<employee#364>,<employee#365>,<employee#366>,<employee#367>,<employee#368>]},{"name":"Bwmv","managees":[]},{"name":"Ew","managees":[]},{"name":"Href","managees":[]},{"name":"Jxk","managees":[]},{"name":"Wohgpp","managees":[]},{"name":"Cbzrwlfg","managees":[]},{"name":"Yluamxus","managees":[]},{"name":"Ay","managees":[]},{"name":"Efsnfxwi","managees":[<employee#369>]},{"name":"Zieokajmxlc","managees":[]},{"name":"Wcallerrg","managees":[]},{"name":"Veqo","managees":[]},{"name":"Njqpkk","managees":[]},{"name":"Crkev","managees":[]},{"name":"Idbrowkg","managees":[]},{"name":"Bp","managees":[]},{"name":"Jkwvindsp","managees":[]},{"name":"Addzbcu","managees":[]},{"name":"Zgmjk","managees":[]},{"name":"Dbdlmuww","managees":[]},{"name":"Aca","managees":[]},{"name":"Ko","managees":[]},{"name":"Stujkjqfdr","managees":[]},{"name":"Eielycallin","managees":[]}]}
// • {"employee":[{"name":"B","managees":[<employee#1>,<employee#2>,<employee#3>,<employee#4>]},{"name":"O","managees":[<employee#5>]},{"name":"Ygj","managees":[<employee#6>,<employee#7>,<employee#8>,<employee#9>,<employee#10>,<employee#11>,<employee#12>,<employee#13>,<employee#14>,<employee#15>,<employee#16>]},{"name":"A","managees":[<employee#17>,<employee#18>,<employee#19>,<employee#20>,<employee#21>,<employee#22>,<employee#23>,<employee#24>]},{"name":"Tekosah","managees":[]},{"name":"Eo","managees":[]},{"name":"D","managees":[<employee#25>,<employee#26>]},{"name":"Pcd","managees":[]},{"name":"Psxnyq","managees":[<employee#27>,<employee#28>,<employee#29>,<employee#30>,<employee#31>,<employee#32>,<employee#33>,<employee#34>,<employee#35>,<employee#36>,<employee#37>,<employee#38>]},{"name":"Jcihvitolm","managees":[]},{"name":"Dwyvj","managees":[<employee#39>,<employee#40>,<employee#41>,<employee#42>,<employee#43>,<employee#44>,<employee#45>,<employee#46>,<employee#47>,<employee#48>]},{"name":"Cnapplyzec","managees":[]},{"name":"Z","managees":[<employee#49>,<employee#50>,<employee#51>,<employee#52>,<employee#53>,<employee#54>,<employee#55>,<employee#56>,<employee#57>,<employee#58>,<employee#59>,<employee#60>]},{"name":"Xuja","managees":[<employee#61>,<employee#62>,<employee#63>,<employee#64>,<employee#65>,<employee#66>,<employee#67>,<employee#68>]},{"name":"Zap","managees":[]},{"name":"Aref","managees":[<employee#69>,<employee#70>,<employee#71>]},{"name":"Glength","managees":[]},{"name":"Bl","managees":[]},{"name":"Ottgbqiviif","managees":[]},{"name":"Lfsentsmnam","managees":[]},{"name":"S","managees":[<employee#72>,<employee#73>,<employee#74>,<employee#75>]},{"name":"War","managees":[]},{"name":"Sknwqzbk","managees":[]},{"name":"Bxk","managees":[]},{"name":"Ehytojh","managees":[<employee#76>,<employee#77>,<employee#78>,<employee#79>,<employee#80>,<employee#81>]},{"name":"Ahxugtx","managees":[]},{"name":"Cy","managees":[<employee#82>,<employee#83>,<employee#84>,<employee#85>,<employee#86>,<employee#87>,<employee#88>,<employee#89>,<employee#90>]},{"name":"Xm","managees":[]},{"name":"Obqc","managees":[]},{"name":"Bref","managees":[]},{"name":"Zkboyttx","managees":[]},{"name":"Xrrpjzsbiqk","managees":[]},{"name":"Zzetyk","managees":[]},{"name":"Dbindajkbap","managees":[<employee#91>,<employee#92>,<employee#93>,<employee#94>]},{"name":"Cnzlkapc","managees":[]},{"name":"Kkipee","managees":[<employee#95>]},{"name":"Uyohmvfazet","managees":[]},{"name":"Wfnn","managees":[]},{"name":"Vink","managees":[]},{"name":"Se","managees":[<employee#96>,<employee#97>,<employee#98>,<employee#99>,<employee#100>,<employee#101>,<employee#102>,<employee#103>]},{"name":"Kvds","managees":[<employee#104>,<employee#105>,<employee#106>]},{"name":"Gjakdq","managees":[]},{"name":"Nqosdbxzq","managees":[]},{"name":"Xchpngthews","managees":[<employee#107>,<employee#108>,<employee#109>,<employee#110>,<employee#111>,<employee#112>,<employee#113>]},{"name":"Btlwoz","managees":[]},{"name":"Bfvis","managees":[]},{"name":"Bixijubgin","managees":[]},{"name":"Dwy","managees":[]},{"name":"V","managees":[]},{"name":"Ecallfctot","managees":[]},{"name":"Zadqxldet","managees":[]},{"name":"Zmlrrgmpt","managees":[<employee#114>,<employee#115>,<employee#116>,<employee#117>,<employee#118>,<employee#119>,<employee#120>,<employee#121>,<employee#122>,<employee#123>,<employee#124>]},{"name":"Dsslavra","managees":[]},{"name":"Xzna","managees":[]},{"name":"Chi","managees":[]},{"name":"Cv","managees":[<employee#125>,<employee#126>,<employee#127>,<employee#128>,<employee#129>,<employee#130>,<employee#131>,<employee#132>,<employee#133>,<employee#134>]},{"name":"L","managees":[]},{"name":"Ove","managees":[]},{"name":"Pnhq","managees":[]},{"name":"Trbinnlengt","managees":[<employee#135>,<employee#136>]},{"name":"Abdeqjzn","managees":[]},{"name":"Ykhs","managees":[]},{"name":"Vrg","managees":[]},{"name":"Vapply","managees":[]},{"name":"Ubwxw","managees":[]},{"name":"Iref","managees":[]},{"name":"Qa","managees":[<employee#137>,<employee#138>,<employee#139>]},{"name":"Pqerfgxnf","managees":[]},{"name":"Ey","managees":[<employee#140>,<employee#141>]},{"name":"Lwpy","managees":[]},{"name":"Zufamykx","managees":[]},{"name":"Dguig","managees":[]},{"name":"Wovacieysu","managees":[]},{"name":"Cayohpzxxdh","managees":[<employee#142>,<employee#143>,<employee#144>]},{"name":"Cwwvhojkrmi","managees":[]},{"name":"Bizsy","managees":[]},{"name":"Wcleng","managees":[]},{"name":"Pgp","managees":[]},{"name":"Cbind","managees":[<employee#145>,<employee#146>,<employee#147>,<employee#148>]},{"name":"X","managees":[]},{"name":"Bthj","managees":[]},{"name":"W","managees":[<employee#149>,<employee#150>]},{"name":"Cor","managees":[]},{"name":"C","managees":[]},{"name":"Wv","managees":[<employee#151>,<employee#152>,<employee#153>,<employee#154>,<employee#155>,<employee#156>,<employee#157>]},{"name":"Bana","managees":[]},{"name":"Chfqxno","managees":[]},{"name":"Ekey","managees":[]},{"name":"Cvogakjqtq","managees":[]},{"name":"Axe","managees":[]},{"name":"Vxiwicw","managees":[]},{"name":"Vllyhe","managees":[]},{"name":"Vzxybfpacv","managees":[]},{"name":"Nklvpdusk","managees":[<employee#158>,<employee#159>,<employee#160>,<employee#161>,<employee#162>,<employee#163>,<employee#164>,<employee#165>,<employee#166>,<employee#167>]},{"name":"Vrgei","managees":[]},{"name":"De","managees":[]},{"name":"Xxdebzxxs","managees":[]},{"name":"Qqxgaowlp","managees":[]},{"name":"Cun","managees":[]},{"name":"Agn","managees":[]},{"name":"Lyr","managees":[]},{"name":"Icallern","managees":[]},{"name":"Ouvzvm","managees":[<employee#168>,<employee#169>,<employee#170>,<employee#171>,<employee#172>,<employee#173>,<employee#174>,<employee#175>,<employee#176>,<employee#177>,<employee#178>]},{"name":"Nzmul","managees":[]},{"name":"Azdrgtdptic","managees":[]},{"name":"Bkey","managees":[]},{"name":"Agltk","managees":[]},{"name":"Cjqjyf","managees":[]},{"name":"M","managees":[]},{"name":"Aaxr","managees":[]},{"name":"Mt","managees":[]},{"name":"Xrxw","managees":[]},{"name":"Az","managees":[]},{"name":"Bfeqfmv","managees":[]},{"name":"Carg","managees":[]},{"name":"Zxac","managees":[]},{"name":"Kpyc","managees":[]},{"name":"Edm","managees":[]},{"name":"Rapply","managees":[<employee#179>,<employee#180>,<employee#181>,<employee#182>]},{"name":"Apro","managees":[]},{"name":"Kpgivtl","managees":[]},{"name":"Ctl","managees":[<employee#183>,<employee#184>,<employee#185>,<employee#186>,<employee#187>,<employee#188>]},{"name":"Evq","managees":[]},{"name":"Zoskbarm","managees":[]},{"name":"Ym","managees":[]},{"name":"Vz","managees":[]},{"name":"Owl","managees":[]},{"name":"Acall","managees":[<employee#189>]},{"name":"Xf","managees":[]},{"name":"Djyaag","managees":[]},{"name":"Duvbeig","managees":[<employee#190>,<employee#191>,<employee#192>]},{"name":"Aa","managees":[]},{"name":"Pp","managees":[]},{"name":"P","managees":[]},{"name":"Fer","managees":[]},{"name":"Ecce","managees":[]},{"name":"Yawbyfywx","managees":[]},{"name":"Bg","managees":[]},{"name":"Zrisbbisirw","managees":[]},{"name":"Taj","managees":[]},{"name":"Gj","managees":[]},{"name":"Yd","managees":[]},{"name":"Wjnav","managees":[]},{"name":"Aob","managees":[]},{"name":"Cmytccb","managees":[]},{"name":"Rcuyajtyai","managees":[]},{"name":"Movex","managees":[]},{"name":"Yrznmiks","managees":[]},{"name":"Ma","managees":[]},{"name":"Xlzfxsoin","managees":[]},{"name":"Xi","managees":[]},{"name":"N","managees":[<employee#193>,<employee#194>,<employee#195>]},{"name":"Kosmccqt","managees":[]},{"name":"Ry","managees":[]},{"name":"Kroucli","managees":[]},{"name":"Qswbw","managees":[<employee#196>]},{"name":"Nodxli","managees":[]},{"name":"Q","managees":[]},{"name":"Od","managees":[]},{"name":"G","managees":[]},{"name":"Zofgruclc","managees":[]},{"name":"Bapplyc","managees":[]},{"name":"Hgpixtzqanf","managees":[]},{"name":"Ianmght","managees":[]},{"name":"Nce","managees":[]},{"name":"Tpezded","managees":[]},{"name":"Ccxdexalv","managees":[]},{"name":"Ii","managees":[]},{"name":"Ccaller","managees":[]},{"name":"Bgoj","managees":[]},{"name":"Iahfdxh","managees":[]},{"name":"Mbasiumvsse","managees":[]},{"name":"Qxfact","managees":[]},{"name":"Yisctdecd","managees":[]},{"name":"Xme","managees":[<employee#197>]},{"name":"Zdfkppvggqu","managees":[]},{"name":"Bweeegb","managees":[]},{"name":"Wxh","managees":[]},{"name":"Qaapplyh","managees":[]},{"name":"Aname","managees":[]},{"name":"Bca","managees":[]},{"name":"Wvqvfyazf","managees":[]},{"name":"Zvaimvrduf","managees":[]},{"name":"Vap","managees":[]},{"name":"Aduvtxdu","managees":[]},{"name":"Uojkyntfzs","managees":[<employee#198>,<employee#199>,<employee#200>,<employee#201>,<employee#202>,<employee#203>,<employee#204>,<employee#205>,<employee#206>,<employee#207>,<employee#208>,<employee#209>]},{"name":"Ymdvroajds","managees":[]},{"name":"Fyhgw","managees":[]},{"name":"Mrqag","managees":[]},{"name":"Vireeeqnp","managees":[]},{"name":"Chd","managees":[]},{"name":"Xudeh","managees":[]},{"name":"Aldvyt","managees":[]},{"name":"Kquq","managees":[]},{"name":"Xwbd","managees":[]},{"name":"Xcdbdv","managees":[]},{"name":"Ewbhvsgbey","managees":[]},{"name":"Izbwgzyv","managees":[]},{"name":"Zjiuoc","managees":[]},{"name":"Eref","managees":[]},{"name":"Mvovr","managees":[]},{"name":"Cqfyfznsx","managees":[<employee#210>,<employee#211>,<employee#212>,<employee#213>,<employee#214>,<employee#215>,<employee#216>,<employee#217>,<employee#218>,<employee#219>]},{"name":"Aby","managees":[]},{"name":"Zzu","managees":[]},{"name":"Vqlywtd","managees":[<employee#220>,<employee#221>,<employee#222>,<employee#223>,<employee#224>,<employee#225>]},{"name":"Aehvq","managees":[]},{"name":"F","managees":[]},{"name":"Dve","managees":[]},{"name":"Co","managees":[]},{"name":"Fsxwnwbzzj","managees":[]},{"name":"Utqag","managees":[]},{"name":"Hjzpigvnp","managees":[]},{"name":"Jrdpugtuxkf","managees":[]},{"name":"E","managees":[]},{"name":"Ap","managees":[]},{"name":"Zygrw","managees":[]},{"name":"Pjyaqlcsyqc","managees":[]},{"name":"Cnam","managees":[]},{"name":"Alxphwt","managees":[]},{"name":"Skzf","managees":[]},{"name":"Gzytdp","managees":[]},{"name":"Qmcw","managees":[]},{"name":"Zn","managees":[]},{"name":"Arblvioul","managees":[]},{"name":"Mkey","managees":[]},{"name":"Ur","managees":[]}]}
// • {"employee":[{"name":"Dcljyrxwrln","managees":[]}]}
// • {"employee":[{"name":"Elengtht","managees":[<employee#1>,<employee#2>,<employee#3>,<employee#4>,<employee#5>,<employee#6>]},{"name":"Jcweb","managees":[<employee#7>,<employee#8>,<employee#9>,<employee#10>,<employee#11>,<employee#12>,<employee#13>,<employee#14>,<employee#15>,<employee#16>,<employee#17>]},{"name":"Emazrj","managees":[<employee#18>,<employee#19>,<employee#20>]},{"name":"Y","managees":[]},{"name":"W","managees":[<employee#21>,<employee#22>,<employee#23>]},{"name":"Antonlseq","managees":[]},{"name":"Xbwsdappxyv","managees":[<employee#24>,<employee#25>,<employee#26>,<employee#27>,<employee#28>,<employee#29>]},{"name":"Yucokw","managees":[]},{"name":"Ykxmyswrsy","managees":[]},{"name":"Cnzernnyi","managees":[<employee#30>,<employee#31>]},{"name":"C","managees":[<employee#32>,<employee#33>,<employee#34>,<employee#35>,<employee#36>,<employee#37>,<employee#38>,<employee#39>,<employee#40>,<employee#41>]},{"name":"Z","managees":[]},{"name":"Wvjpki","managees":[<employee#42>,<employee#43>]},{"name":"Evdkmhpsy","managees":[]},{"name":"Pahmdybnaz","managees":[]},{"name":"I","managees":[<employee#44>,<employee#45>,<employee#46>,<employee#47>,<employee#48>,<employee#49>]},{"name":"Xwqre","managees":[]},{"name":"Eeykoiu","managees":[<employee#50>,<employee#51>,<employee#52>,<employee#53>,<employee#54>,<employee#55>,<employee#56>]},{"name":"Gbvl","managees":[]},{"name":"Pegc","managees":[<employee#57>,<employee#58>,<employee#59>]},{"name":"Dpcgpf","managees":[<employee#60>]},{"name":"Kegb","managees":[]},{"name":"Aonstrefli","managees":[]},{"name":"Ekydcebuecd","managees":[]},{"name":"Rcywbo","managees":[<employee#61>,<employee#62>,<employee#63>,<employee#64>,<employee#65>,<employee#66>]},{"name":"Yikycbfpeyf","managees":[]},{"name":"Noggfkvhmk","managees":[<employee#67>,<employee#68>,<employee#69>,<employee#70>,<employee#71>,<employee#72>,<employee#73>,<employee#74>,<employee#75>,<employee#76>]},{"name":"F","managees":[]},{"name":"S","managees":[]},{"name":"Xs","managees":[<employee#77>,<employee#78>]},{"name":"Obwzw","managees":[]},{"name":"V","managees":[]},{"name":"Dzam","managees":[]},{"name":"Dcg","managees":[<employee#79>]},{"name":"E","managees":[]},{"name":"Qro","managees":[]},{"name":"Ega","managees":[]},{"name":"Fvxrlrpvzr","managees":[]},{"name":"Vencallerpr","managees":[<employee#80>,<employee#81>,<employee#82>]},{"name":"Xztadl","managees":[]},{"name":"Inwmiurq","managees":[]},{"name":"Tcgb","managees":[]},{"name":"Dpl","managees":[]},{"name":"Hn","managees":[]},{"name":"Cvzgbdhxf","managees":[]},{"name":"Lvenvu","managees":[]},{"name":"Rjiwnaks","managees":[<employee#83>,<employee#84>,<employee#85>,<employee#86>,<employee#87>,<employee#88>]},{"name":"A","managees":[]},{"name":"Xiokv","managees":[<employee#89>,<employee#90>,<employee#91>,<employee#92>,<employee#93>,<employee#94>,<employee#95>]},{"name":"Epwqwnahmm","managees":[]},{"name":"Vjcoa","managees":[<employee#96>,<employee#97>,<employee#98>,<employee#99>,<employee#100>,<employee#101>,<employee#102>,<employee#103>,<employee#104>,<employee#105>,<employee#106>]},{"name":"Lemotywtgfz","managees":[<employee#107>]},{"name":"Ehuwswxdmg","managees":[<employee#108>,<employee#109>,<employee#110>,<employee#111>,<employee#112>,<employee#113>,<employee#114>,<employee#115>,<employee#116>]},{"name":"Wfrct","managees":[]},{"name":"Akyub","managees":[<employee#117>,<employee#118>,<employee#119>]},{"name":"Qx","managees":[]},{"name":"Wsjprabal","managees":[<employee#120>,<employee#121>,<employee#122>,<employee#123>,<employee#124>,<employee#125>,<employee#126>,<employee#127>]},{"name":"Wx","managees":[<employee#128>,<employee#129>,<employee#130>,<employee#131>,<employee#132>,<employee#133>,<employee#134>,<employee#135>,<employee#136>,<employee#137>]},{"name":"Kesklgz","managees":[]},{"name":"Vwa","managees":[<employee#138>,<employee#139>,<employee#140>]},{"name":"Cbb","managees":[<employee#141>,<employee#142>,<employee#143>,<employee#144>]},{"name":"Demhapcpj","managees":[]},{"name":"Yapplytruct","managees":[<employee#145>]},{"name":"Wchljsdes","managees":[]},{"name":"Ucdox","managees":[]},{"name":"P","managees":[]},{"name":"Vbufnrrq","managees":[]},{"name":"D","managees":[]},{"name":"Hmwthosthqr","managees":[]},{"name":"Bapply","managees":[<employee#146>,<employee#147>,<employee#148>]},{"name":"Zjaxhnp","managees":[<employee#149>,<employee#150>]},{"name":"Dy","managees":[]},{"name":"Fotypehobbi","managees":[]},{"name":"Fnzbdyoel","managees":[]},{"name":"Bbbindpey","managees":[]},{"name":"Tmmatv","managees":[]},{"name":"Ohw","managees":[<employee#151>,<employee#152>,<employee#153>,<employee#154>,<employee#155>,<employee#156>,<employee#157>,<employee#158>,<employee#159>,<employee#160>]},{"name":"Hpr","managees":[]},{"name":"X","managees":[]},{"name":"Zeaesqetwyw","managees":[]},{"name":"Avdn","managees":[<employee#161>,<employee#162>,<employee#163>,<employee#164>,<employee#165>,<employee#166>]},{"name":"Lfxfcbvy","managees":[]},{"name":"Cbicecon","managees":[]},{"name":"Yhcsmgaf","managees":[<employee#167>]},{"name":"Ewconstruct","managees":[]},{"name":"Xe","managees":[]},{"name":"Bspbn","managees":[]},{"name":"Gdscal","managees":[<employee#168>,<employee#169>,<employee#170>]},{"name":"Oj","managees":[]},{"name":"Avvjzmd","managees":[]},{"name":"Capply","managees":[]},{"name":"Dltosmtdtdj","managees":[]},{"name":"Opwukgcjaif","managees":[]},{"name":"Bpdhinkp","managees":[<employee#171>,<employee#172>,<employee#173>,<employee#174>,<employee#175>,<employee#176>,<employee#177>,<employee#178>,<employee#179>,<employee#180>]},{"name":"Agwpxt","managees":[<employee#181>,<employee#182>,<employee#183>,<employee#184>,<employee#185>,<employee#186>]},{"name":"Ctuqehedc","managees":[]},{"name":"Mxdxmxbc","managees":[]},{"name":"Dxnuon","managees":[]},{"name":"Dzhykadfyi","managees":[]},{"name":"Eayv","managees":[]},{"name":"Edarguments","managees":[]},{"name":"Aefq","managees":[]},{"name":"Fvf","managees":[]},{"name":"Kligbbp","managees":[]},{"name":"Xzuccbawxre","managees":[]},{"name":"Wyde","managees":[]},{"name":"Coad","managees":[]},{"name":"Idcallerc","managees":[<employee#187>,<employee#188>,<employee#189>,<employee#190>,<employee#191>,<employee#192>,<employee#193>,<employee#194>]},{"name":"Ahgyvkahv","managees":[]},{"name":"Dzhaqkzhieg","managees":[]},{"name":"Qyvh","managees":[]},{"name":"Sca","managees":[]},{"name":"Aa","managees":[]},{"name":"Wmjt","managees":[]},{"name":"Bp","managees":[]},{"name":"Aisuype","managees":[]},{"name":"Izkqyg","managees":[]},{"name":"Jjbdnobe","managees":[]},{"name":"Icsvjx","managees":[]},{"name":"Yeqbc","managees":[]},{"name":"Wnalpy","managees":[]},{"name":"Luaoyqcw","managees":[]},{"name":"Uc","managees":[]},{"name":"Bzddqgvnn","managees":[]},{"name":"Elrofxhvcai","managees":[]},{"name":"Ezodawaj","managees":[]},{"name":"Njvcm","managees":[]},{"name":"Xqhabuggam","managees":[]},{"name":"Mcddmcx","managees":[]},{"name":"Abva","managees":[]},{"name":"Eafxt","managees":[]},{"name":"Bdn","managees":[]},{"name":"Awqwlpdoir","managees":[]},{"name":"Dlkvikf","managees":[]},{"name":"Cxlengthk","managees":[]},{"name":"Wblldcdccs","managees":[]},{"name":"Dplpc","managees":[]},{"name":"Bat","managees":[]},{"name":"Wmo","managees":[]},{"name":"Kbdbitcyil","managees":[]},{"name":"Cr","managees":[]},{"name":"Zcd","managees":[]},{"name":"Ejzbbzyflx","managees":[]},{"name":"O","managees":[]},{"name":"Ytbbedc","managees":[]},{"name":"Gko","managees":[]},{"name":"Btvjri","managees":[]},{"name":"Hd","managees":[]},{"name":"Xntlxugie","managees":[]},{"name":"Koylolmasgl","managees":[]},{"name":"Ehfq","managees":[]},{"name":"Wvqdorp","managees":[]},{"name":"Vzqfyzph","managees":[]},{"name":"Ea","managees":[]},{"name":"Cjuqz","managees":[]},{"name":"Dxe","managees":[]},{"name":"Axzrre","managees":[]},{"name":"Xiler","managees":[]},{"name":"Izcbevdyc","managees":[<employee#195>,<employee#196>,<employee#197>,<employee#198>]},{"name":"Lzcccd","managees":[<employee#199>,<employee#200>,<employee#201>,<employee#202>,<employee#203>,<employee#204>,<employee#205>,<employee#206>,<employee#207>]},{"name":"Jw","managees":[]},{"name":"Upwjlob","managees":[]},{"name":"B","managees":[]},{"name":"Abbepwcamz","managees":[]},{"name":"Pdb","managees":[]},{"name":"Phlmfwo","managees":[]},{"name":"Ciyocqy","managees":[]},{"name":"Dgyb","managees":[]},{"name":"Lkey","managees":[]},{"name":"Qr","managees":[]},{"name":"Cpjdec","managees":[]},{"name":"Bxwhbanhw","managees":[]},{"name":"Dv","managees":[]},{"name":"Gyewhocu","managees":[]},{"name":"Nttlaxkivd","managees":[]},{"name":"K","managees":[]},{"name":"Fgmvge","managees":[]},{"name":"Ylidgkf","managees":[]},{"name":"Gxotgk","managees":[]},{"name":"Wkajo","managees":[]},{"name":"Zmxacdbbz","managees":[]},{"name":"Yfgxndqon","managees":[]},{"name":"Ribyl","managees":[]},{"name":"Ma","managees":[]},{"name":"Cy","managees":[]},{"name":"Vj","managees":[]},{"name":"Xdvfkm","managees":[]},{"name":"Yon","managees":[]},{"name":"Axysjxgrox","managees":[]},{"name":"Cl","managees":[]},{"name":"Loa","managees":[]},{"name":"Etnjnq","managees":[]},{"name":"Ahfl","managees":[]},{"name":"Xnn","managees":[]},{"name":"Ycggtwftj","managees":[]},{"name":"Xxdtfkojl","managees":[]},{"name":"Vyywlq","managees":[<employee#208>,<employee#209>,<employee#210>,<employee#211>,<employee#212>,<employee#213>,<employee#214>]},{"name":"Wdisyj","managees":[]},{"name":"Yzwnaghk","managees":[]},{"name":"Udb","managees":[]},{"name":"Ykadwepxo","managees":[]},{"name":"Df","managees":[]},{"name":"Heipwsme","managees":[]},{"name":"Bvqmt","managees":[]},{"name":"Yvijtfi","managees":[<employee#215>,<employee#216>,<employee#217>,<employee#218>,<employee#219>,<employee#220>,<employee#221>,<employee#222>,<employee#223>,<employee#224>,<employee#225>,<employee#226>]},{"name":"Badaphy","managees":[]},{"name":"Bvrvauaqfn","managees":[]},{"name":"Ezfzixbsxg","managees":[]},{"name":"Eco","managees":[<employee#227>,<employee#228>,<employee#229>,<employee#230>,<employee#231>,<employee#232>,<employee#233>,<employee#234>,<employee#235>,<employee#236>,<employee#237>]},{"name":"Czqx","managees":[]},{"name":"Xuwx","managees":[]},{"name":"Cbi","managees":[]},{"name":"Yysgbo","managees":[]},{"name":"Bl","managees":[]},{"name":"Wcp","managees":[]},{"name":"Dceyho","managees":[]},{"name":"Obahkpcezii","managees":[]},{"name":"Daycobtt","managees":[]},{"name":"Dvhkbktuqd","managees":[]},{"name":"Wlfzyco","managees":[]},{"name":"Xrxmhc","managees":[<employee#238>,<employee#239>,<employee#240>]},{"name":"Kdckbebsvb","managees":[]},{"name":"Zmzcctnq","managees":[]},{"name":"He","managees":[]},{"name":"Xbind","managees":[]},{"name":"Tref","managees":[]},{"name":"Cb","managees":[]},{"name":"Epdyicrnsp","managees":[]},{"name":"Ammkifazdfd","managees":[]},{"name":"Vkpgtwtifgw","managees":[]},{"name":"Vconstructo","managees":[]},{"name":"Ncy","managees":[]},{"name":"De","managees":[]},{"name":"Ch","managees":[]},{"name":"Iooth","managees":[]},{"name":"L","managees":[]},{"name":"Eevvb","managees":[<employee#241>,<employee#242>,<employee#243>,<employee#244>,<employee#245>]},{"name":"Xb","managees":[]},{"name":"Dgzjxjpsmr","managees":[]},{"name":"Ajd","managees":[]},{"name":"Cidqcygezgj","managees":[]},{"name":"Ypvpd","managees":[]},{"name":"Sxgtsjba","managees":[]},{"name":"Bname","managees":[]},{"name":"G","managees":[]},{"name":"Rref","managees":[]}]}
// • …

fc.entityGraph(
  { node: {} },
  {
    node: {
      left: { arity: '0-1', type: 'node', strategy: 'exclusive' },
      right: { arity: '0-1', type: 'node', strategy: 'exclusive' },
    },
  },
  { initialPoolConstraints: { node: { maxLength: 1 } }, noNullPrototype: true },
);
// Note: Generate a binary tree where each node can have left and right children
// - Entity type: node with no data fields (empty object)
// - Relationships: left and right, both with arity '0-1' (optional) and strategy 'exclusive' (prevents shared nodes)
// - Produces: { node: [{ left: <node#1>, right: <node#2> }, { left: undefined, right: undefined }, ...] }
// Characteristics of this configuration:
// - Prevents cycles and creates proper trees (strategy: 'exclusive' ensures each node is referenced at most once) — use 'any' to allow shared nodes and cycles
// - Creates a single tree rooted at the first node (maxLength: 1 in initialPoolConstraints) — remove this to allow multiple disconnected trees
// Examples of generated values:
// • {"node":[{"left":<node#1>,"right":<node#2>},{"left":<node#3>,"right":undefined},{"left":undefined,"right":undefined},{"left":<node#4>,"right":undefined},{"left":undefined,"right":undefined}]}
// • {"node":[{"left":<node#1>,"right":undefined},{"left":<node#2>,"right":undefined},{"left":undefined,"right":undefined}]}
// • {"node":[{"left":<node#1>,"right":<node#2>},{"left":<node#3>,"right":<node#4>},{"left":<node#5>,"right":undefined},{"left":<node#6>,"right":<node#7>},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined}]}
// • {"node":[{"left":<node#1>,"right":<node#2>},{"left":undefined,"right":<node#3>},{"left":<node#4>,"right":<node#5>},{"left":undefined,"right":<node#6>},{"left":<node#7>,"right":<node#8>},{"left":undefined,"right":<node#9>},{"left":undefined,"right":<node#10>},{"left":undefined,"right":<node#11>},{"left":undefined,"right":undefined},{"left":<node#12>,"right":<node#13>},{"left":undefined,"right":<node#14>},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined}]}
// • {"node":[{"left":<node#1>,"right":undefined},{"left":<node#2>,"right":<node#3>},{"left":<node#4>,"right":<node#5>},{"left":<node#6>,"right":undefined},{"left":undefined,"right":<node#7>},{"left":<node#8>,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":<node#9>,"right":undefined},{"left":undefined,"right":undefined}]}
// • …

fc.entityGraph(
  {
    user: { name: fc.stringMatching(/^[A-Z][a-z]*$/) },
    profile: { id: fc.uuid(), pictureUrl: fc.webUrl() },
  },
  {
    user: { profile: { arity: '1', type: 'profile', strategy: 'exclusive' } },
    profile: {},
  },
  {
    initialPoolConstraints: { profile: { maxLength: 0 } },
    unicityConstraints: { user: (value) => value.name, profile: (value) => value.id },
    noNullPrototype: true,
  },
);
// Note: Generate users and profiles where each user has their own unique profile
// - Entity types: user with name field, profile with id and pictureUrl fields
// - Relationship: each user has a required reference to one profile (arity: '1') with strategy 'exclusive' (prevents profile sharing)
// - Produces: { user: [{ name: "Alice", profile: <profile#0> }, ...], profile: [{ id: "...", pictureUrl: "..." }, ...] }
// Characteristics of this configuration:
// - Enforces unique names for users and unique ids for profiles (unicityConstraints)
// - Each user has their own profile (strategy: 'exclusive' prevents sharing)
// - Every profile is linked to exactly one user (maxLength: 0 for profile in initialPoolConstraints) — remove this to allow orphaned profiles
// Examples of generated values:
// • {"user":[{"name":"Yxsjo","profile":<profile#0>},{"name":"Qref","profile":<profile#1>},{"name":"Bwetoconstr","profile":<profile#2>},{"name":"Xdapplre","profile":<profile#3>},{"name":"T","profile":<profile#4>},{"name":"Gvyyweb","profile":<profile#5>},{"name":"Zfc","profile":<profile#6>}],"profile":[{"id":"730c685e-2a5d-7e6f-a04a-573600000015","pictureUrl":"http://66b8u.lq/=b-*("},{"id":"ffffffee-4933-4226-b425-a21c010c74b8","pictureUrl":"http://cl.g5ub.cz/w,3wofVPO"},{"id":"00000009-1f3b-11e3-8000-0010fffffffe","pictureUrl":"http://hpv8sy6abx.zrn////"},{"id":"0000001d-23a1-573b-8b79-428200000001","pictureUrl":"https://fapply6.44hgxyee.hq"},{"id":"a8941440-0010-1000-bfff-fff4c3977393","pictureUrl":"http://9szowr.18vysb0.wzu//9/"},{"id":"215b9fb6-d75a-4c08-a85a-12d5fffffff5","pictureUrl":"http://e8m3v.5.ka///%F4%8F%BF%BD"},{"id":"b83125b1-ffe3-8fff-a0e3-954cb97b27d6","pictureUrl":"http://7yjbg19z.5mryax0ps.tar///"}]}
// • {"user":[{"name":"Kvygifa","profile":<profile#0>},{"name":"Eiefbuwrlkr","profile":<profile#1>},{"name":"Xa","profile":<profile#2>},{"name":"Vblapkfdcd","profile":<profile#3>},{"name":"Ttjkd","profile":<profile#4>},{"name":"Yca","profile":<profile#5>},{"name":"Civsn","profile":<profile#6>},{"name":"Kzacaac","profile":<profile#7>},{"name":"R","profile":<profile#8>}],"profile":[{"id":"fffffff6-90ca-2b24-bfff-fff200000007","pictureUrl":"https://q49uzoei.kfx/"},{"id":"0000000b-df41-50b7-9c19-6eaaffffffe2","pictureUrl":"https://nz34hd5lkz19.qc"},{"id":"79a8c85d-e513-8fe7-8000-000936e18d2f","pictureUrl":"http://zl.qt/!/S/f"},{"id":"a1ff5bc5-0001-1000-8000-000d4dd64ed7","pictureUrl":"https://e-a.ba46d.cd//"},{"id":"00000017-0009-1000-8000-000300000012","pictureUrl":"http://kercvlih7yz1.vx/"},{"id":"0000001e-9f2b-7ae8-9ad1-3c6400000009","pictureUrl":"http://zpw4.an/d/0//B/g/r/p/*/"},{"id":"00000008-25e4-4b4f-8a73-5c169a62d465","pictureUrl":"http://6nameb.nvt/M//"},{"id":"fffffff3-001d-1000-82a0-ea2700000013","pictureUrl":"http://4fs.lu/S"},{"id":"1a8ca8bf-e780-6471-a0f8-523aac3c868e","pictureUrl":"http://h.vo/9B:"}]}
// • {"user":[{"name":"Tel","profile":<profile#0>},{"name":"Xuqvxpfu","profile":<profile#1>},{"name":"Znntafyn","profile":<profile#2>},{"name":"R","profile":<profile#3>},{"name":"A","profile":<profile#4>},{"name":"Bzthzyjpz","profile":<profile#5>}],"profile":[{"id":"4c118f98-0002-1000-a183-f02400000008","pictureUrl":"https://z0.ej/%F0%BC%AA%AB/y///,/M"},{"id":"0000000a-6095-2f38-b096-47ba39f86a9f","pictureUrl":"https://q.fbz"},{"id":"00000005-4aad-6b17-bfff-fff800000019","pictureUrl":"https://if77e.27ah592v1dgb.uh/wPmm*~q"},{"id":"0f4c23a4-08da-2850-bfff-fff6ff7ed467","pictureUrl":"http://h.uw"},{"id":"ffffffe9-0001-1000-bfff-fffdffffffe7","pictureUrl":"https://6.bdsl3.qn/s/%F2%BD%92%99////f/Z/t/"},{"id":"ab672a96-0019-1000-bfff-fffd00000002","pictureUrl":"http://tfnh84jpeabd.owu4x01i.fsp/C////=/o//%F0%B4%84%84"}]}
// • {"user":[{"name":"O","profile":<profile#0>},{"name":"Eengtfrzy","profile":<profile#1>}],"profile":[{"id":"5cda1dab-17d8-4c97-af7b-09cf8ed60ae8","pictureUrl":"https://e9bz0ekc6d0.la//7"},{"id":"00000004-0019-1000-8000-000271fb94e6","pictureUrl":"https://5.jvw"}]}
// • {"user":[{"name":"Ydec","profile":<profile#0>}],"profile":[{"id":"21c8a9ec-fff4-8fff-bfff-fffd00000012","pictureUrl":"http://da37m0ov.na"}]}
// • …

fc.entityGraph(
  {
    employee: { name: fc.stringMatching(/^[A-Z][a-z]*$/) },
    team: { name: fc.stringMatching(/^[A-Z][a-z]*$/) },
  },
  {
    employee: { team: { arity: '1', type: 'team' } },
    team: { members: { arity: 'inverse', type: 'employee', forwardRelationship: 'team' } },
  },
  {
    initialPoolConstraints: { team: { maxLength: 0 } },
    unicityConstraints: { employee: (value) => value.name, team: (value) => value.name },
    noNullPrototype: true,
  },
);
// Note: Generate employees and teams with inverse relationships
// - Entity types: employee with name field, team with name field
// - Forward relationship: each employee has a required reference to one team (arity: '1')
// - Inverse relationship: each team automatically gets a 'members' array containing all employees that reference it
// - Produces: { employee: [{ name: "Alice", team: <team#0> }, ...], team: [{ name: "Engineering", members: [<employee#0>, <employee#2>] }, ...] }
// Characteristics of this configuration:
// - Enforces unique names for both employees and teams (unicityConstraints)
// - The 'members' field is automatically populated based on the 'team' forward relationship - no manual linking required
// - Teams are created on-demand for employees (maxLength: 0 for team in initialPoolConstraints); because employees require a team (arity: '1'), any created team will have at least one employee — remove this to allow teams without employees
// - Inverse relationships are read-only and always contain an array (even if empty)
// Examples of generated values:
// • {"employee":[{"name":"Dfyaiersvxx","team":<team#0>},{"name":"Ekey","team":<team#0>},{"name":"Oxr","team":<team#1>},{"name":"Xnaxya","team":<team#1>}],"team":[{"name":"Arrm","members":[<employee#0>,<employee#1>]},{"name":"Xz","members":[<employee#2>,<employee#3>]}]}
// • {"employee":[{"name":"Ao","team":<team#0>},{"name":"Vname","team":<team#0>},{"name":"Zxflje","team":<team#0>},{"name":"I","team":<team#1>},{"name":"Xk","team":<team#1>},{"name":"Dowb","team":<team#0>},{"name":"Cbdvpbc","team":<team#2>}],"team":[{"name":"B","members":[<employee#0>,<employee#1>,<employee#2>,<employee#5>]},{"name":"Qxoia","members":[<employee#3>,<employee#4>]},{"name":"Qrcc","members":[<employee#6>]}]}
// • {"employee":[{"name":"Wnv","team":<team#0>}],"team":[{"name":"Zab","members":[<employee#0>]}]}
// • {"employee":[{"name":"Cdu","team":<team#0>},{"name":"Zmijmqgeu","team":<team#0>},{"name":"Eco","team":<team#0>},{"name":"Mlfi","team":<team#0>},{"name":"Ccal","team":<team#1>},{"name":"Eexoueb","team":<team#1>},{"name":"Cx","team":<team#1>}],"team":[{"name":"Dijdql","members":[<employee#0>,<employee#1>,<employee#2>,<employee#3>]},{"name":"Ap","members":[<employee#4>,<employee#5>,<employee#6>]}]}
// • {"employee":[{"name":"Eza","team":<team#0>},{"name":"Pf","team":<team#1>},{"name":"E","team":<team#0>},{"name":"Ddb","team":<team#1>},{"name":"Vnt","team":<team#0>},{"name":"Dyjynxewj","team":<team#1>},{"name":"Zxdi","team":<team#1>},{"name":"Cwrczlxmr","team":<team#2>}],"team":[{"name":"Yk","members":[<employee#0>,<employee#2>,<employee#4>]},{"name":"X","members":[<employee#1>,<employee#3>,<employee#5>,<employee#6>]},{"name":"Ff","members":[<employee#7>]}]}
// • …
```

Resources: [API reference](/docs/api/functions/entityGraph).  
Available since 4.5.0.
