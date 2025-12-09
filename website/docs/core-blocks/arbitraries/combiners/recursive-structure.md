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

Resources: [API reference](https://fast-check.dev/api-reference/functions/letrec.html).  
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

Resources: [API reference](https://fast-check.dev/api-reference/functions/memo-1.html).  
Available since 1.16.0.

## entityGraph

Generate recursive structures based on a schema. These structures may came up with cycles, duplicated instances will be linked by reference to the instance. As such compared the `fc.letrec` this helper can provide you with instances referencing themselves in a built-in way.

**Signatures:**

- `fc.entityGraph(arbitraries, relations)`
- `fc.entityGraph(arbitraries, relations, {initialPoolConstraints?,noNullPrototype?})`

**with:**

- `arbitraries` — _declares the shape of each entity, this argument is supposed to be a record with a key being the name of the entity and the value being an object reprensenting the shape of an entity. The value part is similar to the one provided to `fc.record`_
- `relations` — _declares the relations between entities: from one to many to many to many, declare the relations you want as you would have done on a database schema. This argument is supposed to be a record with the key being the name of the entity and the value being an object reprensenting the links between this entity and another one_
  - _with a relation having the structure: `{arity, type}`_
    - `arity` — _`"0-1"` for an optional link to one instance from `type`, `"1"` for a link to one instance from `type`, `"many"` for links leading to multiple instances from `type` exposed via an array_
    - `type` — _one of the keys of `arbitraries`, describes what is the target type for this link_
- `initialPoolConstraints?` — _minimal set of entities being expected in the produced graph_
- `noNullPrototype?` — default: `false` — _only generate objects based on the Object-prototype, do not generate any object with null-prototype_

**Usages:**

```js
fc.entityGraph(
  { node: { id: fc.stringMatching(/^[A-Z][a-z]*$/) } },
  { node: { linkTo: { arity: 'many', type: 'node' } } },
  { initialPoolConstraints: { node: { maxLength: 1 } }, noNullPrototype: true },
);
// TLDR, We define a structure made of nodes possibly linking to zero or many other nodes.
// Full explanation of the requested structure:
// - The arbitraries (first argument) declares one kind of entity called "node". This entity will come with one field called "id" whose value will be produced by the arbitrary "stringMatching".
// - The relations (second argument) declares relations linking entities together. In this precise case, each instance of "node" will have an array field called "linkTo" that will reference zero to many other instances of "node".
// - The constraints (third argument) has been configured in a way to prevent two distinct nodes from being unrelated. By setting enforcing a maxLength of 1 via "initialPoolConstraints" we make sure that any node in the graph will be accessible from the initial node. If we were not providing it we could have two nodes without any links (even indirect ones). The "noNullPrototype" part is just used for convenience: it makes the values visible in this documentation easier to read.
// Extra remarks:
// - We are not enforcing the unicity of ths ids, two distinct instances of "node" may come up with the same value of "id".
// - We could have cycles between nodes, eg.: A -> B -> C -> A.
// - We could have self-referencing nodes, eg.: A -> A.
// Examples of generated values:
// • {"node":[{"id":"Dcuidrapk","linkTo":[<node#0>,<node#1>,<node#2>,<node#3>]},{"id":"Cname","linkTo":[]},{"id":"Btructacc","linkTo":[<node#0>,<node#4>,<node#1>,<node#2>,<node#5>,<node#6>,<node#3>]},{"id":"Re","linkTo":[<node#3>,<node#2>,<node#4>]},{"id":"Bmxcdydm","linkTo":[<node#2>]},{"id":"B","linkTo":[<node#6>,<node#7>,<node#5>,<node#1>,<node#0>,<node#2>,<node#8>,<node#3>,<node#9>]},{"id":"B","linkTo":[<node#4>,<node#5>,<node#10>]},{"id":"Pa","linkTo":[<node#11>,<node#5>,<node#4>]},{"id":"Xwoz","linkTo":[<node#2>,<node#5>]},{"id":"Az","linkTo":[<node#4>,<node#6>,<node#8>,<node#11>,<node#12>,<node#0>,<node#3>,<node#10>]},{"id":"Tcv","linkTo":[<node#12>]},{"id":"Mbi","linkTo":[<node#3>,<node#0>,<node#1>]},{"id":"Csxyjivw","linkTo":[<node#7>,<node#12>,<node#2>,<node#13>]},{"id":"D","linkTo":[<node#8>,<node#5>,<node#13>,<node#9>]}]}
// • {"node":[{"id":"D","linkTo":[<node#1>,<node#0>,<node#2>,<node#3>,<node#4>,<node#5>,<node#6>,<node#7>,<node#8>,<node#9>]},{"id":"Raa","linkTo":[<node#2>,<node#3>,<node#9>,<node#7>,<node#1>,<node#8>,<node#4>,<node#10>,<node#6>]},{"id":"Bpd","linkTo":[]},{"id":"E","linkTo":[<node#2>,<node#6>,<node#5>,<node#0>,<node#7>]},{"id":"Z","linkTo":[<node#4>,<node#0>]},{"id":"Blqn","linkTo":[]},{"id":"Bcloarxxv","linkTo":[<node#8>,<node#9>,<node#2>]},{"id":"A","linkTo":[<node#5>]},{"id":"Rfcal","linkTo":[]},{"id":"Xkqnseioi","linkTo":[<node#7>,<node#3>,<node#6>]},{"id":"Bm","linkTo":[<node#4>,<node#8>,<node#0>,<node#2>,<node#10>,<node#3>]}]}
// • {"node":[{"id":"Evceusae","linkTo":[<node#1>]},{"id":"C","linkTo":[<node#1>,<node#0>]}]}
// • {"node":[{"id":"Enesuu","linkTo":[<node#1>,<node#2>]},{"id":"Fotypkebind","linkTo":[<node#2>]},{"id":"Bd","linkTo":[<node#3>,<node#4>]},{"id":"C","linkTo":[<node#3>,<node#0>]},{"id":"Dqbz","linkTo":[<node#3>]}]}
// • {"node":[{"id":"Dadyyvooano","linkTo":[<node#1>,<node#2>,<node#3>,<node#4>,<node#5>,<node#6>,<node#7>,<node#0>,<node#8>]},{"id":"Bc","linkTo":[<node#0>,<node#3>,<node#9>]},{"id":"Sdlxslvo","linkTo":[]},{"id":"Vwrxgszwln","linkTo":[<node#7>,<node#5>,<node#6>]},{"id":"Cwga","linkTo":[]},{"id":"Xvskvnqha","linkTo":[<node#2>,<node#7>,<node#5>,<node#10>,<node#8>,<node#9>,<node#0>,<node#11>,<node#6>]},{"id":"Ncpndxcc","linkTo":[<node#1>,<node#10>,<node#9>]},{"id":"Zs","linkTo":[<node#5>,<node#6>,<node#1>,<node#0>,<node#8>,<node#4>,<node#11>,<node#10>]},{"id":"Yjepvu","linkTo":[]},{"id":"Uhusmsw","linkTo":[]},{"id":"Vn","linkTo":[<node#5>,<node#3>,<node#11>,<node#12>,<node#6>,<node#0>,<node#10>]},{"id":"Wo","linkTo":[<node#6>,<node#4>,<node#1>,<node#3>,<node#10>,<node#7>]},{"id":"Fwsuaiw","linkTo":[<node#3>,<node#4>,<node#8>,<node#6>,<node#2>,<node#12>,<node#0>,<node#1>,<node#13>]},{"id":"A","linkTo":[<node#2>,<node#13>,<node#0>,<node#5>,<node#11>,<node#6>,<node#1>,<node#12>,<node#8>]}]}
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
  { initialPoolConstraints: { team: { maxLength: 0 } }, noNullPrototype: true },
);
// TLDR, We define a structure made of employees and teams with each employee having a reference to exactly one team.
// Full explanation of the requested structure:
// - The arbitraries (first argument) declares two kinds of entities called "employee" and "team". In this example, both of them come with one field called "name" whose value will be produced by the arbitrary "stringMatching".
// - The relations (second argument) declares relations linking entities together. In our case, each instance of "employee" will have one field called "team" referencing an instance of "team" (also accessible in the team part).
// - The constraints (third argument) allows us to prevent having a team without any employee. We only create a team if really needed by one of the other generated entities.
// Extra remarks:
// - We are not enforcing the unicity of the names, two distinct instances of "employee" or "team" may come up with the same value of "name".
// Examples of generated values:
// • {"employee":[{"name":"F","team":<team#0>}],"team":[{"name":"Wyck"}]}
// • {"employee":[{"name":"Opx","team":<team#0>}],"team":[{"name":"Zeexwzg"}]}
// • {"employee":[{"name":"Wrlhprtz","team":<team#0>},{"name":"Xv","team":<team#0>},{"name":"Href","team":<team#1>},{"name":"Cmfd","team":<team#2>},{"name":"Cntwk","team":<team#1>}],"team":[{"name":"Yklhbeoncbu"},{"name":"Pu"},{"name":"Dvnt"}]}
// • {"employee":[{"name":"Ohkumvvgf","team":<team#0>},{"name":"Epanzcfch","team":<team#0>},{"name":"Bx","team":<team#0>}],"team":[{"name":"Wca"}]}
// • {"employee":[{"name":"Yrxwa","team":<team#0>},{"name":"Una","team":<team#1>},{"name":"Asjpwudy","team":<team#0>},{"name":"Zmjl","team":<team#1>},{"name":"Z","team":<team#0>}],"team":[{"name":"Brefuqap"},{"name":"Azdyprot"}]}
// • …

fc.entityGraph(
  { employee: { name: fc.stringMatching(/^[A-Z][a-z]*$/) } },
  { employee: { manager: { arity: '0-1', type: 'employee' } } },
  { noNullPrototype: true },
);
// TLDR, We define a structure made of employees having zero or one manager.
// Full explanation of the requested structure:
// - The arbitraries (first argument) declares one kind of entity called "employee". The entity comes field called "name" whose value will be produced by the arbitrary "stringMatching".
// - The relations (second argument) declares relations linking entities together. In our case, each instance of "employee" will have zero to one employee. Said differently the employee will have a field called "manager" that could either be undefined or be linking to another instance of employee.
// - The constraints (third argument) is just used for convenience on this example. We use it to produce simpler to read instances on this documentation but usually we don't advise users into enforcing noNullPrototype:true except if they really care of such constraint.
// Extra remarks:
// - We are not enforcing the unicity of the names, two distinct instances of "employee" may come up with the same value of "name".
// - We are not preventing cycles, eg.: A can be managed by B and be managed by A.
// - We are not preventing self-managing, eg.: A can be managed by A.
// - We are not preventing two distinct hierarchies, eg.: A can manage B, C can manage D and there are no links between the two groups.
//   - To enforce a link you could add "initialPoolConstraints: { employee: { maxLength: 1 } }". By doing so, the entityGraph will only generate employees being related to the first employee (as we start the pool with exactly one employee).
// Examples of generated values:
// • {"employee":[{"name":"Bmen","manager":<employee#0>},{"name":"Ehzoquzvu","manager":undefined},{"name":"Qcwlhung","manager":<employee#0>}]}
// • {"employee":[{"name":"Yca","manager":<employee#0>},{"name":"Akey","manager":<employee#0>},{"name":"Vprototype","manager":<employee#1>}]}
// • {"employee":[{"name":"Kguwqbpbxfn","manager":undefined},{"name":"Xddg","manager":<employee#0>},{"name":"Cll","manager":<employee#2>}]}
// • {"employee":[{"name":"Hg","manager":<employee#4>},{"name":"Eua","manager":<employee#2>},{"name":"V","manager":<employee#7>},{"name":"Apg","manager":<employee#5>},{"name":"Dapply","manager":undefined},{"name":"Plhy","manager":<employee#1>},{"name":"Pkey","manager":undefined},{"name":"Wb","manager":<employee#1>},{"name":"Ee","manager":<employee#4>}]}
// • {"employee":[{"name":"Rlgb","manager":<employee#1>},{"name":"Xoxoexfuuk","manager":<employee#2>},{"name":"Bsclvbjlef","manager":undefined}]}
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/entityGraph.html).  
Available since 4.5.0.
