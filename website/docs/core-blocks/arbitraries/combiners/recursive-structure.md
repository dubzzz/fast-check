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
// • 1 to 4 items....64.22%
// • 5 to 9 items....22.84%
// • 10 to 49 items..12.94%
// For size = "medium":
// • 1 to 4 items......51.31%
// • 50 to 99 items....25.22%
// • 10 to 49 items....19.50%
// • 100 to 499 items...3.75%
// • 5 to 9 items.......0.21%
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
// • {"node":[{"id":"U","linkTo":[<node#0>,<node#1>,<node#2>,<node#3>,<node#4>,<node#5>]},{"id":"Axyevdb","linkTo":[]},{"id":"Ejvtpeec","linkTo":[]},{"id":"A","linkTo":[]},{"id":"Ncgefkfr","linkTo":[<node#6>,<node#0>,<node#1>,<node#3>]},{"id":"Tyxhsoc","linkTo":[]},{"id":"Vnz","linkTo":[]}]}
// • {"node":[{"id":"H","linkTo":[]}]}
// • {"node":[{"id":"Cevywnljysq","linkTo":[<node#1>,<node#0>,<node#2>,<node#3>,<node#4>]},{"id":"Onrbrign","linkTo":[<node#2>]},{"id":"Nx","linkTo":[]},{"id":"Eameeu","linkTo":[]},{"id":"Rkey","linkTo":[<node#4>,<node#2>,<node#3>,<node#1>,<node#0>,<node#5>,<node#6>]},{"id":"Mbeaa","linkTo":[]},{"id":"Ddozvihm","linkTo":[]}]}
// • {"node":[{"id":"Ecgcbzzcbd","linkTo":[<node#0>,<node#1>,<node#2>,<node#3>,<node#4>,<node#5>,<node#6>,<node#7>,<node#8>,<node#9>]},{"id":"Ygxidkkv","linkTo":[<node#1>,<node#0>,<node#8>,<node#10>,<node#3>,<node#6>]},{"id":"Gxapplywgub","linkTo":[<node#2>,<node#10>]},{"id":"Ecsjczc","linkTo":[<node#7>]},{"id":"Lhkp","linkTo":[]},{"id":"Kloxsyzb","linkTo":[<node#4>,<node#5>]},{"id":"Byzx","linkTo":[<node#9>,<node#11>,<node#10>,<node#4>]},{"id":"Irzmchov","linkTo":[<node#4>,<node#3>,<node#11>,<node#2>,<node#0>,<node#12>,<node#9>,<node#10>]},{"id":"Bgbxmr","linkTo":[<node#0>,<node#1>,<node#11>]},{"id":"Al","linkTo":[<node#8>,<node#4>]},{"id":"Lxf","linkTo":[]},{"id":"Xhwrfvdqx","linkTo":[]},{"id":"Nozg","linkTo":[<node#13>,<node#2>]},{"id":"A","linkTo":[]}]}
// • {"node":[{"id":"Qkth","linkTo":[]}]}
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
// • {"employee":[{"name":"Ciejftqz","team":<team#0>},{"name":"Vwsf","team":<team#1>},{"name":"Dhiiii","team":<team#1>},{"name":"Wbtlak","team":<team#2>}],"team":[{"name":"Yr"},{"name":"Wyw"},{"name":"B"}]}
// • {"employee":[{"name":"Oje","team":<team#0>}],"team":[{"name":"Lb"}]}
// • {"employee":[{"name":"Hcvzvs","team":<team#0>},{"name":"Bfc","team":<team#0>}],"team":[{"name":"Gba"}]}
// • {"employee":[{"name":"Sgtyrmeezy","team":<team#0>}],"team":[{"name":"Aqmwxgmvji"}]}
// • {"employee":[{"name":"Dbzerca","team":<team#0>},{"name":"Bbi","team":<team#0>},{"name":"Z","team":<team#1>}],"team":[{"name":"Cwrbgdeya"},{"name":"Ctedshkaze"}]}
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
// • {"employee":[{"name":"Cfsyne","manager":<employee#1>},{"name":"Wnbindsa","manager":<employee#3>},{"name":"Wrahauo","manager":<employee#7>},{"name":"Baxecxd","manager":<employee#5>},{"name":"Afi","manager":undefined},{"name":"V","manager":<employee#7>},{"name":"Dbvtvathub","manager":<employee#8>},{"name":"Aen","manager":<employee#9>},{"name":"Lrdqcahqse","manager":<employee#10>},{"name":"Cqbhx","manager":undefined},{"name":"A","manager":undefined}]}
// • {"employee":[{"name":"Twa","manager":undefined},{"name":"Cdquvj","manager":<employee#2>},{"name":"Dargumentse","manager":<employee#3>},{"name":"Dprototypea","manager":<employee#4>},{"name":"Ad","manager":<employee#5>},{"name":"Fhtweblfg","manager":undefined}]}
// • {"employee":[{"name":"Vatc","manager":<employee#2>},{"name":"Te","manager":<employee#2>},{"name":"Atrxfewow","manager":<employee#3>},{"name":"Brjaoava","manager":<employee#5>},{"name":"Lwhlpliuwxw","manager":<employee#6>},{"name":"Jy","manager":<employee#7>},{"name":"Fw","manager":<employee#7>},{"name":"Iuanc","manager":<employee#8>},{"name":"Q","manager":undefined}]}
// • {"employee":[{"name":"Ka","manager":<employee#1>},{"name":"Qvkdl","manager":<employee#2>},{"name":"Ecaller","manager":<employee#3>},{"name":"Ba","manager":<employee#4>},{"name":"Y","manager":undefined}]}
// • {"employee":[{"name":"Dzxy","manager":<employee#9>},{"name":"Hlrmmqngc","manager":<employee#3>},{"name":"Barguments","manager":<employee#9>},{"name":"Ca","manager":<employee#5>},{"name":"Oqbe","manager":<employee#8>},{"name":"R","manager":undefined},{"name":"Ptzmwkoku","manager":undefined},{"name":"Ae","manager":<employee#9>},{"name":"Minjzfebgy","manager":<employee#9>},{"name":"Mapply","manager":<employee#10>},{"name":"W","manager":<employee#11>},{"name":"M","manager":undefined}]}
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
// • {"employee":[{"name":"V","managees":[<employee#1>,<employee#2>,<employee#3>,<employee#4>,<employee#5>]},{"name":"Rssrkyxgnvs","managees":[<employee#6>,<employee#7>,<employee#8>,<employee#9>,<employee#10>,<employee#11>]},{"name":"Af","managees":[<employee#12>,<employee#13>,<employee#14>]},{"name":"Wnvsorluunf","managees":[<employee#15>,<employee#16>,<employee#17>]},{"name":"Zkbnieit","managees":[]},{"name":"K","managees":[<employee#18>,<employee#19>,<employee#20>]},{"name":"T","managees":[<employee#21>,<employee#22>,<employee#23>,<employee#24>]},{"name":"Efmbc","managees":[]},{"name":"U","managees":[]},{"name":"R","managees":[]},{"name":"Cyhbswaazca","managees":[]},{"name":"Xb","managees":[]},{"name":"Wargumen","managees":[<employee#25>,<employee#26>]},{"name":"Vbinpsb","managees":[<employee#27>,<employee#28>,<employee#29>,<employee#30>]},{"name":"Vu","managees":[]},{"name":"Giconstr","managees":[<employee#31>]},{"name":"Dpngoovohfn","managees":[]},{"name":"Vux","managees":[]},{"name":"Hf","managees":[<employee#32>,<employee#33>,<employee#34>]},{"name":"B","managees":[]},{"name":"Zomteoti","managees":[<employee#35>,<employee#36>,<employee#37>,<employee#38>,<employee#39>]},{"name":"Lpro","managees":[]},{"name":"Odwynuhugoq","managees":[<employee#40>]},{"name":"Ddfpokynsg","managees":[]},{"name":"Ynfh","managees":[<employee#41>,<employee#42>,<employee#43>,<employee#44>]},{"name":"Ra","managees":[]},{"name":"Vexkdc","managees":[<employee#45>,<employee#46>,<employee#47>]},{"name":"Etiylxgapti","managees":[]},{"name":"Oecugzhwp","managees":[<employee#48>,<employee#49>,<employee#50>,<employee#51>,<employee#52>,<employee#53>,<employee#54>,<employee#55>]},{"name":"D","managees":[]},{"name":"X","managees":[]},{"name":"Xt","managees":[]},{"name":"Bbind","managees":[]},{"name":"Qqxy","managees":[]},{"name":"Act","managees":[]},{"name":"Ddflxfmg","managees":[]},{"name":"Zwkuipchzd","managees":[]},{"name":"Bdbynwqez","managees":[<employee#56>,<employee#57>,<employee#58>,<employee#59>,<employee#60>,<employee#61>,<employee#62>,<employee#63>]},{"name":"Rsiv","managees":[]},{"name":"Ljxssw","managees":[]},{"name":"Cwvlsrz","managees":[]},{"name":"Cnvxpkgnc","managees":[]},{"name":"Flkkkjvhcv","managees":[<employee#64>,<employee#65>]},{"name":"Vpkeydjleng","managees":[<employee#66>,<employee#67>]},{"name":"Emmz","managees":[]},{"name":"Ddkzlomfwa","managees":[<employee#68>,<employee#69>,<employee#70>,<employee#71>,<employee#72>,<employee#73>,<employee#74>,<employee#75>,<employee#76>,<employee#77>]},{"name":"Dhef","managees":[]},{"name":"Barguments","managees":[<employee#78>,<employee#79>,<employee#80>,<employee#81>,<employee#82>]},{"name":"Ybind","managees":[<employee#83>,<employee#84>,<employee#85>,<employee#86>,<employee#87>,<employee#88>,<employee#89>,<employee#90>,<employee#91>,<employee#92>]},{"name":"A","managees":[]},{"name":"Ka","managees":[]},{"name":"Vccpjacbj","managees":[]},{"name":"Oczmoyapnc","managees":[]},{"name":"Na","managees":[]},{"name":"Huixx","managees":[]},{"name":"Qeaa","managees":[]},{"name":"Xe","managees":[]},{"name":"Et","managees":[<employee#93>,<employee#94>,<employee#95>]},{"name":"Apvatda","managees":[]},{"name":"Jcallerd","managees":[]},{"name":"Bef","managees":[]},{"name":"Xwcqdywdeg","managees":[]},{"name":"Inomfaisi","managees":[]},{"name":"Ewev","managees":[]},{"name":"Mtctnnxn","managees":[]},{"name":"Bejryck","managees":[<employee#96>]},{"name":"Zxna","managees":[]},{"name":"Feqa","managees":[]},{"name":"Sevrwlz","managees":[<employee#97>,<employee#98>,<employee#99>,<employee#100>,<employee#101>,<employee#102>,<employee#103>,<employee#104>]},{"name":"Ayarguments","managees":[]},{"name":"Bkey","managees":[]},{"name":"Ah","managees":[]},{"name":"Fopb","managees":[]},{"name":"Vwneawz","managees":[]},{"name":"Ve","managees":[]},{"name":"Zca","managees":[]},{"name":"Wprotot","managees":[]},{"name":"Y","managees":[<employee#105>,<employee#106>,<employee#107>,<employee#108>,<employee#109>,<employee#110>]},{"name":"Bxiuihee","managees":[<employee#111>,<employee#112>,<employee#113>,<employee#114>,<employee#115>]},{"name":"Rp","managees":[]},{"name":"Weuilvsjckz","managees":[]},{"name":"Ndkze","managees":[]},{"name":"Lsrkdk","managees":[]},{"name":"Cp","managees":[]},{"name":"Aipb","managees":[<employee#116>,<employee#117>,<employee#118>,<employee#119>,<employee#120>]},{"name":"Gcg","managees":[]},{"name":"Iref","managees":[]},{"name":"Rfty","managees":[]},{"name":"Dkaaw","managees":[]},{"name":"Cvw","managees":[]},{"name":"Gkzoz","managees":[]},{"name":"Xkbu","managees":[]},{"name":"W","managees":[]},{"name":"Eoqh","managees":[]},{"name":"Vrif","managees":[]},{"name":"Wwlfk","managees":[]},{"name":"Vtezjcdzycb","managees":[<employee#121>,<employee#122>,<employee#123>,<employee#124>,<employee#125>,<employee#126>,<employee#127>]},{"name":"Clzeg","managees":[]},{"name":"C","managees":[]},{"name":"Esorkqze","managees":[]},{"name":"Bxvwoigyy","managees":[]},{"name":"Gw","managees":[]},{"name":"Bm","managees":[]},{"name":"Ycal","managees":[]},{"name":"Scjplx","managees":[]},{"name":"Xx","managees":[]},{"name":"Klcvzmzcyio","managees":[]},{"name":"Fr","managees":[]},{"name":"E","managees":[]},{"name":"Nionk","managees":[]},{"name":"Feefvl","managees":[]},{"name":"Dig","managees":[]},{"name":"Zngtprototy","managees":[]},{"name":"Lxat","managees":[]},{"name":"Clqqhatifq","managees":[]},{"name":"Ekxifsh","managees":[]},{"name":"Xaxzujmxvn","managees":[]},{"name":"Yd","managees":[]},{"name":"Xyi","managees":[]},{"name":"Bls","managees":[]},{"name":"Vbbwk","managees":[]},{"name":"Brywcalle","managees":[]},{"name":"Zpxfkte","managees":[]},{"name":"Nyy","managees":[]},{"name":"Db","managees":[]},{"name":"Vme","managees":[]},{"name":"Ano","managees":[]},{"name":"Cdg","managees":[]}]}
// • {"employee":[{"name":"X","managees":[<employee#1>,<employee#2>,<employee#3>,<employee#4>,<employee#5>,<employee#6>,<employee#7>,<employee#8>]},{"name":"Peuymdd","managees":[<employee#9>,<employee#10>,<employee#11>,<employee#12>,<employee#13>,<employee#14>,<employee#15>]},{"name":"Wvhhegy","managees":[<employee#16>,<employee#17>,<employee#18>,<employee#19>,<employee#20>,<employee#21>,<employee#22>,<employee#23>]},{"name":"Bbind","managees":[]},{"name":"Sgxfldmajg","managees":[<employee#24>,<employee#25>,<employee#26>]},{"name":"Pgxuqz","managees":[<employee#27>,<employee#28>,<employee#29>]},{"name":"Efcallercal","managees":[<employee#30>,<employee#31>,<employee#32>,<employee#33>,<employee#34>]},{"name":"Yedv","managees":[<employee#35>,<employee#36>,<employee#37>,<employee#38>]},{"name":"Y","managees":[<employee#39>,<employee#40>,<employee#41>,<employee#42>,<employee#43>]},{"name":"Wzudhrotxv","managees":[]},{"name":"Drnam","managees":[<employee#44>,<employee#45>,<employee#46>]},{"name":"Wccz","managees":[]},{"name":"Ar","managees":[<employee#47>,<employee#48>]},{"name":"Ipwvolh","managees":[<employee#49>,<employee#50>,<employee#51>,<employee#52>,<employee#53>,<employee#54>]},{"name":"I","managees":[<employee#55>,<employee#56>]},{"name":"V","managees":[]},{"name":"Are","managees":[]},{"name":"Dfnsevbcr","managees":[<employee#57>,<employee#58>,<employee#59>,<employee#60>,<employee#61>,<employee#62>,<employee#63>,<employee#64>,<employee#65>]},{"name":"Jmdyh","managees":[]},{"name":"Cqheohyy","managees":[]},{"name":"Dwn","managees":[<employee#66>,<employee#67>,<employee#68>]},{"name":"Mj","managees":[]},{"name":"Uexhbx","managees":[<employee#69>,<employee#70>,<employee#71>]},{"name":"Ehigqoqhb","managees":[]},{"name":"Bh","managees":[]},{"name":"Kdce","managees":[<employee#72>,<employee#73>]},{"name":"Bmpg","managees":[]},{"name":"Vlengthilen","managees":[]},{"name":"Mconstructo","managees":[]},{"name":"J","managees":[]},{"name":"Kbw","managees":[]},{"name":"Skrcjvxhe","managees":[<employee#74>,<employee#75>,<employee#76>,<employee#77>]},{"name":"Enk","managees":[]},{"name":"Ykdonasc","managees":[]},{"name":"Wq","managees":[]},{"name":"Abmxdbxzddb","managees":[]},{"name":"Ep","managees":[<employee#78>,<employee#79>,<employee#80>,<employee#81>,<employee#82>,<employee#83>,<employee#84>,<employee#85>,<employee#86>]},{"name":"Vszz","managees":[]},{"name":"Cd","managees":[]},{"name":"Ac","managees":[]},{"name":"Z","managees":[<employee#87>,<employee#88>,<employee#89>,<employee#90>,<employee#91>,<employee#92>,<employee#93>]},{"name":"B","managees":[<employee#94>,<employee#95>]},{"name":"Ahqupu","managees":[<employee#96>,<employee#97>,<employee#98>]},{"name":"Zddbxqplpr","managees":[]},{"name":"Vwnflqqdyju","managees":[]},{"name":"Dozvj","managees":[]},{"name":"Edqu","managees":[]},{"name":"P","managees":[]},{"name":"Qapply","managees":[<employee#99>]},{"name":"Cyqxvnwhgi","managees":[]},{"name":"Aa","managees":[]},{"name":"Bocqrzq","managees":[<employee#100>,<employee#101>,<employee#102>,<employee#103>,<employee#104>,<employee#105>,<employee#106>,<employee#107>,<employee#108>]},{"name":"Blutezax","managees":[<employee#109>,<employee#110>,<employee#111>]},{"name":"Rd","managees":[]},{"name":"Qrnzf","managees":[]},{"name":"Pkcwxdcq","managees":[<employee#112>]},{"name":"Ysvefe","managees":[]},{"name":"Yncqxzzhtg","managees":[]},{"name":"Mscz","managees":[]},{"name":"Bk","managees":[<employee#113>,<employee#114>]},{"name":"Ap","managees":[]},{"name":"Xpro","managees":[<employee#115>,<employee#116>,<employee#117>,<employee#118>,<employee#119>,<employee#120>,<employee#121>,<employee#122>,<employee#123>,<employee#124>]},{"name":"Adiwa","managees":[<employee#125>,<employee#126>,<employee#127>,<employee#128>,<employee#129>,<employee#130>]},{"name":"Axxcdlboyua","managees":[]},{"name":"Bnhbo","managees":[]},{"name":"Darguments","managees":[<employee#131>,<employee#132>,<employee#133>,<employee#134>]},{"name":"E","managees":[]},{"name":"L","managees":[]},{"name":"Vler","managees":[<employee#135>,<employee#136>,<employee#137>,<employee#138>,<employee#139>,<employee#140>,<employee#141>,<employee#142>,<employee#143>,<employee#144>]},{"name":"Cengt","managees":[]},{"name":"Yrxbkmupat","managees":[]},{"name":"Vgafwkfkpol","managees":[]},{"name":"D","managees":[]},{"name":"Rktdxft","managees":[]},{"name":"Ergi","managees":[]},{"name":"Sd","managees":[]},{"name":"Bqllzrt","managees":[]},{"name":"Oagwenseyr","managees":[]},{"name":"Cry","managees":[]},{"name":"Dsv","managees":[]},{"name":"Yqyrogjk","managees":[<employee#145>,<employee#146>,<employee#147>,<employee#148>]},{"name":"Aaven","managees":[]},{"name":"Ut","managees":[]},{"name":"Cdjpfb","managees":[]},{"name":"Ryda","managees":[<employee#149>,<employee#150>,<employee#151>,<employee#152>,<employee#153>,<employee#154>,<employee#155>,<employee#156>,<employee#157>,<employee#158>]},{"name":"Evc","managees":[]},{"name":"Zkvvrxnp","managees":[]},{"name":"Wtzc","managees":[]},{"name":"Bs","managees":[<employee#159>]},{"name":"Exn","managees":[<employee#160>,<employee#161>,<employee#162>]},{"name":"Eargumen","managees":[]},{"name":"Lzbv","managees":[]},{"name":"Vikeeze","managees":[<employee#163>,<employee#164>]},{"name":"Ckeylen","managees":[<employee#165>]},{"name":"Cxza","managees":[]},{"name":"Hbgbrb","managees":[]},{"name":"Ckey","managees":[]},{"name":"Idkwb","managees":[]},{"name":"Zcallappl","managees":[]},{"name":"Nrxe","managees":[<employee#166>,<employee#167>]},{"name":"Lnbua","managees":[]},{"name":"Oxx","managees":[]},{"name":"S","managees":[]},{"name":"W","managees":[]},{"name":"Dfctghvhk","managees":[]},{"name":"Frqe","managees":[]},{"name":"We","managees":[]},{"name":"Qsmxniz","managees":[]},{"name":"Ruwchikk","managees":[]},{"name":"Zygkzpil","managees":[]},{"name":"Downame","managees":[]},{"name":"Xxoqdkjczq","managees":[]},{"name":"Azg","managees":[]},{"name":"Nupndfbu","managees":[<employee#168>,<employee#169>,<employee#170>,<employee#171>,<employee#172>,<employee#173>,<employee#174>]},{"name":"Cozlllerbca","managees":[]},{"name":"Hecexfaeia","managees":[]},{"name":"Nijf","managees":[]},{"name":"Wbind","managees":[]},{"name":"Jkey","managees":[]},{"name":"Nnyeirsnea","managees":[]},{"name":"Sbindxec","managees":[]},{"name":"Yuln","managees":[]},{"name":"Bbunqsxvngi","managees":[]},{"name":"Zkv","managees":[]},{"name":"Xgeui","managees":[<employee#175>,<employee#176>,<employee#177>,<employee#178>,<employee#179>,<employee#180>,<employee#181>]},{"name":"Vyruttm","managees":[]},{"name":"Bbevlsuio","managees":[<employee#182>,<employee#183>,<employee#184>,<employee#185>,<employee#186>,<employee#187>]},{"name":"Eruza","managees":[]},{"name":"Kqbi","managees":[]},{"name":"Ruvbca","managees":[]},{"name":"Cycywadtnbi","managees":[]},{"name":"Zjhn","managees":[]},{"name":"Csvkhd","managees":[]},{"name":"Znyr","managees":[]},{"name":"Osoogdg","managees":[]},{"name":"Chqggpy","managees":[<employee#188>,<employee#189>,<employee#190>,<employee#191>,<employee#192>,<employee#193>,<employee#194>,<employee#195>,<employee#196>]},{"name":"Aiqajzvud","managees":[]},{"name":"Cincallwzey","managees":[]},{"name":"Froamapp","managees":[]},{"name":"Cbi","managees":[]},{"name":"Ix","managees":[<employee#197>,<employee#198>,<employee#199>,<employee#200>,<employee#201>,<employee#202>]},{"name":"Dmmsd","managees":[<employee#203>,<employee#204>,<employee#205>,<employee#206>,<employee#207>,<employee#208>,<employee#209>]},{"name":"Bwtpsoz","managees":[]},{"name":"Ztf","managees":[]},{"name":"Acaller","managees":[<employee#210>]},{"name":"Cwlvmoerou","managees":[]},{"name":"And","managees":[]},{"name":"Gqhlnc","managees":[]},{"name":"Crrm","managees":[]},{"name":"C","managees":[]},{"name":"Onfdea","managees":[]},{"name":"Breb","managees":[]},{"name":"Awacnn","managees":[<employee#211>,<employee#212>,<employee#213>,<employee#214>]},{"name":"Ecd","managees":[]},{"name":"Fa","managees":[]},{"name":"Azy","managees":[]},{"name":"O","managees":[]},{"name":"Tnsussvk","managees":[]},{"name":"Eplfecxlp","managees":[]},{"name":"Wg","managees":[<employee#215>,<employee#216>,<employee#217>,<employee#218>]},{"name":"Scbqz","managees":[]},{"name":"Ekey","managees":[<employee#219>]},{"name":"Nninhmb","managees":[]},{"name":"Eref","managees":[]},{"name":"Eapply","managees":[]},{"name":"Xissq","managees":[]},{"name":"Xjqgutkgcdh","managees":[]},{"name":"Jxohzpc","managees":[]},{"name":"Zname","managees":[]},{"name":"Segas","managees":[]},{"name":"Dn","managees":[]},{"name":"Enqbc","managees":[]},{"name":"Vrcobacdrrn","managees":[<employee#220>,<employee#221>,<employee#222>]},{"name":"Fk","managees":[<employee#223>,<employee#224>]},{"name":"Wt","managees":[<employee#225>,<employee#226>,<employee#227>,<employee#228>,<employee#229>]},{"name":"Cscevmwhqg","managees":[<employee#230>,<employee#231>,<employee#232>,<employee#233>,<employee#234>]},{"name":"Xmp","managees":[]},{"name":"Rl","managees":[]},{"name":"Arnznwv","managees":[]},{"name":"Yfnxokalep","managees":[]},{"name":"Enrjh","managees":[]},{"name":"Skuam","managees":[<employee#235>,<employee#236>,<employee#237>,<employee#238>,<employee#239>,<employee#240>,<employee#241>,<employee#242>]},{"name":"Cdar","managees":[]},{"name":"Gdv","managees":[]},{"name":"Xzheucrfgx","managees":[]},{"name":"Khy","managees":[]},{"name":"Eknwbnh","managees":[]},{"name":"Yif","managees":[]},{"name":"Wwzpz","managees":[]},{"name":"Bo","managees":[]},{"name":"Mw","managees":[]},{"name":"Yzc","managees":[<employee#243>,<employee#244>,<employee#245>,<employee#246>,<employee#247>,<employee#248>,<employee#249>,<employee#250>,<employee#251>,<employee#252>]},{"name":"Ecgebbve","managees":[]},{"name":"Zc","managees":[]},{"name":"Ailsbmjoq","managees":[]},{"name":"Cf","managees":[]},{"name":"War","managees":[]},{"name":"Audjrxkamg","managees":[]},{"name":"Fzregqhaxro","managees":[]},{"name":"Gtezaizhwm","managees":[]},{"name":"Abcwo","managees":[]},{"name":"Xzn","managees":[<employee#253>,<employee#254>]},{"name":"Cnbyblawjck","managees":[]},{"name":"Vqjurawckc","managees":[]},{"name":"Ae","managees":[]},{"name":"Yencna","managees":[]},{"name":"Tzcc","managees":[]},{"name":"Dbv","managees":[]},{"name":"Wzwoh","managees":[]},{"name":"Vqme","managees":[]},{"name":"Wqed","managees":[]},{"name":"Ptwa","managees":[]},{"name":"Renc","managees":[]},{"name":"Eytkaql","managees":[]},{"name":"Ecobomxt","managees":[]},{"name":"Dapply","managees":[<employee#255>,<employee#256>,<employee#257>,<employee#258>,<employee#259>,<employee#260>]},{"name":"Fwhd","managees":[]},{"name":"Yxw","managees":[]},{"name":"Newytkdl","managees":[]},{"name":"Jaf","managees":[]},{"name":"Xvq","managees":[<employee#261>,<employee#262>]},{"name":"Tti","managees":[]},{"name":"Agb","managees":[]},{"name":"Eja","managees":[]},{"name":"Nbdkeyzcon","managees":[]},{"name":"Ra","managees":[]},{"name":"Aanbind","managees":[]},{"name":"Chcddv","managees":[]},{"name":"Lpumenthc","managees":[]},{"name":"Bevb","managees":[]},{"name":"Jadaudtxyb","managees":[]},{"name":"Vn","managees":[]},{"name":"Bd","managees":[]},{"name":"Wwptbmblz","managees":[]},{"name":"Zuk","managees":[]},{"name":"Aida","managees":[]},{"name":"Ccz","managees":[]},{"name":"Xsd","managees":[<employee#263>,<employee#264>,<employee#265>,<employee#266>,<employee#267>,<employee#268>,<employee#269>,<employee#270>,<employee#271>]},{"name":"Afedfluuosg","managees":[]},{"name":"Tnd","managees":[]},{"name":"Ohmx","managees":[]},{"name":"Hxexxcvr","managees":[]},{"name":"Bbtpopucg","managees":[]},{"name":"Cmfgafwzdca","managees":[]},{"name":"An","managees":[]},{"name":"Cevaqzkn","managees":[]},{"name":"Eky","managees":[]},{"name":"Brrfgq","managees":[]},{"name":"Harguments","managees":[]},{"name":"Aballe","managees":[]},{"name":"Vtp","managees":[]},{"name":"Eayxepv","managees":[]},{"name":"Vcyuyh","managees":[]},{"name":"Cqa","managees":[]},{"name":"Hlokfchje","managees":[]},{"name":"Znamvbxo","managees":[]},{"name":"Oksdhlgarbl","managees":[]},{"name":"Q","managees":[]},{"name":"Bremjaks","managees":[]},{"name":"Fs","managees":[]},{"name":"By","managees":[]},{"name":"Wwuqjcxck","managees":[]},{"name":"Gpzbrl","managees":[]},{"name":"A","managees":[]},{"name":"Caxsaip","managees":[]},{"name":"Yvsfw","managees":[<employee#272>]},{"name":"Zekjxctqjoa","managees":[]},{"name":"Ed","managees":[]},{"name":"Ctjpk","managees":[]},{"name":"Bkvid","managees":[]},{"name":"U","managees":[]},{"name":"Rg","managees":[]},{"name":"Kwszd","managees":[]}]}
// • {"employee":[{"name":"Ydrzlaqmrq","managees":[<employee#1>,<employee#2>,<employee#3>,<employee#4>,<employee#5>,<employee#6>,<employee#7>,<employee#8>,<employee#9>,<employee#10>]},{"name":"Eapplyiaeyp","managees":[<employee#11>,<employee#12>,<employee#13>]},{"name":"Wvxkeycyzyo","managees":[]},{"name":"Byjct","managees":[<employee#14>,<employee#15>,<employee#16>,<employee#17>,<employee#18>,<employee#19>,<employee#20>,<employee#21>,<employee#22>,<employee#23>]},{"name":"Dxhzcgmtq","managees":[<employee#24>,<employee#25>,<employee#26>,<employee#27>,<employee#28>,<employee#29>]},{"name":"De","managees":[<employee#30>]},{"name":"All","managees":[<employee#31>,<employee#32>,<employee#33>]},{"name":"Qfiikqng","managees":[<employee#34>]},{"name":"Yj","managees":[<employee#35>,<employee#36>]},{"name":"Afo","managees":[<employee#37>]},{"name":"Wvjhzsfex","managees":[]},{"name":"Vbufhomgjh","managees":[]},{"name":"Exwb","managees":[]},{"name":"Bre","managees":[<employee#38>,<employee#39>,<employee#40>,<employee#41>]},{"name":"Ehrthuto","managees":[]},{"name":"D","managees":[]},{"name":"Aba","managees":[]},{"name":"Xb","managees":[]},{"name":"Oiazideb","managees":[]},{"name":"Dbindahsbap","managees":[<employee#42>]},{"name":"Ypbioplykzv","managees":[<employee#43>,<employee#44>,<employee#45>,<employee#46>]},{"name":"Mwcw","managees":[<employee#47>,<employee#48>,<employee#49>,<employee#50>]},{"name":"K","managees":[]},{"name":"Ajohm","managees":[]},{"name":"Abiaapvffn","managees":[]},{"name":"Edz","managees":[]},{"name":"Ovfsedc","managees":[]},{"name":"Drdddllxj","managees":[<employee#51>,<employee#52>]},{"name":"Vqodxqvlcpg","managees":[<employee#53>,<employee#54>,<employee#55>,<employee#56>,<employee#57>]},{"name":"Ela","managees":[]},{"name":"Ci","managees":[]},{"name":"Bxjbiqlopw","managees":[]},{"name":"Weagzsutzh","managees":[]},{"name":"Bt","managees":[<employee#58>,<employee#59>,<employee#60>,<employee#61>,<employee#62>,<employee#63>]},{"name":"Bdxdtbdmr","managees":[]},{"name":"Aqts","managees":[<employee#64>]},{"name":"Z","managees":[]},{"name":"Zbhh","managees":[]},{"name":"Cb","managees":[]},{"name":"Wle","managees":[]},{"name":"Que","managees":[<employee#65>]},{"name":"Eyxd","managees":[]},{"name":"Tdqzaogn","managees":[]},{"name":"Dayxvi","managees":[<employee#66>,<employee#67>]},{"name":"Ast","managees":[]},{"name":"Dewwic","managees":[<employee#68>,<employee#69>]},{"name":"Dw","managees":[]},{"name":"Bpsefxftm","managees":[<employee#70>,<employee#71>,<employee#72>,<employee#73>,<employee#74>,<employee#75>]},{"name":"Tew","managees":[<employee#76>,<employee#77>]},{"name":"Ryandbb","managees":[]},{"name":"Oxwfiguns","managees":[<employee#78>,<employee#79>,<employee#80>,<employee#81>,<employee#82>,<employee#83>]},{"name":"Br","managees":[]},{"name":"Opzx","managees":[]},{"name":"Ah","managees":[]},{"name":"Ka","managees":[]},{"name":"Aizyf","managees":[]},{"name":"Qzyry","managees":[]},{"name":"A","managees":[<employee#84>,<employee#85>,<employee#86>,<employee#87>,<employee#88>,<employee#89>,<employee#90>,<employee#91>,<employee#92>,<employee#93>]},{"name":"Yk","managees":[]},{"name":"Lkey","managees":[]},{"name":"Wyb","managees":[]},{"name":"Yhjw","managees":[]},{"name":"Acaller","managees":[]},{"name":"Nsvszjv","managees":[]},{"name":"Augg","managees":[<employee#94>,<employee#95>,<employee#96>,<employee#97>,<employee#98>]},{"name":"Ee","managees":[]},{"name":"Gnmkadfxo","managees":[]},{"name":"Xuct","managees":[<employee#99>,<employee#100>,<employee#101>,<employee#102>,<employee#103>,<employee#104>,<employee#105>]},{"name":"Vca","managees":[]},{"name":"Gsupcji","managees":[<employee#106>,<employee#107>,<employee#108>,<employee#109>,<employee#110>,<employee#111>,<employee#112>,<employee#113>]},{"name":"Sqq","managees":[]},{"name":"Xlyee","managees":[]},{"name":"Bbvijmzt","managees":[<employee#114>,<employee#115>,<employee#116>]},{"name":"Aznameu","managees":[]},{"name":"Dgca","managees":[]},{"name":"Bm","managees":[]},{"name":"Dpftoijzo","managees":[]},{"name":"Ckx","managees":[]},{"name":"Bcjnzrxps","managees":[]},{"name":"Xs","managees":[<employee#117>,<employee#118>,<employee#119>,<employee#120>,<employee#121>,<employee#122>,<employee#123>,<employee#124>,<employee#125>]},{"name":"Wrifomvux","managees":[<employee#126>,<employee#127>,<employee#128>,<employee#129>,<employee#130>]},{"name":"Mnbmcrd","managees":[<employee#131>,<employee#132>,<employee#133>,<employee#134>,<employee#135>,<employee#136>]},{"name":"I","managees":[]},{"name":"X","managees":[]},{"name":"Aprototy","managees":[]},{"name":"Qteo","managees":[]},{"name":"Axra","managees":[]},{"name":"Vxk","managees":[]},{"name":"Hwcyjgbli","managees":[]},{"name":"Pkeyl","managees":[]},{"name":"Cvo","managees":[]},{"name":"Exfwtkjyf","managees":[]},{"name":"Eb","managees":[]},{"name":"Y","managees":[]},{"name":"Edcd","managees":[]},{"name":"Xvlo","managees":[]},{"name":"Abhpv","managees":[]},{"name":"Zsbrhlmk","managees":[<employee#137>,<employee#138>,<employee#139>]},{"name":"Do","managees":[]},{"name":"Bslnwcq","managees":[]},{"name":"Xe","managees":[]},{"name":"Vagn","managees":[]},{"name":"Cia","managees":[]},{"name":"Hi","managees":[<employee#140>,<employee#141>]},{"name":"Xdoepc","managees":[]},{"name":"Zpwkohivnyq","managees":[]},{"name":"Eksnejw","managees":[]},{"name":"O","managees":[]},{"name":"Ygeyhwjdg","managees":[]},{"name":"Q","managees":[<employee#142>,<employee#143>,<employee#144>]},{"name":"Zibiiwtzjgi","managees":[<employee#145>,<employee#146>,<employee#147>]},{"name":"Yu","managees":[]},{"name":"Jlength","managees":[]},{"name":"Wde","managees":[]},{"name":"J","managees":[]},{"name":"Yr","managees":[]},{"name":"Vst","managees":[]},{"name":"Nal","managees":[]},{"name":"Yyzxonxtjae","managees":[]},{"name":"Kscqhtyk","managees":[]},{"name":"R","managees":[]},{"name":"Qwwnx","managees":[]},{"name":"Xqeogfj","managees":[<employee#148>,<employee#149>,<employee#150>,<employee#151>,<employee#152>,<employee#153>,<employee#154>]},{"name":"G","managees":[]},{"name":"Eyo","managees":[<employee#155>]},{"name":"Lcycgyvcgc","managees":[]},{"name":"Anamhp","managees":[]},{"name":"Efeo","managees":[]},{"name":"Ewttde","managees":[<employee#156>,<employee#157>,<employee#158>,<employee#159>,<employee#160>]},{"name":"Elvjcqguoi","managees":[]},{"name":"Yv","managees":[]},{"name":"Ib","managees":[]},{"name":"Bud","managees":[]},{"name":"C","managees":[]},{"name":"Erpb","managees":[]},{"name":"Hdxh","managees":[]},{"name":"Bim","managees":[]},{"name":"Edrqrqi","managees":[]},{"name":"Uypstediwqd","managees":[]},{"name":"Czdkpgqsazv","managees":[]},{"name":"Dgjhzd","managees":[]},{"name":"Ab","managees":[<employee#161>]},{"name":"Ixe","managees":[<employee#162>,<employee#163>,<employee#164>,<employee#165>,<employee#166>,<employee#167>,<employee#168>,<employee#169>,<employee#170>,<employee#171>]},{"name":"Adva","managees":[]},{"name":"Xwzi","managees":[]},{"name":"Xmvrzfz","managees":[]},{"name":"Vap","managees":[]},{"name":"Udlvokn","managees":[]},{"name":"Zke","managees":[]},{"name":"Oyaqgu","managees":[<employee#172>]},{"name":"Xat","managees":[]},{"name":"Tydayc","managees":[]},{"name":"Oxac","managees":[]},{"name":"Ocev","managees":[]},{"name":"Ebvgexzzwz","managees":[]},{"name":"Jjucesonm","managees":[]},{"name":"Vzle","managees":[]},{"name":"Eapply","managees":[]},{"name":"Jcb","managees":[]},{"name":"Dafddk","managees":[<employee#173>,<employee#174>,<employee#175>,<employee#176>,<employee#177>,<employee#178>,<employee#179>,<employee#180>,<employee#181>]},{"name":"Vllbal","managees":[<employee#182>,<employee#183>,<employee#184>,<employee#185>,<employee#186>]},{"name":"Zbtpy","managees":[]},{"name":"Jdutxfskskj","managees":[]},{"name":"Wyrlwqtrszq","managees":[]},{"name":"Isvneoekbxm","managees":[]},{"name":"Exll","managees":[<employee#187>,<employee#188>,<employee#189>]},{"name":"Dsjtsqzrlz","managees":[]},{"name":"Vulvjctp","managees":[]},{"name":"Abvolmraq","managees":[]},{"name":"Cjrojvwmilx","managees":[]},{"name":"Bjyydtvop","managees":[]},{"name":"Yqdfvhgwe","managees":[]},{"name":"Zifnujwbrro","managees":[]},{"name":"Zwapplycall","managees":[]},{"name":"Wupwpkc","managees":[]},{"name":"Dga","managees":[]},{"name":"Sa","managees":[]},{"name":"Scfrqjrvjgv","managees":[]},{"name":"Dgocqotaz","managees":[]},{"name":"Kxemxlrhrre","managees":[]},{"name":"Pusptfmg","managees":[]},{"name":"Xze","managees":[]},{"name":"E","managees":[]},{"name":"Eaapplyr","managees":[]},{"name":"Cwyrrncjmnz","managees":[]},{"name":"Rzrwppwn","managees":[]},{"name":"Xvc","managees":[]},{"name":"Cypeprototy","managees":[]},{"name":"Ie","managees":[]},{"name":"Ozac","managees":[]}]}
// • {"employee":[{"name":"Ww","managees":[<employee#1>]},{"name":"Aakbx","managees":[<employee#2>,<employee#3>,<employee#4>]},{"name":"Vaxtne","managees":[]},{"name":"M","managees":[<employee#5>,<employee#6>,<employee#7>,<employee#8>,<employee#9>,<employee#10>,<employee#11>,<employee#12>,<employee#13>]},{"name":"Ezquxsm","managees":[<employee#14>,<employee#15>,<employee#16>]},{"name":"Dyavhvyzs","managees":[]},{"name":"L","managees":[]},{"name":"Qhz","managees":[]},{"name":"A","managees":[]},{"name":"Cox","managees":[<employee#17>]},{"name":"Wj","managees":[]},{"name":"Zkey","managees":[]},{"name":"Nqcxkloo","managees":[]},{"name":"Bbaqbegbvcy","managees":[<employee#18>,<employee#19>,<employee#20>,<employee#21>,<employee#22>,<employee#23>,<employee#24>,<employee#25>,<employee#26>]},{"name":"Afnibrtzpk","managees":[]},{"name":"Vmy","managees":[]},{"name":"Mlpa","managees":[<employee#27>,<employee#28>,<employee#29>,<employee#30>,<employee#31>,<employee#32>]},{"name":"Rehlodbqm","managees":[]},{"name":"C","managees":[]},{"name":"Ciiwz","managees":[<employee#33>]},{"name":"Twmhmymon","managees":[]},{"name":"Ykey","managees":[<employee#34>,<employee#35>,<employee#36>,<employee#37>,<employee#38>,<employee#39>]},{"name":"Ri","managees":[]},{"name":"Ahcallbca","managees":[]},{"name":"Qhdx","managees":[]},{"name":"Ajbxbsvpeew","managees":[]},{"name":"D","managees":[]},{"name":"P","managees":[]},{"name":"Czrwkjfgi","managees":[<employee#40>,<employee#41>]},{"name":"Cro","managees":[]},{"name":"Aqhe","managees":[]},{"name":"Tkvnx","managees":[<employee#42>,<employee#43>,<employee#44>,<employee#45>,<employee#46>,<employee#47>,<employee#48>,<employee#49>,<employee#50>]},{"name":"Kbzwswdk","managees":[]},{"name":"Zhoptqkao","managees":[]},{"name":"X","managees":[]},{"name":"Xdzg","managees":[]},{"name":"Azhtowbytnf","managees":[]},{"name":"Brk","managees":[]},{"name":"Vzh","managees":[]},{"name":"Cmcekan","managees":[]},{"name":"Decv","managees":[]},{"name":"Sargumedak","managees":[]},{"name":"E","managees":[]},{"name":"B","managees":[]},{"name":"Ndqvhbvnltf","managees":[]},{"name":"Z","managees":[]},{"name":"G","managees":[]},{"name":"Eipwcuuanzg","managees":[]},{"name":"Dbjb","managees":[]},{"name":"W","managees":[]},{"name":"Pv","managees":[]}]}
// • {"employee":[{"name":"Vyoiyr","managees":[<employee#1>,<employee#2>,<employee#3>,<employee#4>,<employee#5>]},{"name":"Bvaqmzk","managees":[<employee#6>,<employee#7>,<employee#8>,<employee#9>,<employee#10>,<employee#11>]},{"name":"Bp","managees":[<employee#12>,<employee#13>,<employee#14>,<employee#15>,<employee#16>]},{"name":"H","managees":[]},{"name":"Cxm","managees":[]},{"name":"Cgw","managees":[<employee#17>,<employee#18>,<employee#19>,<employee#20>,<employee#21>,<employee#22>,<employee#23>,<employee#24>]},{"name":"Ocdv","managees":[]},{"name":"Bknghyxqavn","managees":[<employee#25>,<employee#26>,<employee#27>,<employee#28>,<employee#29>,<employee#30>,<employee#31>]},{"name":"Adg","managees":[<employee#32>,<employee#33>,<employee#34>,<employee#35>,<employee#36>]},{"name":"C","managees":[<employee#37>,<employee#38>,<employee#39>,<employee#40>,<employee#41>]},{"name":"Ak","managees":[<employee#42>,<employee#43>,<employee#44>]},{"name":"Byiwnekgkam","managees":[]},{"name":"Wqeajkqo","managees":[<employee#45>,<employee#46>]},{"name":"Akdj","managees":[]},{"name":"Ebedi","managees":[<employee#47>,<employee#48>,<employee#49>]},{"name":"Earots","managees":[<employee#50>,<employee#51>,<employee#52>,<employee#53>,<employee#54>]},{"name":"W","managees":[<employee#55>,<employee#56>,<employee#57>]},{"name":"Gktnsqts","managees":[<employee#58>]},{"name":"Pkew","managees":[<employee#59>,<employee#60>]},{"name":"Q","managees":[]},{"name":"Yckkoy","managees":[]},{"name":"M","managees":[]},{"name":"An","managees":[]},{"name":"Cmuyiz","managees":[]},{"name":"Rv","managees":[]},{"name":"Kkca","managees":[]},{"name":"Wccyfqdiia","managees":[]},{"name":"Ve","managees":[]},{"name":"Bbr","managees":[]},{"name":"Pdap","managees":[]},{"name":"Dcprat","managees":[]},{"name":"Zdvycdnlix","managees":[]},{"name":"Pemthww","managees":[<employee#61>,<employee#62>,<employee#63>]},{"name":"Pp","managees":[]},{"name":"Aivamc","managees":[]},{"name":"Veev","managees":[]},{"name":"Lgk","managees":[]},{"name":"Msxelseyy","managees":[]},{"name":"Xvpdsgz","managees":[]},{"name":"Zdwrzveacc","managees":[]},{"name":"Eijnxcjbvrr","managees":[<employee#64>,<employee#65>]},{"name":"Zvzimewk","managees":[]},{"name":"Vtlcyzc","managees":[]},{"name":"Qggkw","managees":[]},{"name":"A","managees":[]},{"name":"D","managees":[]},{"name":"Cj","managees":[]},{"name":"Acgkeyxlea","managees":[]},{"name":"Toinkihc","managees":[<employee#66>,<employee#67>,<employee#68>,<employee#69>,<employee#70>,<employee#71>,<employee#72>,<employee#73>,<employee#74>]},{"name":"Abfzo","managees":[]},{"name":"Uiwwamegfca","managees":[]},{"name":"Zca","managees":[]},{"name":"Zu","managees":[]},{"name":"Wbvfck","managees":[]},{"name":"Lrv","managees":[]},{"name":"Wblavxkmsl","managees":[]},{"name":"N","managees":[]},{"name":"Awt","managees":[<employee#75>]},{"name":"Cac","managees":[]},{"name":"Xr","managees":[]},{"name":"Ambpxee","managees":[]},{"name":"Edsu","managees":[]},{"name":"Izdo","managees":[]},{"name":"Ymopyunrkeu","managees":[]},{"name":"Bwhshrpihgk","managees":[<employee#76>,<employee#77>,<employee#78>,<employee#79>,<employee#80>,<employee#81>,<employee#82>,<employee#83>]},{"name":"Jbde","managees":[]},{"name":"Apo","managees":[]},{"name":"Bxbwbnvubfc","managees":[]},{"name":"Zmtrbh","managees":[]},{"name":"Hpr","managees":[<employee#84>,<employee#85>,<employee#86>,<employee#87>,<employee#88>,<employee#89>,<employee#90>]},{"name":"Wre","managees":[]},{"name":"Bn","managees":[]},{"name":"Eekhfudj","managees":[]},{"name":"Xzqee","managees":[]},{"name":"Yro","managees":[]},{"name":"Fyapplyp","managees":[]},{"name":"Zawadyxqlev","managees":[]},{"name":"Mzzb","managees":[]},{"name":"Ahjcrv","managees":[]},{"name":"Zcallerar","managees":[]},{"name":"Xkey","managees":[]},{"name":"T","managees":[]},{"name":"Z","managees":[]},{"name":"Bfqjphnpy","managees":[]},{"name":"Eapply","managees":[]},{"name":"Cxd","managees":[]},{"name":"Blwypno","managees":[]},{"name":"Dhkdyacwxk","managees":[]},{"name":"Yp","managees":[]},{"name":"Cxey","managees":[]},{"name":"Cfzfkjib","managees":[]}]}
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
// • {"user":[{"name":"Lsoql","profile":<profile#0>},{"name":"V","profile":<profile#1>},{"name":"Yntoconstr","profile":<profile#2>},{"name":"Azgavaax","profile":<profile#3>},{"name":"Jvk","profile":<profile#4>},{"name":"Fnec","profile":<profile#5>},{"name":"Opzc","profile":<profile#6>}],"profile":[{"id":"ffffffe1-d4f6-89db-bfff-fffb00000016","pictureUrl":"http://08ki8-j.y.key//5/N/A/i//R"},{"id":"00000011-fff2-8fff-8000-001750b7e558","pictureUrl":"http://7.ezk"},{"id":"63e4ca81-000f-1000-b8c3-e9ee80f7a453","pictureUrl":"http://l.y-4zejhuon.cw"},{"id":"fffffff7-669f-1112-a2a6-4cbf81b77cd0","pictureUrl":"https://4shj.ref/C//A//u/)//F//5"},{"id":"0000001a-0fbf-348b-82b4-3b58fffffff2","pictureUrl":"http://xgu.aa/+//5/W/$////W/"},{"id":"fffffff5-fff2-8fff-8000-001b4c0a7268","pictureUrl":"https://49s.mi"},{"id":"a4c04bbe-fff1-8fff-8700-3da0a06d50f2","pictureUrl":"https://aei5rt9a3cu.ey//u/%F2%AF%90%B7/H//"}]}
// • {"user":[{"name":"Biaglifu","profile":<profile#0>},{"name":"Ldbviaxvaky","profile":<profile#1>},{"name":"Etruct","profile":<profile#2>},{"name":"Zuwtc","profile":<profile#3>},{"name":"Ymdmfi","profile":<profile#4>},{"name":"Druemgxyh","profile":<profile#5>},{"name":"V","profile":<profile#6>},{"name":"D","profile":<profile#7>},{"name":"Wfbozyvfae","profile":<profile#8>}],"profile":[{"id":"f61717d2-1280-8172-b688-aa8d45310b25","pictureUrl":"https://qz1xx5q.za//k/;/g/P"},{"id":"b07d7887-5fd7-5b4c-9ac9-13be92f20c79","pictureUrl":"https://76cfmd9o-ay.ba46d.cd//"},{"id":"00000017-0009-1000-8000-000300000012","pictureUrl":"http://kercvlih7yz1.vx/"},{"id":"0000001e-9f2b-7ae8-9ad1-3c6400000009","pictureUrl":"http://zpw4.an/d/0//B/g/r/p/*/"},{"id":"00000008-25e4-4b4f-8a73-5c169a62d465","pictureUrl":"http://6nameb.nvt/M//"},{"id":"fffffff3-001d-1000-82a0-ea2700000013","pictureUrl":"http://4fs.lu/S"},{"id":"1a8ca8bf-e780-6471-a0f8-523aac3c868e","pictureUrl":"http://h.vo/9B:"},{"id":"00000008-5d58-4f39-8000-000effffffff","pictureUrl":"https://0calld.khtjd8twn.cla/"},{"id":"66b33c8a-001c-1000-bfff-ffeec3dcf4e3","pictureUrl":"https://s3wd.19.ky"}]}
// • {"user":[{"name":"Kpr","profile":<profile#0>},{"name":"Yh","profile":<profile#1>},{"name":"Eortnaylp","profile":<profile#2>},{"name":"A","profile":<profile#3>},{"name":"Thypdgpjgst","profile":<profile#4>},{"name":"Eaiyre","profile":<profile#5>}],"profile":[{"id":"1f1df5af-4f97-823b-85cb-be3dffffffed","pictureUrl":"http://mvauyjp11.ag//*/9/J//w/"},{"id":"0000000a-0017-1000-97b3-eedea40117a3","pictureUrl":"https://mfj.wiw"},{"id":"00000003-fff8-8fff-8000-0016170efcc7","pictureUrl":"https://hm9pc1.jmr//*/"},{"id":"559f6db7-f23f-5db2-bfff-ffe2ffffffe8","pictureUrl":"https://aale4d86e.7.qc"},{"id":"94b18704-000a-1000-8508-81010000001c","pictureUrl":"http://k.lxtn3ystb.mq/Z/t//K/o/v/y//p"},{"id":"e1787553-001d-1000-bfff-fffcfffffff8","pictureUrl":"https://d.fa///o/l"}]}
// • {"user":[{"name":"Wwwljikwkm","profile":<profile#0>},{"name":"Rgruovyzom","profile":<profile#1>}],"profile":[{"id":"c89c3b4a-7e10-55e2-8000-001b997fcc45","pictureUrl":"http://53.70.la//7"},{"id":"00000004-0019-1000-8000-000271fb94e6","pictureUrl":"https://5.jvw"}]}
// • {"user":[{"name":"Ac","profile":<profile#0>}],"profile":[{"id":"21c8a9ec-fff4-8fff-bfff-fffd00000012","pictureUrl":"http://da37m0ov.na"}]}
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
// • {"employee":[{"name":"Atssipmorso","team":<team#0>},{"name":"Xe","team":<team#0>},{"name":"Vxk","team":<team#1>},{"name":"O","team":<team#1>}],"team":[{"name":"Larprototyp","members":[<employee#0>,<employee#1>]},{"name":"Avbdlmgbf","members":[<employee#2>,<employee#3>]}]}
// • {"employee":[{"name":"Zb","team":<team#0>},{"name":"E","team":<team#0>},{"name":"Gjdega","team":<team#0>},{"name":"Vap","team":<team#1>},{"name":"Olbxbvbg","team":<team#1>},{"name":"O","team":<team#0>},{"name":"Qbiae","team":<team#2>}],"team":[{"name":"Bnk","members":[<employee#0>,<employee#1>,<employee#2>,<employee#5>]},{"name":"Bbvl","members":[<employee#3>,<employee#4>]},{"name":"Sqxeyo","members":[<employee#6>]}]}
// • {"employee":[{"name":"Jml","team":<team#0>}],"team":[{"name":"Bcbexnvcbpb","members":[<employee#0>]}]}
// • {"employee":[{"name":"Rin","team":<team#0>},{"name":"Zimgurory","team":<team#0>},{"name":"Rcgxlt","team":<team#0>},{"name":"Tvyp","team":<team#0>},{"name":"Rvxoumu","team":<team#1>},{"name":"Wigou","team":<team#1>},{"name":"Yngtaedgdan","team":<team#1>}],"team":[{"name":"Xie","members":[<employee#0>,<employee#1>,<employee#2>,<employee#3>]},{"name":"Lbnbfhziv","members":[<employee#4>,<employee#5>,<employee#6>]}]}
// • {"employee":[{"name":"Zap","team":<team#0>},{"name":"Fa","team":<team#1>},{"name":"Csyvyew","team":<team#0>},{"name":"Nyx","team":<team#1>},{"name":"Bx","team":<team#0>},{"name":"Ivx","team":<team#1>},{"name":"Kwognxkt","team":<team#1>},{"name":"Fui","team":<team#2>}],"team":[{"name":"A","members":[<employee#0>,<employee#2>,<employee#4>]},{"name":"Pntswvnaa","members":[<employee#1>,<employee#3>,<employee#5>,<employee#6>]},{"name":"Wfeuutvdzs","members":[<employee#7>]}]}
// • …
```

Resources: [API reference](/docs/api/functions/entityGraph).  
Available since 4.5.0.
