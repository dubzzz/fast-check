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
  {
    initialPoolConstraints: { node: { maxLength: 1 } },
    unicityConstraints: { node: (value) => value.id },
    noNullPrototype: true,
  },
);
// TLDR, We define a graph made of nodes being all connected together. Each node link to zero or many other nodes.
// Extra remarks:
// - We are not enforcing the unicity of ths ids, two distinct instances of "node" may come up with the same value of "id".
// - We can have cycles between nodes, eg.: A -> B -> C -> A.
// ↳ But, we could have prevented cycles by adding the strategy: successor or exclusive on the definition for linkTo.
// - We can have self-referencing nodes, eg.: A -> A.
// ↳ But, we could have prevented self-referencing by adding the strategy: successor or exclusive on the definition for linkTo.
// - We have all nodes being connected together, eg.: every node in the structure is accessible from node 0 by following some linkTo links.
// ↳ But, we could have prevented that by not specifying maxLength:1 on initialPoolConstraints. We would have been able to have two or more unrelated graphs.
// Examples of generated values:
// • {"node":[{"id":"B","linkTo":[<node#0>,<node#1>,<node#2>,<node#3>,<node#4>,<node#5>]},{"id":"C","linkTo":[]},{"id":"Vbwsojvt","linkTo":[]},{"id":"Zcaller","linkTo":[]},{"id":"Btcc","linkTo":[<node#6>,<node#0>,<node#1>,<node#3>]},{"id":"Sp","linkTo":[]},{"id":"Scziyybceal","linkTo":[<node#3>]}]}
// • {"node":[{"id":"H","linkTo":[]}]}
// • {"node":[{"id":"Aqjb","linkTo":[<node#1>,<node#0>,<node#2>,<node#3>,<node#4>]},{"id":"Dref","linkTo":[<node#2>]},{"id":"Ekni","linkTo":[]},{"id":"W","linkTo":[]},{"id":"Hjxh","linkTo":[<node#4>,<node#2>,<node#3>,<node#1>,<node#0>,<node#5>,<node#6>]},{"id":"Ca","linkTo":[<node#1>,<node#0>,<node#2>,<node#6>,<node#5>,<node#4>,<node#7>,<node#3>,<node#8>,<node#9>]},{"id":"Mpfvbtkd","linkTo":[<node#0>,<node#5>,<node#9>,<node#10>,<node#11>,<node#7>,<node#8>]},{"id":"Wqy","linkTo":[<node#0>,<node#11>,<node#8>]},{"id":"Pc","linkTo":[<node#7>,<node#10>,<node#0>,<node#6>]},{"id":"Alw","linkTo":[<node#8>]},{"id":"Dfwaq","linkTo":[<node#1>]},{"id":"Cr","linkTo":[<node#2>,<node#10>,<node#5>,<node#6>,<node#8>,<node#12>,<node#7>,<node#13>,<node#1>]},{"id":"Accs","linkTo":[<node#11>,<node#6>,<node#10>,<node#7>,<node#5>,<node#3>,<node#12>,<node#2>,<node#14>]},{"id":"Acw","linkTo":[<node#14>,<node#10>,<node#9>]},{"id":"Xpacy","linkTo":[<node#15>,<node#12>,<node#8>,<node#2>,<node#0>,<node#14>,<node#1>,<node#13>,<node#5>]},{"id":"Uprototype","linkTo":[<node#1>,<node#3>,<node#5>,<node#6>,<node#0>,<node#10>,<node#2>,<node#13>,<node#16>]},{"id":"Qba","linkTo":[<node#4>]}]}
// • {"node":[{"id":"Jaarg","linkTo":[<node#0>,<node#1>,<node#2>,<node#3>,<node#4>,<node#5>,<node#6>,<node#7>,<node#8>,<node#9>]},{"id":"Zwrwdlxbow","linkTo":[<node#1>,<node#0>,<node#8>,<node#10>,<node#3>,<node#6>]},{"id":"Eine","linkTo":[<node#2>,<node#10>]},{"id":"Wqwsnmyccd","linkTo":[<node#7>]},{"id":"Yca","linkTo":[]},{"id":"Ikppt","linkTo":[<node#4>,<node#5>]},{"id":"Dkey","linkTo":[<node#9>,<node#11>,<node#10>,<node#4>]},{"id":"Atvhhvui","linkTo":[<node#4>,<node#3>,<node#11>,<node#2>,<node#0>,<node#12>,<node#9>,<node#10>]},{"id":"Sdakhdb","linkTo":[<node#0>,<node#1>,<node#11>]},{"id":"Sgbxmr","linkTo":[<node#8>,<node#4>]},{"id":"Al","linkTo":[<node#11>]},{"id":"Lxf","linkTo":[<node#10>,<node#13>,<node#2>]},{"id":"Xhwrfvdqx","linkTo":[<node#3>,<node#11>,<node#9>,<node#4>,<node#8>,<node#10>,<node#7>]},{"id":"Nozg","linkTo":[<node#10>]}]}
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
// TLDR, We define a structure made of employees and teams with each employee having a reference to exactly one team.
// Extra remarks:
// - We are not enforcing the unicity of the names, two distinct instances of "employee" or "team" may come up with the same value of "name".
// - We only have teams that have at least one matching employee.
// ↳ But, we could have prevented it, by dropping the maxLength:0 constraint defined for team via initialPoolConstraints. By dropping it we would have allowed teams not being referenced by any employee.
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
// TLDR, We define a structure made of employees having zero or one manager without any cycle.
// Extra remarks:
// - We are not enforcing the unicity of the names, two distinct instances of "employee" may come up with the same value of "name".
// - We are preventing cycles, eg.: A can be managed by B and be managed by A.
// ↳ We could have allowed cycles by switching the strategy to 'any'.
// - We are preventing self-managing, eg.: A can be managed by A.
// ↳ We could have allowed cycles by switching the strategy to 'any'.
// - We are not preventing two distinct hierarchies, eg.: A can manage B, C can manage D and there are no links between the two groups.
// ↳ To enforce a link you could add "initialPoolConstraints: { employee: { maxLength: 1 } }". By doing so, the entityGraph will only generate employees being related to the first employee (as we start the pool with exactly one employee), so all employees (except the first one) will be managers of the first employee (transitively).
// Examples of generated values:
// • {"employee":[{"name":"Cfsyne","manager":<employee#1>},{"name":"Wnbindsa","manager":<employee#3>},{"name":"Wrahauo","manager":<employee#7>},{"name":"Baxecxd","manager":<employee#5>},{"name":"Afi","manager":undefined},{"name":"V","manager":<employee#7>},{"name":"Dbvtvathub","manager":<employee#8>},{"name":"Aen","manager":<employee#9>},{"name":"Lrdqcahqse","manager":<employee#10>},{"name":"Cqbhx","manager":undefined},{"name":"A","manager":undefined}]}
// • {"employee":[{"name":"Twa","manager":undefined},{"name":"Cdquvj","manager":<employee#2>},{"name":"Dargumentse","manager":<employee#3>},{"name":"Dprototypea","manager":<employee#4>},{"name":"Ad","manager":<employee#5>},{"name":"Fhtweblfg","manager":undefined}]}
// • {"employee":[{"name":"Vatc","manager":<employee#2>},{"name":"Te","manager":<employee#2>},{"name":"Atrxfewow","manager":<employee#3>},{"name":"Brjaoava","manager":<employee#5>},{"name":"Lwhlpliuwxw","manager":<employee#6>},{"name":"Jy","manager":<employee#7>},{"name":"Fw","manager":<employee#7>},{"name":"Iuanc","manager":<employee#8>},{"name":"Q","manager":undefined}]}
// • {"employee":[{"name":"Ka","manager":<employee#1>},{"name":"Qvkdl","manager":<employee#2>},{"name":"Ecaller","manager":<employee#3>},{"name":"Ba","manager":<employee#4>},{"name":"Y","manager":undefined}]}
// • {"employee":[{"name":"Dzxy","manager":<employee#9>},{"name":"Hlrmmqngc","manager":<employee#3>},{"name":"Barguments","manager":<employee#9>},{"name":"Ca","manager":<employee#5>},{"name":"Oqbe","manager":<employee#8>},{"name":"R","manager":undefined},{"name":"Ptzmwkoku","manager":undefined},{"name":"Ae","manager":<employee#9>},{"name":"Minjzfebgy","manager":<employee#9>},{"name":"Mapply","manager":<employee#10>},{"name":"W","manager":<employee#11>},{"name":"M","manager":undefined}]}
// • …

