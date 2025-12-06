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
- `fc.entityGraph(arbitraries, relations, {noNullPrototype?})`

**with:**

- `arbitraries` — _declares the shape of each entity, this argument is supposed to be a record with a key being the name of the entity and the value being an object reprensenting the shape of an entity. The value part is similar to the one provided to `fc.record`._
- `relations` — _declares the relations between entities: from one to many to many to many, declare the relations you want as you would have done on a database schema. This argument is supposed to be a record with the key being the name of the entity and the value being an object reprensenting the links between this entity and another one._
- `noNullPrototype?` — default: `false` — _only generate objects based on the Object-prototype, do not generate any object with null-prototype_

**Usages:**

```js
fc.entityGraph(
  { node: { id: fc.stringMatching(/^[A-Z][a-z]*$/) } },
  { node: { linkTo: { arity: 'many', type: 'node' } } },
  { noNullPrototype: true },
);
// TLDR, We define a structure made of nodes possibly linking to zero or many other nodes.
// Full explanation of the requested structure:
// - The arbitraries (first argument) declares one kind of entity called "node". This entity will come with one field called "id" whose value will be produced by the arbitrary "stringMatching".
// - The relations (second argument) declares relations linking entities together. In this precise case, each instance of "node" will have an array field called "linkTo" that will reference zero to many other instances of "node".
// - The constraints (third argument) is just used for convenience on this example. We use it to produce simpler to read instances on this documentation but usually we don't advise users into enforcing noNullPrototype:true except if they really care of such constraint.
// Extra remarks:
// - We are not enforcing the unicity of ths ids, two distinct instances of "node" may come up with the same value of "id".
// - We could have cycles between nodes, eg.: A -> B -> C -> A.
// - We could have self-referencing nodes, eg.: A -> A.
// - We only have one graph, not two with totally disjoint nodes. Starting from [0] you will be able to reach all nodes by traversing the "linkTo" fields.
// Examples of generated values:
// • {"node":[{"id":"Y","linkTo":[<node#0>,<node#1>,<node#2>,<node#3>,<node#4>]},{"id":"C","linkTo":[<node#4>,<node#5>,<node#3>,<node#6>]},{"id":"Xegrxaqdoa","linkTo":[]},{"id":"Ea","linkTo":[]},{"id":"Evmealewe","linkTo":[<node#1>,<node#3>,<node#4>,<node#5>,<node#2>,<node#7>,<node#8>]},{"id":"Bbbwyx","linkTo":[<node#9>,<node#2>,<node#8>,<node#1>,<node#3>,<node#4>,<node#5>]},{"id":"Sfdlfwcp","linkTo":[<node#7>,<node#3>,<node#4>,<node#8>,<node#1>,<node#0>,<node#10>,<node#9>,<node#5>]},{"id":"Kzoo","linkTo":[]},{"id":"Bxrclea","linkTo":[<node#7>,<node#9>,<node#6>]},{"id":"Wl","linkTo":[<node#10>,<node#2>,<node#11>,<node#7>,<node#5>,<node#1>]},{"id":"Esgichtc","linkTo":[<node#3>,<node#2>,<node#9>,<node#5>,<node#1>,<node#7>,<node#10>,<node#0>,<node#12>,<node#13>]},{"id":"C","linkTo":[]},{"id":"Cref","linkTo":[<node#9>,<node#8>,<node#0>,<node#3>,<node#5>,<node#1>,<node#11>,<node#2>,<node#10>,<node#12>]},{"id":"Da","linkTo":[<node#14>,<node#8>,<node#4>]},{"id":"Zvqbezlj","linkTo":[<node#14>]}]}
// • {"node":[{"id":"Re","linkTo":[<node#0>,<node#1>]},{"id":"B","linkTo":[<node#1>,<node#0>]}]}
// • {"node":[{"id":"M","linkTo":[<node#1>,<node#2>]},{"id":"Thxqooo","linkTo":[<node#0>,<node#1>,<node#3>,<node#2>,<node#4>,<node#5>,<node#6>,<node#7>,<node#8>]},{"id":"Hdoacy","linkTo":[<node#8>,<node#9>,<node#10>,<node#6>,<node#5>,<node#7>,<node#4>,<node#0>]},{"id":"Cble","linkTo":[<node#11>,<node#3>,<node#8>,<node#12>,<node#10>,<node#9>,<node#2>,<node#4>,<node#6>,<node#1>]},{"id":"Gkccrqjt","linkTo":[<node#11>,<node#9>,<node#13>,<node#1>,<node#14>,<node#7>,<node#3>,<node#0>,<node#10>,<node#15>]},{"id":"Eqcx","linkTo":[<node#13>,<node#2>,<node#6>]},{"id":"Bukuz","linkTo":[<node#8>,<node#10>]},{"id":"Akchp","linkTo":[<node#1>,<node#4>,<node#6>,<node#15>,<node#2>,<node#0>,<node#10>,<node#13>]},{"id":"Cpmnu","linkTo":[<node#5>,<node#11>,<node#13>,<node#10>,<node#14>,<node#16>,<node#8>,<node#0>,<node#6>,<node#3>]},{"id":"Bezyeo","linkTo":[<node#3>,<node#5>]},{"id":"I","linkTo":[<node#13>,<node#2>,<node#8>,<node#15>,<node#12>,<node#14>,<node#1>,<node#3>]},{"id":"P","linkTo":[<node#7>,<node#14>]},{"id":"Al","linkTo":[]},{"id":"Cc","linkTo":[<node#12>,<node#15>,<node#11>,<node#16>,<node#9>,<node#5>,<node#10>]},{"id":"A","linkTo":[<node#14>,<node#16>]},{"id":"Rzo","linkTo":[<node#17>,<node#10>,<node#9>,<node#8>,<node#2>,<node#14>,<node#1>,<node#5>,<node#3>,<node#12>]},{"id":"Acxmbfyti","linkTo":[<node#1>,<node#14>]},{"id":"Esrfbcgcn","linkTo":[<node#18>,<node#5>,<node#0>,<node#1>,<node#11>,<node#9>,<node#15>,<node#14>,<node#17>,<node#6>]},{"id":"V","linkTo":[<node#18>,<node#5>,<node#13>,<node#14>,<node#16>,<node#2>,<node#0>,<node#3>,<node#15>,<node#1>]}]}
// • {"node":[{"id":"Uxviwizmqx","linkTo":[<node#1>,<node#2>]},{"id":"X","linkTo":[<node#3>,<node#4>]},{"id":"N","linkTo":[<node#1>]},{"id":"Aapply","linkTo":[<node#1>,<node#2>]},{"id":"Ict","linkTo":[<node#2>,<node#4>,<node#0>,<node#3>,<node#1>,<node#5>,<node#6>,<node#7>,<node#8>]},{"id":"Pv","linkTo":[<node#4>]},{"id":"Ppr","linkTo":[<node#7>,<node#1>,<node#5>,<node#3>,<node#9>]},{"id":"A","linkTo":[]},{"id":"Xluws","linkTo":[<node#7>,<node#10>,<node#6>]},{"id":"Bcaller","linkTo":[<node#8>,<node#9>,<node#7>,<node#4>,<node#10>]},{"id":"Zl","linkTo":[<node#6>]}]}
// • {"node":[{"id":"C","linkTo":[<node#1>,<node#2>,<node#0>,<node#3>,<node#4>,<node#5>,<node#6>,<node#7>,<node#8>,<node#9>]},{"id":"Fajogzjh","linkTo":[<node#2>]},{"id":"Bno","linkTo":[<node#2>,<node#3>,<node#4>,<node#7>,<node#6>]},{"id":"Jh","linkTo":[<node#10>,<node#2>,<node#1>,<node#0>,<node#4>,<node#8>,<node#7>,<node#3>]},{"id":"Xmtutmnywb","linkTo":[<node#9>,<node#4>]},{"id":"Wuv","linkTo":[<node#7>,<node#3>,<node#8>,<node#9>,<node#1>,<node#2>,<node#0>]},{"id":"Wajlh","linkTo":[]},{"id":"Eyfumt","linkTo":[<node#4>,<node#7>,<node#9>,<node#10>,<node#8>]},{"id":"A","linkTo":[<node#7>,<node#6>]},{"id":"Ib","linkTo":[<node#0>,<node#4>,<node#5>,<node#10>,<node#3>,<node#9>,<node#2>,<node#7>]},{"id":"D","linkTo":[]}]}
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
  { noNullPrototype: true },
);
// TLDR, We define a structure made of employees and teams with each employee having a reference to exactly one team.
// Full explanation of the requested structure:
// - The arbitraries (first argument) declares two kinds of entities called "employee" and "team". In this example, both of them come with one field called "name" whose value will be produced by the arbitrary "stringMatching".
// - The relations (second argument) declares relations linking entities together. In our case, each instance of "employee" will have one field called "team" referencing an instance of "team" (also accessible in the team part).
// - The constraints (third argument) is just used for convenience on this example. We use it to produce simpler to read instances on this documentation but usually we don't advise users into enforcing noNullPrototype:true except if they really care of such constraint.
// Extra remarks:
// - We are not enforcing the unicity of the names, two distinct instances of "employee" or "team" may come up with the same value of "name".
// - We only create one employee either belonging to the first team or to the second one.
// Examples of generated values:
// • {"employee":[{"name":"B","team":<team#0>}],"team":[{"name":"Ad"}]}
// • {"employee":[{"name":"Dayhdwprsr","team":<team#0>}],"team":[{"name":"Jzcbys"}]}
// • {"employee":[{"name":"Fc","team":<team#0>}],"team":[{"name":"Bam"}]}
// • {"employee":[{"name":"Bjssvcrsrnc","team":<team#1>}],"team":[{"name":"Xe"},{"name":"Esck"}]}
// • {"employee":[{"name":"Oeij","team":<team#1>}],"team":[{"name":"R"},{"name":"Bye"}]}
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
// Examples of generated values:
// • {"employee":[{"name":"Crefbina","manager":<employee#0>}]}
// • {"employee":[{"name":"Gkfsye","manager":undefined}]}
// • {"employee":[{"name":"Jzjwdhbec","manager":<employee#0>}]}
// • {"employee":[{"name":"Lw","manager":<employee#1>},{"name":"Buhj","manager":<employee#2>},{"name":"Vav","manager":<employee#0>}]}
// • {"employee":[{"name":"D","manager":undefined}]}
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/entityGraph.html).  
Available since 4.5.0.