fc.entityGraph(
  { node: {} },
  {
    node: {
      left: { arity: '0-1', type: 'node', strategy: 'exclusive' },
      right: { arity: '0-1', type: 'node', strategy: 'exclusive' },
    },
  },
  { noNullPrototype: true },
);
// TLDR, We define multiple binary trees made of nodes. Each node will have zero or two children. Nodes will be referenced at most once because of the 'exclusive' strategy.
// Extra remarks:
// - We only define trees, there are no cycles.
// ↳ We could have allowed cycles (not trees anymore) by changing the strategy to 'successor' or 'any'.
// - We may have multiple totally unrelated trees.
// ↳ We could have restricted ourselves to a single one by adding initialPoolConstraints:{node:{maxLength:1}} to our configuration.
// Examples of generated values:
// • {"node":[{"left":<node#4>,"right":undefined},{"left":<node#5>,"right":<node#6>},{"left":<node#7>,"right":<node#8>},{"left":<node#9>,"right":<node#10>},{"left":<node#11>,"right":<node#12>},{"left":<node#13>,"right":undefined},{"left":<node#14>,"right":undefined},{"left":<node#15>,"right":<node#16>},{"left":undefined,"right":<node#17>},{"left":<node#18>,"right":undefined},{"left":<node#19>,"right":<node#20>},{"left":<node#21>,"right":<node#22>},{"left":<node#23>,"right":undefined},{"left":<node#24>,"right":undefined},{"left":<node#25>,"right":<node#26>},{"left":undefined,"right":undefined},{"left":<node#27>,"right":undefined},{"left":<node#28>,"right":<node#29>},{"left":<node#30>,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":<node#31>},{"left":undefined,"right":<node#32>},{"left":undefined,"right":undefined},{"left":undefined,"right":<node#33>},{"left":undefined,"right":<node#34>},{"left":<node#35>,"right":<node#36>},{"left":undefined,"right":undefined},{"left":undefined,"right":<node#37>},{"left":undefined,"right":<node#38>},{"left":undefined,"right":<node#39>},{"left":undefined,"right":<node#40>},{"left":undefined,"right":undefined},{"left":<node#41>,"right":undefined},{"left":<node#42>,"right":<node#43>},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":<node#44>},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined}]}
// • {"node":[{"left":undefined,"right":<node#5>},{"left":<node#6>,"right":undefined},{"left":undefined,"right":<node#7>},{"left":<node#8>,"right":<node#9>},{"left":<node#10>,"right":<node#11>},{"left":<node#12>,"right":<node#13>},{"left":<node#14>,"right":<node#15>},{"left":undefined,"right":undefined},{"left":<node#16>,"right":undefined},{"left":undefined,"right":<node#17>},{"left":undefined,"right":<node#18>},{"left":<node#19>,"right":<node#20>},{"left":<node#21>,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":<node#22>},{"left":undefined,"right":<node#23>},{"left":undefined,"right":undefined},{"left":<node#24>,"right":<node#25>},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":<node#26>,"right":undefined},{"left":undefined,"right":<node#27>},{"left":undefined,"right":undefined},{"left":undefined,"right":<node#28>},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined}]}
// • {"node":[{"left":<node#2>,"right":<node#3>},{"left":<node#4>,"right":<node#5>},{"left":<node#6>,"right":<node#7>},{"left":undefined,"right":<node#8>},{"left":<node#9>,"right":<node#10>},{"left":<node#11>,"right":<node#12>},{"left":undefined,"right":undefined},{"left":<node#13>,"right":<node#14>},{"left":undefined,"right":<node#15>},{"left":undefined,"right":<node#16>},{"left":<node#17>,"right":undefined},{"left":<node#18>,"right":undefined},{"left":<node#19>,"right":undefined},{"left":<node#20>,"right":undefined},{"left":undefined,"right":undefined},{"left":<node#21>,"right":<node#22>},{"left":undefined,"right":undefined},{"left":undefined,"right":<node#23>},{"left":undefined,"right":undefined},{"left":<node#24>,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":<node#25>},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined}]}
// • {"node":[{"left":<node#4>,"right":undefined},{"left":<node#5>,"right":<node#6>},{"left":<node#7>,"right":undefined},{"left":<node#8>,"right":<node#9>},{"left":<node#10>,"right":<node#11>},{"left":undefined,"right":<node#12>},{"left":<node#13>,"right":<node#14>},{"left":<node#15>,"right":<node#16>},{"left":<node#17>,"right":<node#18>},{"left":<node#19>,"right":<node#20>},{"left":undefined,"right":undefined},{"left":<node#21>,"right":undefined},{"left":undefined,"right":<node#22>},{"left":<node#23>,"right":undefined},{"left":undefined,"right":<node#24>},{"left":<node#25>,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":<node#26>,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":<node#27>},{"left":undefined,"right":<node#28>},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":<node#29>,"right":<node#30>},{"left":<node#31>,"right":undefined},{"left":undefined,"right":<node#32>},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":<node#33>,"right":undefined},{"left":<node#34>,"right":undefined},{"left":undefined,"right":<node#35>},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined}]}
// • {"node":[{"left":<node#6>,"right":<node#7>},{"left":<node#8>,"right":<node#9>},{"left":<node#10>,"right":<node#11>},{"left":undefined,"right":<node#12>},{"left":<node#13>,"right":<node#14>},{"left":<node#15>,"right":undefined},{"left":<node#16>,"right":<node#17>},{"left":<node#18>,"right":<node#19>},{"left":<node#20>,"right":<node#21>},{"left":undefined,"right":undefined},{"left":undefined,"right":<node#22>},{"left":undefined,"right":<node#23>},{"left":<node#24>,"right":<node#25>},{"left":<node#26>,"right":<node#27>},{"left":<node#28>,"right":<node#29>},{"left":<node#30>,"right":<node#31>},{"left":<node#32>,"right":undefined},{"left":undefined,"right":<node#33>},{"left":<node#34>,"right":<node#35>},{"left":undefined,"right":undefined},{"left":<node#36>,"right":<node#37>},{"left":<node#38>,"right":<node#39>},{"left":undefined,"right":<node#40>},{"left":undefined,"right":<node#41>},{"left":undefined,"right":undefined},{"left":<node#42>,"right":<node#43>},{"left":<node#44>,"right":undefined},{"left":<node#45>,"right":<node#46>},{"left":undefined,"right":<node#47>},{"left":undefined,"right":<node#48>},{"left":<node#49>,"right":undefined},{"left":<node#50>,"right":<node#51>},{"left":undefined,"right":undefined},{"left":<node#52>,"right":undefined},{"left":<node#53>,"right":<node#54>},{"left":<node#55>,"right":<node#56>},{"left":undefined,"right":undefined},{"left":undefined,"right":<node#57>},{"left":<node#58>,"right":undefined},{"left":<node#59>,"right":<node#60>},{"left":undefined,"right":<node#61>},{"left":undefined,"right":<node#62>},{"left":undefined,"right":<node#63>},{"left":undefined,"right":<node#64>},{"left":<node#65>,"right":undefined},{"left":undefined,"right":<node#66>},{"left":undefined,"right":<node#67>},{"left":undefined,"right":<node#68>},{"left":undefined,"right":undefined},{"left":undefined,"right":<node#69>},{"left":<node#70>,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":<node#71>},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":<node#72>},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":<node#73>,"right":<node#74>},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined},{"left":undefined,"right":undefined}]}
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
// TLDR, We define a structure made of users and profiles. Each user as its own profile, and we don't have any profile not being linked to a user.
// Extra remarks:
// - Every profile is linked to a user
// ↳ We could have allowed profiles not being connected to any user by dropping the maxLength:0 constraints defined on profile via initialPoolConstraints. By doing so we would allow profiles not being related to any user, while keeping the compulsory link when we have one user.
// Examples of generated values:
// • {"user":[{"name":"Lsoql","profile":<profile#0>},{"name":"V","profile":<profile#1>},{"name":"Yntoconstr","profile":<profile#2>},{"name":"Azgavaax","profile":<profile#3>},{"name":"Jvk","profile":<profile#4>},{"name":"Fnec","profile":<profile#5>},{"name":"Opzc","profile":<profile#6>}],"profile":[{"id":"ffffffe1-d4f6-89db-bfff-fffb00000016","pictureUrl":"http://08ki8-j.y.key//5/N/A/i//R"},{"id":"00000011-fff2-8fff-8000-001750b7e558","pictureUrl":"http://7.ezk"},{"id":"63e4ca81-000f-1000-b8c3-e9ee80f7a453","pictureUrl":"http://l.y-4zejhuon.cw"},{"id":"fffffff7-669f-1112-a2a6-4cbf81b77cd0","pictureUrl":"https://4shj.ref/C//A//u/)//F//5"},{"id":"0000001a-0fbf-348b-82b4-3b58fffffff2","pictureUrl":"http://xgu.aa/+//5/W/$////W/"},{"id":"fffffff5-fff2-8fff-8000-001b4c0a7268","pictureUrl":"https://49s.mi"},{"id":"a4c04bbe-fff1-8fff-8700-3da0a06d50f2","pictureUrl":"https://aei5rt9a3cu.ey//u/%F2%AF%90%B7/H//"}]}
// • {"user":[{"name":"Biaglifu","profile":<profile#0>},{"name":"Ldbviaxvaky","profile":<profile#1>},{"name":"Etruct","profile":<profile#2>},{"name":"Zuwtc","profile":<profile#3>},{"name":"Ymdmfi","profile":<profile#4>},{"name":"Druemgxyh","profile":<profile#5>},{"name":"V","profile":<profile#6>},{"name":"D","profile":<profile#7>},{"name":"Wfbozyvfae","profile":<profile#8>}],"profile":[{"id":"f61717d2-1280-8172-b688-aa8d45310b25","pictureUrl":"https://qz1xx5q.za//k/;/g/P"},{"id":"b07d7887-5fd7-5b4c-9ac9-13be92f20c79","pictureUrl":"https://76cfmd9o-ay.ba46d.cd//"},{"id":"00000017-0009-1000-8000-000300000012","pictureUrl":"http://kercvlih7yz1.vx/"},{"id":"0000001e-9f2b-7ae8-9ad1-3c6400000009","pictureUrl":"http://zpw4.an/d/0//B/g/r/p/*/"},{"id":"00000008-25e4-4b4f-8a73-5c169a62d465","pictureUrl":"http://6nameb.nvt/M//"},{"id":"fffffff3-001d-1000-82a0-ea2700000013","pictureUrl":"http://4fs.lu/S"},{"id":"1a8ca8bf-e780-6471-a0f8-523aac3c868e","pictureUrl":"http://h.vo/9B:"},{"id":"00000008-5d58-4f39-8000-000effffffff","pictureUrl":"https://0calld.khtjd8twn.cla/"},{"id":"66b33c8a-001c-1000-bfff-ffeec3dcf4e3","pictureUrl":"https://s3wd.19.ky"}]}
// • {"user":[{"name":"Kpr","profile":<profile#0>},{"name":"Yh","profile":<profile#1>},{"name":"Eortnaylp","profile":<profile#2>},{"name":"A","profile":<profile#3>},{"name":"Thypdgpjgst","profile":<profile#4>},{"name":"Eaiyre","profile":<profile#5>}],"profile":[{"id":"1f1df5af-4f97-823b-85cb-be3dffffffed","pictureUrl":"http://mvauyjp11.ag//*/9/J//w/"},{"id":"0000000a-0017-1000-97b3-eedea40117a3","pictureUrl":"https://mfj.wiw"},{"id":"00000003-fff8-8fff-8000-0016170efcc7","pictureUrl":"https://hm9pc1.jmr//*/"},{"id":"559f6db7-f23f-5db2-bfff-ffe2ffffffe8","pictureUrl":"https://aale4d86e.7.qc"},{"id":"94b18704-000a-1000-8508-81010000001c","pictureUrl":"http://k.lxtn3ystb.mq/Z/t//K/o/v/y//p"},{"id":"e1787553-001d-1000-bfff-fffcfffffff8","pictureUrl":"https://d.fa///o/l"}]}
// • {"user":[{"name":"Wwwljikwkm","profile":<profile#0>},{"name":"Rgruovyzom","profile":<profile#1>}],"profile":[{"id":"c89c3b4a-7e10-55e2-8000-001b997fcc45","pictureUrl":"http://53.70.la//7"},{"id":"00000004-0019-1000-8000-000271fb94e6","pictureUrl":"https://5.jvw"}]}
// • {"user":[{"name":"Ac","profile":<profile#0>}],"profile":[{"id":"21c8a9ec-fff4-8fff-bfff-fffd00000012","pictureUrl":"http://da37m0ov.na"}]}
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/entityGraph.html).  
Available since 4.5.0.
