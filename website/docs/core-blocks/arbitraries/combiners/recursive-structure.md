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
- `fc.entityGraph(arbitraries, relations, {initialPoolConstraints?,unicityConstraints?,noNullPrototype?})`

**with:**

- `arbitraries` — _declares the shape of each entity, this argument is supposed to be a record with a key being the name of the entity and the value being an object reprensenting the shape of an entity. The value part is similar to the one provided to `fc.record`_
- `relations` — _declares the relations between entities: from one to many to many to many, declare the relations you want as you would have done on a database schema. This argument is supposed to be a record with the key being the name of the entity and the value being an object reprensenting the links between this entity and another one_
  - _with a relation having the structure: `{arity, type}`_
    - `arity` — _`"0-1"` for an optional link to one instance from `type`, `"1"` for a link to one instance from `type`, `"many"` for links leading to multiple instances from `type` exposed via an array_
    - `type` — _one of the keys of `arbitraries`, describes what is the target type for this link_
    - `strategy?` — default: `'any'` — _`'any'` means any instance can make it, `'exclusive'` means the instance being referenced cannot be re-used by any other relation, `'successor'` means the instance has to be a (strict) successor of the instance holding the relation_
- `initialPoolConstraints?` — _minimal set of entities being expected in the produced graph_
- `unicityConstraints?` — _define unicity rules for each kind of entities by providing a selector function_
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
// - We are enforcing the unicity of ths ids.
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
// - We are enforcing the unicity of the names.
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
// - We are enforcing the unicity of the names.
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
  { employee: { name: fc.stringMatching(/^[A-Z][a-z]*$/) } },
  { employee: { managees: { arity: 'many', type: 'employee', strategy: 'exclusive' } } },
  {
    initialPoolConstraints: { employee: { maxLength: 1 } },
    unicityConstraints: { employee: (value) => value.name },
    noNullPrototype: true,
  },
);
// TLDR, We define a structure made of employees having zero or multiple managees without any cycle. Each employee is the managee (transitively) of the first employee.
// Extra remarks:
// - We only define one hierarchy. All employees are transitively the managees of the first employee.
// ↳ We could have allowed multiple hierarchies by dropping the maxLength:1 constraint on employee.
// Examples of generated values:
// • {"employee":[{"name":"Aprototyped","managees":[<employee#1>,<employee#2>]},{"name":"W","managees":[<employee#3>,<employee#4>,<employee#5>,<employee#6>,<employee#7>,<employee#8>,<employee#9>,<employee#10>,<employee#11>,<employee#12>]},{"name":"Vttbpt","managees":[<employee#13>,<employee#14>,<employee#15>,<employee#16>]},{"name":"Z","managees":[]},{"name":"Uq","managees":[<employee#17>,<employee#18>]},{"name":"Qetx","managees":[<employee#19>,<employee#20>,<employee#21>,<employee#22>]},{"name":"B","managees":[]},{"name":"J","managees":[]},{"name":"Div","managees":[<employee#23>]},{"name":"Pjznwsyvq","managees":[<employee#24>,<employee#25>,<employee#26>]},{"name":"Oqyaqddzxy","managees":[]},{"name":"Eontdigz","managees":[<employee#27>,<employee#28>,<employee#29>,<employee#30>,<employee#31>,<employee#32>,<employee#33>,<employee#34>,<employee#35>,<employee#36>,<employee#37>,<employee#38>]},{"name":"Vxauzd","managees":[]},{"name":"Zmxtmxjxrop","managees":[]},{"name":"Mcb","managees":[]},{"name":"Bbh","managees":[]},{"name":"Aevkkdpq","managees":[<employee#39>,<employee#40>,<employee#41>,<employee#42>,<employee#43>]},{"name":"J","managees":[]},{"name":"Gfw","managees":[<employee#44>,<employee#45>,<employee#46>,<employee#47>,<employee#48>,<employee#49>,<employee#50>,<employee#51>]},{"name":"Jiarwldpyb","managees":[]},{"name":"Cfxubvypg","managees":[<employee#52>,<employee#53>]},{"name":"Gapply","managees":[<employee#54>,<employee#55>,<employee#56>,<employee#57>,<employee#58>]},{"name":"Bce","managees":[]},{"name":"Xzjdijv","managees":[]},{"name":"Yebbpxnd","managees":[]},{"name":"Vapply","managees":[]},{"name":"Bz","managees":[<employee#59>]},{"name":"Fvdadqvqtmr","managees":[]},{"name":"Hvjzdge","managees":[<employee#60>,<employee#61>,<employee#62>,<employee#63>,<employee#64>,<employee#65>,<employee#66>,<employee#67>,<employee#68>,<employee#69>,<employee#70>,<employee#71>]},{"name":"Yxepptaxl","managees":[]},{"name":"Zfuua","managees":[<employee#72>,<employee#73>,<employee#74>,<employee#75>,<employee#76>]},{"name":"Ts","managees":[]},{"name":"Uzyjwe","managees":[]},{"name":"Zepw","managees":[]},{"name":"Fa","managees":[<employee#77>]},{"name":"Eg","managees":[]},{"name":"Byj","managees":[]},{"name":"Kawtanamebc","managees":[<employee#78>,<employee#79>,<employee#80>,<employee#81>]},{"name":"Pbqik","managees":[]},{"name":"Zodjy","managees":[]},{"name":"Rmkgzpv","managees":[]},{"name":"Zwdveabamvu","managees":[]},{"name":"Barguments","managees":[]},{"name":"Oqcypre","managees":[<employee#82>,<employee#83>,<employee#84>,<employee#85>]},{"name":"Applycecall","managees":[]},{"name":"Exbtp","managees":[]},{"name":"Nc","managees":[<employee#86>,<employee#87>,<employee#88>,<employee#89>,<employee#90>,<employee#91>]},{"name":"Udda","managees":[<employee#92>,<employee#93>,<employee#94>,<employee#95>,<employee#96>,<employee#97>,<employee#98>,<employee#99>,<employee#100>,<employee#101>,<employee#102>]},{"name":"Fkihbq","managees":[]},{"name":"Sa","managees":[]},{"name":"Ua","managees":[]},{"name":"Chhvsi","managees":[]},{"name":"Gbao","managees":[]},{"name":"Acc","managees":[<employee#103>,<employee#104>,<employee#105>]},{"name":"Wfatzqgkog","managees":[]},{"name":"Amzlxspvu","managees":[]},{"name":"Palmz","managees":[]},{"name":"Hvohlewha","managees":[]},{"name":"Bvzupb","managees":[]},{"name":"Aref","managees":[]},{"name":"Zor","managees":[<employee#106>,<employee#107>,<employee#108>,<employee#109>,<employee#110>,<employee#111>,<employee#112>,<employee#113>,<employee#114>,<employee#115>,<employee#116>,<employee#117>]},{"name":"Lwgfea","managees":[]},{"name":"Csahewcuf","managees":[]},{"name":"Yd","managees":[]},{"name":"Bitfdhnx","managees":[]},{"name":"Xkpyohc","managees":[]},{"name":"B","managees":[]},{"name":"Gwv","managees":[]},{"name":"Ez","managees":[<employee#118>,<employee#119>,<employee#120>,<employee#121>,<employee#122>,<employee#123>,<employee#124>,<employee#125>,<employee#126>]},{"name":"Bsx","managees":[]},{"name":"Jfauuyfm","managees":[]},{"name":"Wrzswazebb","managees":[]},{"name":"E","managees":[]},{"name":"Oifvjnnr","managees":[]},{"name":"I","managees":[]},{"name":"T","managees":[]},{"name":"Bb","managees":[]},{"name":"Iyunbagcvor","managees":[]},{"name":"D","managees":[]},{"name":"Eeya","managees":[<employee#127>,<employee#128>,<employee#129>,<employee#130>,<employee#131>,<employee#132>,<employee#133>,<employee#134>,<employee#135>,<employee#136>,<employee#137>]},{"name":"Jidy","managees":[]},{"name":"Gj","managees":[<employee#138>,<employee#139>,<employee#140>,<employee#141>,<employee#142>,<employee#143>,<employee#144>,<employee#145>,<employee#146>]},{"name":"Audija","managees":[]},{"name":"Cxdv","managees":[<employee#147>,<employee#148>,<employee#149>,<employee#150>]},{"name":"Eya","managees":[]},{"name":"Iabd","managees":[]},{"name":"Xixxciozyef","managees":[<employee#151>,<employee#152>,<employee#153>,<employee#154>,<employee#155>,<employee#156>]},{"name":"Cuzbn","managees":[]},{"name":"Bbpgd","managees":[]},{"name":"A","managees":[]},{"name":"Askgg","managees":[]},{"name":"Zw","managees":[]},{"name":"Cll","managees":[]},{"name":"Eucc","managees":[]},{"name":"Wkofgm","managees":[]},{"name":"Cbbcm","managees":[<employee#157>,<employee#158>,<employee#159>,<employee#160>,<employee#161>,<employee#162>,<employee#163>,<employee#164>,<employee#165>,<employee#166>]},{"name":"Etb","managees":[]},{"name":"Yrdb","managees":[]},{"name":"Bn","managees":[]},{"name":"Bxlfqefkojo","managees":[]},{"name":"Dcec","managees":[]},{"name":"Dd","managees":[]},{"name":"Gwqv","managees":[]},{"name":"Rgs","managees":[]},{"name":"Dkrakhlhs","managees":[]},{"name":"Dxsvbalhz","managees":[]},{"name":"Bjwqztf","managees":[]},{"name":"Cjo","managees":[]},{"name":"Ycbootzbi","managees":[]},{"name":"C","managees":[]},{"name":"Q","managees":[]},{"name":"Abbsrpmmce","managees":[]},{"name":"Ar","managees":[]},{"name":"V","managees":[<employee#167>]},{"name":"Vogay","managees":[]},{"name":"Aqtgrl","managees":[]},{"name":"Pf","managees":[<employee#168>,<employee#169>,<employee#170>,<employee#171>,<employee#172>,<employee#173>,<employee#174>,<employee#175>,<employee#176>,<employee#177>,<employee#178>,<employee#179>]},{"name":"Xw","managees":[]},{"name":"Ycq","managees":[]},{"name":"Ccal","managees":[]},{"name":"O","managees":[]},{"name":"D","managees":[]},{"name":"Bvotdfrsbgm","managees":[]},{"name":"Asdt","managees":[]},{"name":"Ef","managees":[]},{"name":"Ea","managees":[]},{"name":"Zbrhewrctwv","managees":[<employee#180>,<employee#181>,<employee#182>,<employee#183>,<employee#184>,<employee#185>,<employee#186>,<employee#187>,<employee#188>]},{"name":"Csihtkjk","managees":[]},{"name":"Atbi","managees":[]},{"name":"Dczybcowa","managees":[]},{"name":"Bkkfwoed","managees":[]},{"name":"Uwue","managees":[]},{"name":"Afjczzlb","managees":[]},{"name":"Yapply","managees":[]},{"name":"Ggpepwmtdn","managees":[]},{"name":"Yah","managees":[<employee#189>,<employee#190>,<employee#191>,<employee#192>]},{"name":"P","managees":[]},{"name":"Qcmo","managees":[]},{"name":"Yw","managees":[]},{"name":"Qieebv","managees":[]},{"name":"Ejpklr","managees":[]},{"name":"O","managees":[]},{"name":"Eeao","managees":[]},{"name":"Ohfuohde","managees":[]},{"name":"Ecobdjdax","managees":[]},{"name":"Wdbfeb","managees":[]},{"name":"Darguments","managees":[]},{"name":"C","managees":[]},{"name":"Eyvlioh","managees":[]},{"name":"Yna","managees":[]},{"name":"Cdxidrnr","managees":[]},{"name":"Aifgusdpli","managees":[]},{"name":"Bi","managees":[]},{"name":"We","managees":[]},{"name":"P","managees":[]},{"name":"Czsxr","managees":[]},{"name":"Ere","managees":[]},{"name":"Wdpgfyvkvp","managees":[]},{"name":"Xf","managees":[]},{"name":"Bm","managees":[]},{"name":"Ze","managees":[]},{"name":"Gharhgulk","managees":[]},{"name":"Ysek","managees":[]},{"name":"Worbj","managees":[]},{"name":"Yyubdgdopu","managees":[]},{"name":"Cap","managees":[]},{"name":"Zeyb","managees":[]},{"name":"X","managees":[]},{"name":"Vpaqesadro","managees":[]},{"name":"Bimbefvwwez","managees":[]},{"name":"Pbind","managees":[]},{"name":"Wref","managees":[]},{"name":"Xkbi","managees":[]},{"name":"Zqv","managees":[]},{"name":"Ehuk","managees":[]},{"name":"Dze","managees":[]},{"name":"Wcs","managees":[<employee#193>]},{"name":"Abclcwsbivy","managees":[]},{"name":"Yyfldzxcons","managees":[]},{"name":"O","managees":[]},{"name":"Qcvxcjuu","managees":[]},{"name":"Zcxcrpuyab","managees":[]},{"name":"Z","managees":[]},{"name":"Cqbkvkkw","managees":[]},{"name":"Aqhn","managees":[]},{"name":"Ad","managees":[<employee#194>,<employee#195>]},{"name":"Yaniztzyt","managees":[]},{"name":"Qur","managees":[]},{"name":"Nvye","managees":[]},{"name":"F","managees":[]},{"name":"Vbfei","managees":[]},{"name":"Xcc","managees":[]},{"name":"Scall","managees":[]},{"name":"X","managees":[]},{"name":"Weda","managees":[]},{"name":"Avqbzzgeusa","managees":[]}]}
// • {"employee":[{"name":"Bkjlgu","managees":[]}]}
// • {"employee":[{"name":"Chuse","managees":[<employee#1>]},{"name":"Al","managees":[<employee#2>,<employee#3>,<employee#4>,<employee#5>,<employee#6>,<employee#7>,<employee#8>,<employee#9>]},{"name":"Jhap","managees":[]},{"name":"Aprototype","managees":[<employee#10>]},{"name":"Ckey","managees":[]},{"name":"Bxujovuafs","managees":[]},{"name":"Chewdd","managees":[]},{"name":"Rfptqkiaol","managees":[]},{"name":"B","managees":[<employee#11>,<employee#12>,<employee#13>,<employee#14>,<employee#15>,<employee#16>,<employee#17>]},{"name":"Ben","managees":[<employee#18>,<employee#19>,<employee#20>]},{"name":"Za","managees":[<employee#21>,<employee#22>,<employee#23>,<employee#24>,<employee#25>,<employee#26>,<employee#27>,<employee#28>,<employee#29>,<employee#30>,<employee#31>]},{"name":"Dwxyoy","managees":[]},{"name":"C","managees":[]},{"name":"Yg","managees":[]},{"name":"Cea","managees":[<employee#32>,<employee#33>,<employee#34>,<employee#35>,<employee#36>]},{"name":"Cdsz","managees":[]},{"name":"Cga","managees":[]},{"name":"Sc","managees":[<employee#37>]},{"name":"Eokw","managees":[]},{"name":"Dzh","managees":[]},{"name":"Wakc","managees":[]},{"name":"Vkey","managees":[]},{"name":"A","managees":[]},{"name":"Aznce","managees":[]},{"name":"Cueyd","managees":[]},{"name":"Zxkmz","managees":[]},{"name":"Amhnyfodja","managees":[<employee#38>,<employee#39>,<employee#40>,<employee#41>,<employee#42>,<employee#43>,<employee#44>]},{"name":"Zxuhy","managees":[<employee#45>,<employee#46>,<employee#47>]},{"name":"Zfa","managees":[]},{"name":"Bcz","managees":[]},{"name":"Vblvl","managees":[]},{"name":"Lmapn","managees":[]},{"name":"C","managees":[]},{"name":"Bbk","managees":[<employee#48>,<employee#49>,<employee#50>,<employee#51>,<employee#52>,<employee#53>,<employee#54>,<employee#55>,<employee#56>,<employee#57>,<employee#58>,<employee#59>]},{"name":"Nib","managees":[]},{"name":"Gzaliwwpjf","managees":[]},{"name":"Zc","managees":[]},{"name":"Iccbgc","managees":[<employee#60>,<employee#61>,<employee#62>,<employee#63>]},{"name":"Ctkfvg","managees":[]},{"name":"Rargumentsa","managees":[]},{"name":"Acvb","managees":[]},{"name":"Avlgjqcbgaf","managees":[]},{"name":"Rmoaltuehi","managees":[]},{"name":"Nhimptb","managees":[]},{"name":"Bnq","managees":[]},{"name":"Qjfjkrr","managees":[<employee#64>,<employee#65>,<employee#66>,<employee#67>]},{"name":"Ce","managees":[]},{"name":"Xiszzcmbol","managees":[<employee#68>]},{"name":"E","managees":[]},{"name":"Ehg","managees":[]},{"name":"Revbpqyz","managees":[]},{"name":"Zd","managees":[]},{"name":"Rwjk","managees":[]},{"name":"Heyvrocbry","managees":[]},{"name":"Eilpgmhevf","managees":[]},{"name":"Hcwmgjgjwc","managees":[<employee#69>,<employee#70>,<employee#71>,<employee#72>,<employee#73>,<employee#74>,<employee#75>,<employee#76>,<employee#77>,<employee#78>]},{"name":"Brefzbindca","managees":[]},{"name":"Izzsvyfvqso","managees":[]},{"name":"Cswraqsp","managees":[]},{"name":"Uqvddidzc","managees":[]},{"name":"Wcc","managees":[]},{"name":"A","managees":[]},{"name":"Jo","managees":[]},{"name":"Fkb","managees":[]},{"name":"Xj","managees":[]},{"name":"Igxote","managees":[]},{"name":"Dkey","managees":[]},{"name":"Pkophrki","managees":[]},{"name":"Ovubcga","managees":[]},{"name":"Cqc","managees":[]},{"name":"Qcpc","managees":[]},{"name":"Swhl","managees":[]},{"name":"A","managees":[]},{"name":"Cnagnvzrl","managees":[]},{"name":"Gher","managees":[]},{"name":"Neqruzdv","managees":[]},{"name":"Bgg","managees":[]},{"name":"B","managees":[]},{"name":"Xtjqeutgo","managees":[]}]}
// • {"employee":[{"name":"Bohmkgdq","managees":[<employee#1>,<employee#2>,<employee#3>,<employee#4>,<employee#5>,<employee#6>,<employee#7>,<employee#8>,<employee#9>,<employee#10>,<employee#11>]},{"name":"X","managees":[<employee#12>,<employee#13>,<employee#14>,<employee#15>]},{"name":"Ylkxlu","managees":[<employee#16>,<employee#17>,<employee#18>]},{"name":"E","managees":[<employee#19>,<employee#20>]},{"name":"Xwxzxpqqg","managees":[<employee#21>,<employee#22>]},{"name":"Gevaabixw","managees":[]},{"name":"Gf","managees":[<employee#23>,<employee#24>,<employee#25>,<employee#26>,<employee#27>,<employee#28>,<employee#29>,<employee#30>,<employee#31>,<employee#32>,<employee#33>,<employee#34>]},{"name":"Ecid","managees":[<employee#35>,<employee#36>,<employee#37>,<employee#38>,<employee#39>,<employee#40>,<employee#41>,<employee#42>,<employee#43>,<employee#44>]},{"name":"Jkttzpzfbpw","managees":[<employee#45>,<employee#46>,<employee#47>,<employee#48>,<employee#49>,<employee#50>,<employee#51>,<employee#52>,<employee#53>,<employee#54>,<employee#55>,<employee#56>]},{"name":"Xjrbehhajwi","managees":[<employee#57>,<employee#58>]},{"name":"Wz","managees":[<employee#59>,<employee#60>,<employee#61>,<employee#62>,<employee#63>]},{"name":"Mkgbxkiak","managees":[<employee#64>,<employee#65>,<employee#66>,<employee#67>,<employee#68>,<employee#69>]},{"name":"Vaargumcx","managees":[]},{"name":"Ruqrshlob","managees":[<employee#70>,<employee#71>,<employee#72>,<employee#73>,<employee#74>,<employee#75>]},{"name":"Dkey","managees":[<employee#76>,<employee#77>,<employee#78>,<employee#79>]},{"name":"W","managees":[]},{"name":"Kce","managees":[]},{"name":"Wqigxiymrf","managees":[<employee#80>,<employee#81>,<employee#82>,<employee#83>,<employee#84>,<employee#85>]},{"name":"Vduejecmy","managees":[]},{"name":"Ekodczubbuh","managees":[<employee#86>,<employee#87>,<employee#88>,<employee#89>,<employee#90>,<employee#91>,<employee#92>,<employee#93>,<employee#94>,<employee#95>,<employee#96>]},{"name":"Jid","managees":[]},{"name":"Vkejxmzdjk","managees":[]},{"name":"Xref","managees":[<employee#97>,<employee#98>,<employee#99>,<employee#100>,<employee#101>,<employee#102>,<employee#103>]},{"name":"O","managees":[]},{"name":"Cv","managees":[]},{"name":"Kqw","managees":[<employee#104>,<employee#105>]},{"name":"Cb","managees":[]},{"name":"Dnuue","managees":[<employee#106>,<employee#107>,<employee#108>,<employee#109>,<employee#110>,<employee#111>]},{"name":"Dptiogqiypp","managees":[]},{"name":"Asnamexca","managees":[]},{"name":"Ybkqg","managees":[]},{"name":"Nc","managees":[<employee#112>,<employee#113>,<employee#114>]},{"name":"H","managees":[]},{"name":"Edfplqqz","managees":[<employee#115>]},{"name":"Vbi","managees":[]},{"name":"Nb","managees":[]},{"name":"Cprototype","managees":[]},{"name":"Qzlybfhrk","managees":[]},{"name":"Aakqiuyjz","managees":[<employee#116>,<employee#117>,<employee#118>]},{"name":"Ikey","managees":[]},{"name":"Db","managees":[<employee#119>,<employee#120>]},{"name":"Zojkqefhoh","managees":[<employee#121>,<employee#122>]},{"name":"Gfyebdcm","managees":[]},{"name":"Ifkrodgya","managees":[]},{"name":"C","managees":[]},{"name":"Y","managees":[<employee#123>,<employee#124>,<employee#125>,<employee#126>]},{"name":"Dfvaolak","managees":[<employee#127>,<employee#128>,<employee#129>,<employee#130>]},{"name":"Dwpofuw","managees":[<employee#131>,<employee#132>,<employee#133>,<employee#134>,<employee#135>,<employee#136>,<employee#137>,<employee#138>,<employee#139>,<employee#140>,<employee#141>,<employee#142>]},{"name":"D","managees":[]},{"name":"Xdyd","managees":[]},{"name":"Oapply","managees":[]},{"name":"E","managees":[]},{"name":"Hmwicqo","managees":[]},{"name":"Cugappeyy","managees":[<employee#143>,<employee#144>,<employee#145>]},{"name":"Cqfaqyibbu","managees":[]},{"name":"Gdz","managees":[]},{"name":"Jpzvbn","managees":[<employee#146>,<employee#147>,<employee#148>,<employee#149>,<employee#150>,<employee#151>,<employee#152>,<employee#153>,<employee#154>]},{"name":"Ke","managees":[]},{"name":"Atg","managees":[]},{"name":"Gref","managees":[<employee#155>,<employee#156>,<employee#157>,<employee#158>,<employee#159>,<employee#160>,<employee#161>,<employee#162>]},{"name":"Gcall","managees":[]},{"name":"Xo","managees":[<employee#163>,<employee#164>]},{"name":"Mlgv","managees":[<employee#165>,<employee#166>,<employee#167>,<employee#168>,<employee#169>]},{"name":"Tcalle","managees":[]},{"name":"Z","managees":[<employee#170>,<employee#171>,<employee#172>,<employee#173>,<employee#174>,<employee#175>,<employee#176>,<employee#177>,<employee#178>]},{"name":"Czxev","managees":[<employee#179>]},{"name":"Xyjrrpiwbh","managees":[]},{"name":"Virjs","managees":[]},{"name":"Kq","managees":[]},{"name":"Veq","managees":[]},{"name":"W","managees":[]},{"name":"Axtotyqj","managees":[]},{"name":"Agu","managees":[]},{"name":"A","managees":[]},{"name":"Yoxouoakpg","managees":[]},{"name":"E","managees":[]},{"name":"Rgzmnt","managees":[]},{"name":"Y","managees":[]},{"name":"H","managees":[<employee#180>,<employee#181>,<employee#182>,<employee#183>,<employee#184>,<employee#185>,<employee#186>,<employee#187>,<employee#188>,<employee#189>,<employee#190>]},{"name":"B","managees":[]},{"name":"Jref","managees":[]},{"name":"Ta","managees":[]},{"name":"Bsu","managees":[<employee#191>,<employee#192>]},{"name":"X","managees":[]},{"name":"Vpr","managees":[]},{"name":"Zdeeec","managees":[<employee#193>,<employee#194>,<employee#195>,<employee#196>,<employee#197>]},{"name":"T","managees":[]},{"name":"Oyomcahabk","managees":[<employee#198>,<employee#199>,<employee#200>,<employee#201>,<employee#202>,<employee#203>]},{"name":"Ypa","managees":[]},{"name":"Lahvdcdeh","managees":[]},{"name":"Dxneu","managees":[]},{"name":"Ccd","managees":[<employee#204>]},{"name":"Es","managees":[]},{"name":"Th","managees":[]},{"name":"Epp","managees":[]},{"name":"Pielnlnfif","managees":[]},{"name":"Dtu","managees":[]},{"name":"Edc","managees":[]},{"name":"Mxqomlifti","managees":[]},{"name":"Vxkapguusk","managees":[]},{"name":"B","managees":[]},{"name":"Mexd","managees":[]},{"name":"Clengtheyye","managees":[]},{"name":"Hwnqc","managees":[]},{"name":"Dx","managees":[]},{"name":"Bdtdehdwnb","managees":[]},{"name":"Dwsbpurvskf","managees":[<employee#205>,<employee#206>,<employee#207>,<employee#208>,<employee#209>,<employee#210>,<employee#211>,<employee#212>,<employee#213>,<employee#214>,<employee#215>]},{"name":"Lrbeqa","managees":[]},{"name":"Du","managees":[]},{"name":"Sq","managees":[<employee#216>,<employee#217>,<employee#218>]},{"name":"Asjorvo","managees":[]},{"name":"De","managees":[]},{"name":"Vg","managees":[]},{"name":"Yjfz","managees":[<employee#219>,<employee#220>,<employee#221>,<employee#222>]},{"name":"Xixzph","managees":[]},{"name":"Cla","managees":[<employee#223>]},{"name":"Hap","managees":[]},{"name":"E","managees":[<employee#224>,<employee#225>,<employee#226>,<employee#227>,<employee#228>]},{"name":"Bvb","managees":[]},{"name":"Wcrvu","managees":[<employee#229>]},{"name":"Tvad","managees":[]},{"name":"Tsap","managees":[]},{"name":"Ysv","managees":[]},{"name":"Bey","managees":[<employee#230>,<employee#231>,<employee#232>,<employee#233>,<employee#234>,<employee#235>,<employee#236>,<employee#237>,<employee#238>,<employee#239>,<employee#240>]},{"name":"X","managees":[]},{"name":"Wxwe","managees":[]},{"name":"C","managees":[]},{"name":"Yref","managees":[]},{"name":"Ysqlgrwb","managees":[]},{"name":"Vndszpvq","managees":[]},{"name":"E","managees":[<employee#241>,<employee#242>,<employee#243>]},{"name":"Eco","managees":[]},{"name":"Gc","managees":[<employee#244>,<employee#245>,<employee#246>]},{"name":"Xzvbyttuo","managees":[]},{"name":"S","managees":[<employee#247>,<employee#248>,<employee#249>,<employee#250>,<employee#251>,<employee#252>,<employee#253>,<employee#254>,<employee#255>]},{"name":"Cil","managees":[]},{"name":"Dhqtqrp","managees":[<employee#256>,<employee#257>,<employee#258>,<employee#259>]},{"name":"Chnjkm","managees":[]},{"name":"Exc","managees":[<employee#260>,<employee#261>,<employee#262>,<employee#263>,<employee#264>,<employee#265>]},{"name":"Bb","managees":[]},{"name":"Rarguments","managees":[<employee#266>,<employee#267>,<employee#268>,<employee#269>,<employee#270>,<employee#271>,<employee#272>]},{"name":"Cjrpxayorg","managees":[]},{"name":"Oe","managees":[]},{"name":"Af","managees":[<employee#273>]},{"name":"Av","managees":[]},{"name":"Vm","managees":[]},{"name":"Dpr","managees":[]},{"name":"Aoi","managees":[]},{"name":"Whkomndhucj","managees":[<employee#274>,<employee#275>,<employee#276>,<employee#277>,<employee#278>,<employee#279>,<employee#280>,<employee#281>]},{"name":"Bhwgjigc","managees":[<employee#282>,<employee#283>,<employee#284>]},{"name":"X","managees":[]},{"name":"Cwd","managees":[<employee#285>,<employee#286>,<employee#287>,<employee#288>,<employee#289>,<employee#290>,<employee#291>,<employee#292>,<employee#293>]},{"name":"Wpr","managees":[<employee#294>,<employee#295>]},{"name":"Nc","managees":[]},{"name":"Dh","managees":[]},{"name":"B","managees":[<employee#296>,<employee#297>]},{"name":"Suqob","managees":[]},{"name":"Xpujkfunr","managees":[]},{"name":"Cv","managees":[<employee#298>,<employee#299>,<employee#300>,<employee#301>,<employee#302>,<employee#303>,<employee#304>]},{"name":"U","managees":[]},{"name":"Ccall","managees":[]},{"name":"Ob","managees":[]},{"name":"Yjnwxvcxb","managees":[]},{"name":"Dgvmqug","managees":[]},{"name":"Oeppblbne","managees":[]},{"name":"Oamckeecrgp","managees":[<employee#305>,<employee#306>,<employee#307>,<employee#308>,<employee#309>]},{"name":"Apobcsmfc","managees":[]},{"name":"V","managees":[]},{"name":"Lpmhsakkj","managees":[]},{"name":"B","managees":[<employee#310>,<employee#311>,<employee#312>,<employee#313>,<employee#314>,<employee#315>]},{"name":"Ocw","managees":[]},{"name":"Ef","managees":[<employee#316>,<employee#317>]},{"name":"Oidxkhiyhdz","managees":[<employee#318>,<employee#319>,<employee#320>,<employee#321>]},{"name":"Dzir","managees":[]},{"name":"Vdcc","managees":[]},{"name":"Ycbwygunbjs","managees":[]},{"name":"Wref","managees":[]},{"name":"Yarguments","managees":[]},{"name":"Zyxrqsdzqy","managees":[]},{"name":"Xeysb","managees":[<employee#322>]},{"name":"Argcsilelz","managees":[]},{"name":"Bglength","managees":[]},{"name":"Xy","managees":[]},{"name":"Ztgjd","managees":[]},{"name":"Ba","managees":[]},{"name":"Veoca","managees":[]},{"name":"T","managees":[]},{"name":"Bmenwkref","managees":[]},{"name":"E","managees":[]},{"name":"Capply","managees":[]},{"name":"Meie","managees":[]},{"name":"Atwtwfzs","managees":[]},{"name":"Ajgcaz","managees":[]},{"name":"Epzxpmc","managees":[]},{"name":"Hc","managees":[]},{"name":"Rdixfees","managees":[<employee#323>,<employee#324>,<employee#325>,<employee#326>,<employee#327>,<employee#328>,<employee#329>,<employee#330>]},{"name":"Nrfw","managees":[]},{"name":"Aref","managees":[]},{"name":"Cvzammg","managees":[]},{"name":"Doz","managees":[<employee#331>,<employee#332>,<employee#333>,<employee#334>,<employee#335>,<employee#336>,<employee#337>]},{"name":"Aiqzjmcyqc","managees":[]},{"name":"Esohmnsoj","managees":[]},{"name":"Mhgafwfw","managees":[]},{"name":"Ch","managees":[]},{"name":"Lpdsewo","managees":[]},{"name":"D","managees":[]},{"name":"Xbsprzcmva","managees":[]},{"name":"Bb","managees":[]},{"name":"Fe","managees":[]},{"name":"Assbcxzwwj","managees":[]},{"name":"Dt","managees":[]},{"name":"Wr","managees":[]},{"name":"Dv","managees":[]},{"name":"Ekxjyhhp","managees":[]},{"name":"Yal","managees":[]},{"name":"K","managees":[]},{"name":"Syq","managees":[]},{"name":"Morznckxgbf","managees":[]},{"name":"Ck","managees":[]},{"name":"Fname","managees":[]},{"name":"Gtcfvxvpa","managees":[]},{"name":"Qhbqpaxxu","managees":[]},{"name":"Nxbj","managees":[]},{"name":"Boj","managees":[<employee#338>,<employee#339>,<employee#340>,<employee#341>,<employee#342>]},{"name":"Pmkr","managees":[]},{"name":"P","managees":[]},{"name":"Lnvdfocawbg","managees":[]},{"name":"Afgqvwd","managees":[]},{"name":"Wcy","managees":[]},{"name":"D","managees":[]},{"name":"Xdadvaid","managees":[]},{"name":"Nkxky","managees":[]},{"name":"A","managees":[]},{"name":"Bxbp","managees":[]},{"name":"Q","managees":[]},{"name":"Ccy","managees":[]},{"name":"Mre","managees":[]},{"name":"Gin","managees":[]},{"name":"Krmnb","managees":[]},{"name":"Elw","managees":[]},{"name":"Jrmgd","managees":[<employee#343>,<employee#344>,<employee#345>,<employee#346>,<employee#347>,<employee#348>]},{"name":"Ulngwagdyoi","managees":[]},{"name":"Aezyiiibuo","managees":[]},{"name":"Cdj","managees":[]},{"name":"Z","managees":[]},{"name":"X","managees":[]},{"name":"Uoaoacp","managees":[]},{"name":"Rasyp","managees":[]},{"name":"Ulpvlct","managees":[<employee#349>,<employee#350>]},{"name":"Ebwkeye","managees":[]},{"name":"Dcuidzrm","managees":[]},{"name":"C","managees":[]},{"name":"Avae","managees":[]},{"name":"Sx","managees":[]},{"name":"Yallegvkeya","managees":[]},{"name":"Wtrldbljbt","managees":[]},{"name":"Awfysues","managees":[]},{"name":"Ldd","managees":[]},{"name":"Xlmejzcm","managees":[]},{"name":"Da","managees":[]},{"name":"V","managees":[]},{"name":"Nar","managees":[]},{"name":"Wdceccebk","managees":[]},{"name":"Adrw","managees":[]},{"name":"Dz","managees":[]},{"name":"Iqikzjawcs","managees":[]},{"name":"R","managees":[]},{"name":"Awdmf","managees":[]},{"name":"Dipyhzceonx","managees":[]},{"name":"Aj","managees":[<employee#351>,<employee#352>,<employee#353>,<employee#354>,<employee#355>,<employee#356>,<employee#357>,<employee#358>,<employee#359>,<employee#360>,<employee#361>]},{"name":"Hke","managees":[<employee#362>,<employee#363>,<employee#364>,<employee#365>]},{"name":"Jcdacaxdmve","managees":[<employee#366>]},{"name":"Ow","managees":[<employee#367>,<employee#368>,<employee#369>,<employee#370>,<employee#371>,<employee#372>,<employee#373>,<employee#374>,<employee#375>,<employee#376>,<employee#377>]},{"name":"Tlgdxtq","managees":[]},{"name":"Ievvon","managees":[]},{"name":"Baahohout","managees":[]},{"name":"Skzd","managees":[]},{"name":"Clwc","managees":[]},{"name":"Tgck","managees":[]},{"name":"Yuae","managees":[]},{"name":"Be","managees":[]},{"name":"Wogbanrn","managees":[]},{"name":"A","managees":[]},{"name":"Zcp","managees":[]},{"name":"Xe","managees":[]},{"name":"Su","managees":[<employee#378>,<employee#379>,<employee#380>,<employee#381>,<employee#382>,<employee#383>,<employee#384>,<employee#385>,<employee#386>,<employee#387>]},{"name":"Crxaatybykq","managees":[]},{"name":"Dnb","managees":[]},{"name":"Cvwuysf","managees":[]},{"name":"Wh","managees":[]},{"name":"Avjroew","managees":[]},{"name":"Ovrybhxcq","managees":[]},{"name":"Yay","managees":[]},{"name":"Uref","managees":[]},{"name":"Wbcallcon","managees":[]},{"name":"El","managees":[]},{"name":"Esqanazj","managees":[]},{"name":"Be","managees":[]},{"name":"Ejyf","managees":[]},{"name":"Eg","managees":[<employee#388>,<employee#389>,<employee#390>,<employee#391>,<employee#392>,<employee#393>,<employee#394>,<employee#395>]},{"name":"Bbp","managees":[]},{"name":"Vspzndbcmd","managees":[]},{"name":"Mw","managees":[]},{"name":"Lvu","managees":[]},{"name":"Xfkem","managees":[]},{"name":"Cfzos","managees":[]},{"name":"Dj","managees":[]},{"name":"Uzgv","managees":[]},{"name":"Ec","managees":[]},{"name":"Iefbcqe","managees":[]},{"name":"Ckeyaotot","managees":[<employee#396>,<employee#397>,<employee#398>,<employee#399>,<employee#400>,<employee#401>,<employee#402>,<employee#403>,<employee#404>,<employee#405>,<employee#406>,<employee#407>]},{"name":"Tasg","managees":[<employee#408>,<employee#409>,<employee#410>,<employee#411>,<employee#412>,<employee#413>,<employee#414>,<employee#415>,<employee#416>,<employee#417>,<employee#418>,<employee#419>]},{"name":"Jlouqezwhn","managees":[]},{"name":"Eukey","managees":[]},{"name":"Bgwhnlkog","managees":[]},{"name":"Xkexheyjpx","managees":[]},{"name":"Dxaceeya","managees":[]},{"name":"Iargu","managees":[<employee#420>,<employee#421>,<employee#422>]},{"name":"Aft","managees":[]},{"name":"Yxhuc","managees":[]},{"name":"Ajetowawcei","managees":[]},{"name":"Ohbqd","managees":[]},{"name":"Ciqdgy","managees":[<employee#423>,<employee#424>,<employee#425>,<employee#426>]},{"name":"Ahlbtf","managees":[]},{"name":"T","managees":[]},{"name":"Yqa","managees":[]},{"name":"Bczja","managees":[]},{"name":"Wname","managees":[]},{"name":"Br","managees":[]},{"name":"Bbzae","managees":[]},{"name":"Eendbindn","managees":[]},{"name":"Dg","managees":[]},{"name":"Iyiauvexls","managees":[]},{"name":"Cedistbf","managees":[]},{"name":"Dsprhv","managees":[]},{"name":"Czjvpgbwu","managees":[]},{"name":"Apkieavn","managees":[]},{"name":"Ypdkrou","managees":[]},{"name":"Zcktkonias","managees":[]},{"name":"Araqrxbq","managees":[]},{"name":"Cr","managees":[]},{"name":"Axzycyw","managees":[<employee#427>,<employee#428>,<employee#429>,<employee#430>]},{"name":"C","managees":[]},{"name":"Vs","managees":[]},{"name":"Rle","managees":[]},{"name":"Aqnvy","managees":[]},{"name":"Bfnl","managees":[]},{"name":"Aa","managees":[]},{"name":"Gbi","managees":[]},{"name":"Vsb","managees":[]},{"name":"Vcvhqiroex","managees":[]},{"name":"Wwpwhzv","managees":[<employee#431>,<employee#432>,<employee#433>]},{"name":"U","managees":[]},{"name":"Xyvsbbzrddb","managees":[]},{"name":"Che","managees":[]},{"name":"Vaacj","managees":[]},{"name":"Vkey","managees":[]},{"name":"Vzwb","managees":[<employee#434>,<employee#435>]},{"name":"Btutwkztjz","managees":[]},{"name":"C","managees":[<employee#436>]},{"name":"Bef","managees":[<employee#437>,<employee#438>,<employee#439>,<employee#440>,<employee#441>,<employee#442>]},{"name":"Zin","managees":[]},{"name":"Bl","managees":[]},{"name":"Bmugazdrcl","managees":[]},{"name":"Vryyj","managees":[]},{"name":"Dd","managees":[]},{"name":"Gtziz","managees":[]},{"name":"Pyaapp","managees":[]},{"name":"Ylefowmbcpk","managees":[]},{"name":"Ik","managees":[]},{"name":"Aheyo","managees":[<employee#443>,<employee#444>,<employee#445>,<employee#446>,<employee#447>,<employee#448>,<employee#449>,<employee#450>,<employee#451>,<employee#452>]},{"name":"Ywqfa","managees":[]},{"name":"Wtfjarpoji","managees":[]},{"name":"Acvrqo","managees":[]},{"name":"Oc","managees":[]},{"name":"Eax","managees":[]},{"name":"Svmvc","managees":[]},{"name":"Cw","managees":[]},{"name":"Sco","managees":[]},{"name":"Crds","managees":[]},{"name":"Ezys","managees":[<employee#453>,<employee#454>,<employee#455>,<employee#456>]},{"name":"Xbjeffuavvm","managees":[]},{"name":"Fc","managees":[]},{"name":"F","managees":[<employee#457>,<employee#458>]},{"name":"Ghy","managees":[]},{"name":"Mibjatnstq","managees":[]},{"name":"Yprototy","managees":[]},{"name":"Wdch","managees":[]},{"name":"Vvxbezon","managees":[]},{"name":"Szi","managees":[]},{"name":"Hbind","managees":[]},{"name":"A","managees":[]},{"name":"Rca","managees":[]},{"name":"R","managees":[<employee#459>,<employee#460>,<employee#461>]},{"name":"Dwigxfd","managees":[]},{"name":"Bb","managees":[]},{"name":"E","managees":[]},{"name":"Axn","managees":[]},{"name":"W","managees":[<employee#462>]},{"name":"Dluyghrl","managees":[]},{"name":"Xnta","managees":[]},{"name":"Cdq","managees":[]},{"name":"M","managees":[]},{"name":"Emybcccdeyo","managees":[]},{"name":"Ufy","managees":[]},{"name":"Z","managees":[]},{"name":"I","managees":[]},{"name":"Aukdrxli","managees":[<employee#463>,<employee#464>,<employee#465>,<employee#466>,<employee#467>,<employee#468>,<employee#469>,<employee#470>,<employee#471>,<employee#472>]},{"name":"Lpjaya","managees":[]},{"name":"Eyfihwryhl","managees":[]},{"name":"Weyqfw","managees":[<employee#473>,<employee#474>,<employee#475>]},{"name":"Ben","managees":[]},{"name":"Vmxxxlnsnx","managees":[]},{"name":"Yle","managees":[]},{"name":"Crsuo","managees":[]},{"name":"Bad","managees":[]},{"name":"Ba","managees":[]},{"name":"Aoipjjmr","managees":[]},{"name":"Xwahxbbunw","managees":[<employee#476>,<employee#477>,<employee#478>]},{"name":"Dx","managees":[]},{"name":"Julajka","managees":[]},{"name":"Alrstwpjptz","managees":[<employee#479>]},{"name":"Cpvgjkq","managees":[]},{"name":"C","managees":[]},{"name":"D","managees":[<employee#480>,<employee#481>,<employee#482>,<employee#483>,<employee#484>,<employee#485>,<employee#486>,<employee#487>,<employee#488>,<employee#489>,<employee#490>]},{"name":"Izc","managees":[]},{"name":"Ewckvljzyi","managees":[]},{"name":"Ck","managees":[]},{"name":"Nsvc","managees":[]},{"name":"Dxvrg","managees":[]},{"name":"A","managees":[]},{"name":"S","managees":[]},{"name":"C","managees":[]},{"name":"X","managees":[]},{"name":"Zpl","managees":[]},{"name":"Ena","managees":[]},{"name":"Vaapdructa","managees":[]},{"name":"Eb","managees":[]},{"name":"Fcehbobe","managees":[]},{"name":"Binw","managees":[]},{"name":"Xvduxwbvch","managees":[]},{"name":"Du","managees":[]},{"name":"Vp","managees":[]},{"name":"Jlcs","managees":[]},{"name":"Xcvzybjbtoj","managees":[]},{"name":"W","managees":[]},{"name":"Y","managees":[]},{"name":"Awfohji","managees":[]},{"name":"D","managees":[]},{"name":"Wp","managees":[]},{"name":"Rqka","managees":[]},{"name":"Mpjr","managees":[]},{"name":"Yfbhqbywme","managees":[]},{"name":"Dmzy","managees":[]},{"name":"Wkeyt","managees":[]},{"name":"Axzo","managees":[<employee#491>,<employee#492>,<employee#493>,<employee#494>,<employee#495>,<employee#496>,<employee#497>]},{"name":"E","managees":[]},{"name":"Yklrcfbr","managees":[]},{"name":"Xhxkf","managees":[]},{"name":"Jkey","managees":[]},{"name":"Whzfjupmb","managees":[]},{"name":"Kwyzqnz","managees":[]},{"name":"Vcsnftae","managees":[]},{"name":"Nmbtgc","managees":[]},{"name":"Xrdycjgfpnc","managees":[]},{"name":"Ov","managees":[]},{"name":"Dkeypl","managees":[]},{"name":"Wc","managees":[]},{"name":"Hnmyohvi","managees":[]},{"name":"Vevxabsicq","managees":[]},{"name":"Dytxzslcwn","managees":[]},{"name":"Qqdnxbrcwbt","managees":[]},{"name":"Xd","managees":[]},{"name":"Ebxreferc","managees":[]},{"name":"Pieoxtqdddq","managees":[]},{"name":"Llyfge","managees":[]},{"name":"Samwh","managees":[]},{"name":"Xnvzd","managees":[]},{"name":"Du","managees":[]},{"name":"Jk","managees":[]},{"name":"Ausiadpnx","managees":[]},{"name":"Zdbxmabb","managees":[]},{"name":"Zhpcfojru","managees":[]},{"name":"Na","managees":[]},{"name":"Exi","managees":[]},{"name":"X","managees":[]},{"name":"Eyoifymuy","managees":[<employee#498>,<employee#499>]},{"name":"Rs","managees":[]},{"name":"Bzjwcr","managees":[]},{"name":"Adzzzri","managees":[]},{"name":"I","managees":[]},{"name":"Cqafwedco","managees":[]},{"name":"J","managees":[]},{"name":"Dapply","managees":[]},{"name":"Uecgb","managees":[<employee#500>,<employee#501>,<employee#502>]},{"name":"Joyd","managees":[]},{"name":"Cindrepp","managees":[]},{"name":"D","managees":[]},{"name":"Kvdzry","managees":[]},{"name":"Zibpzazr","managees":[]},{"name":"Plxhauwh","managees":[]},{"name":"G","managees":[]},{"name":"Kbidlqoibpl","managees":[]}]}
// • {"employee":[{"name":"Uafv","managees":[<employee#1>,<employee#2>,<employee#3>,<employee#4>]},{"name":"Ncallpeni","managees":[<employee#5>,<employee#6>,<employee#7>,<employee#8>,<employee#9>,<employee#10>,<employee#11>]},{"name":"At","managees":[<employee#12>,<employee#13>,<employee#14>,<employee#15>]},{"name":"Xgbrmzyoimz","managees":[]},{"name":"Pz","managees":[<employee#16>,<employee#17>,<employee#18>,<employee#19>,<employee#20>,<employee#21>,<employee#22>,<employee#23>,<employee#24>,<employee#25>,<employee#26>]},{"name":"D","managees":[<employee#27>]},{"name":"Dkey","managees":[]},{"name":"Y","managees":[<employee#28>]},{"name":"Rqvjtafgy","managees":[]},{"name":"Sws","managees":[]},{"name":"E","managees":[]},{"name":"Bjs","managees":[<employee#29>,<employee#30>,<employee#31>,<employee#32>,<employee#33>,<employee#34>,<employee#35>,<employee#36>]},{"name":"F","managees":[]},{"name":"Vkey","managees":[]},{"name":"Vjezexde","managees":[]},{"name":"Anca","managees":[<employee#37>,<employee#38>,<employee#39>,<employee#40>,<employee#41>,<employee#42>,<employee#43>,<employee#44>]},{"name":"Bcbcxcap","managees":[]},{"name":"Eeotryd","managees":[]},{"name":"Bproto","managees":[]},{"name":"Eohdhcjhj","managees":[]},{"name":"Ag","managees":[<employee#45>,<employee#46>,<employee#47>,<employee#48>]},{"name":"Taavdke","managees":[<employee#49>,<employee#50>,<employee#51>,<employee#52>,<employee#53>]},{"name":"B","managees":[]},{"name":"Amugkrlfqc","managees":[]},{"name":"Mhd","managees":[]},{"name":"Vpabjawjao","managees":[]},{"name":"Xkjfgaojkq","managees":[]},{"name":"Vsrjmt","managees":[<employee#54>,<employee#55>,<employee#56>,<employee#57>,<employee#58>,<employee#59>,<employee#60>,<employee#61>,<employee#62>]},{"name":"Zcx","managees":[]},{"name":"Pqlqm","managees":[]},{"name":"E","managees":[<employee#63>,<employee#64>,<employee#65>,<employee#66>]},{"name":"Z","managees":[]},{"name":"B","managees":[]},{"name":"Yjzr","managees":[<employee#67>,<employee#68>,<employee#69>,<employee#70>]},{"name":"Pougid","managees":[]},{"name":"Capply","managees":[]},{"name":"An","managees":[<employee#71>,<employee#72>]},{"name":"Sa","managees":[]},{"name":"Kjncrxf","managees":[]},{"name":"Emdrazfhabx","managees":[]},{"name":"Udir","managees":[]},{"name":"Aplpud","managees":[]},{"name":"Aaccb","managees":[]},{"name":"Iq","managees":[]},{"name":"Dqg","managees":[]},{"name":"E","managees":[]},{"name":"Rbgkymxhfqa","managees":[]},{"name":"Dul","managees":[]},{"name":"Duisnhdmxh","managees":[]},{"name":"Fn","managees":[<employee#73>,<employee#74>]},{"name":"Dszkptfxeix","managees":[<employee#75>,<employee#76>,<employee#77>]},{"name":"Emhfwicsc","managees":[]},{"name":"Tapnbseiupg","managees":[<employee#78>,<employee#79>,<employee#80>,<employee#81>,<employee#82>,<employee#83>,<employee#84>]},{"name":"Vnjke","managees":[]},{"name":"Ptiu","managees":[]},{"name":"Sajqny","managees":[]},{"name":"Occ","managees":[]},{"name":"Z","managees":[]},{"name":"Arqgban","managees":[<employee#85>,<employee#86>,<employee#87>]},{"name":"Bmbbv","managees":[]},{"name":"Xj","managees":[]},{"name":"Efebyddg","managees":[]},{"name":"Ob","managees":[<employee#88>,<employee#89>,<employee#90>,<employee#91>,<employee#92>,<employee#93>,<employee#94>,<employee#95>,<employee#96>,<employee#97>,<employee#98>,<employee#99>]},{"name":"Xapp","managees":[]},{"name":"Lgd","managees":[<employee#100>,<employee#101>,<employee#102>]},{"name":"Eqcflrwymu","managees":[]},{"name":"E","managees":[<employee#103>,<employee#104>,<employee#105>,<employee#106>,<employee#107>]},{"name":"M","managees":[<employee#108>,<employee#109>,<employee#110>,<employee#111>,<employee#112>,<employee#113>,<employee#114>,<employee#115>]},{"name":"Yref","managees":[]},{"name":"Edcvaepw","managees":[]},{"name":"Cu","managees":[]},{"name":"Ei","managees":[]},{"name":"Obtyov","managees":[]},{"name":"Szgi","managees":[]},{"name":"Yuapplyc","managees":[<employee#116>,<employee#117>,<employee#118>,<employee#119>,<employee#120>,<employee#121>]},{"name":"Dzxf","managees":[]},{"name":"Mycl","managees":[]},{"name":"Zkleacgoxpp","managees":[]},{"name":"Vxcvuy","managees":[]},{"name":"D","managees":[]},{"name":"Hcglvp","managees":[]},{"name":"Om","managees":[<employee#122>,<employee#123>,<employee#124>]},{"name":"Wczfede","managees":[]},{"name":"Zamvq","managees":[<employee#125>,<employee#126>,<employee#127>,<employee#128>,<employee#129>,<employee#130>,<employee#131>,<employee#132>,<employee#133>,<employee#134>]},{"name":"Alength","managees":[]},{"name":"Vvzik","managees":[]},{"name":"Stm","managees":[<employee#135>,<employee#136>,<employee#137>,<employee#138>,<employee#139>,<employee#140>,<employee#141>,<employee#142>,<employee#143>,<employee#144>,<employee#145>]},{"name":"I","managees":[]},{"name":"Ebec","managees":[]},{"name":"Bcru","managees":[]},{"name":"Xkdnexy","managees":[]},{"name":"Lvmohtfu","managees":[]},{"name":"Ca","managees":[]},{"name":"Ocyvgfi","managees":[<employee#146>,<employee#147>,<employee#148>,<employee#149>,<employee#150>,<employee#151>,<employee#152>,<employee#153>,<employee#154>,<employee#155>]},{"name":"Aj","managees":[]},{"name":"Bck","managees":[]},{"name":"C","managees":[]},{"name":"Dthr","managees":[]},{"name":"Csazea","managees":[]},{"name":"Zwdd","managees":[]},{"name":"Rntc","managees":[]},{"name":"Zmd","managees":[]},{"name":"Wive","managees":[]},{"name":"Pqlyxfff","managees":[]},{"name":"Dty","managees":[]},{"name":"Pm","managees":[]},{"name":"Gbpprefcall","managees":[]},{"name":"Cb","managees":[]},{"name":"H","managees":[<employee#156>,<employee#157>,<employee#158>,<employee#159>,<employee#160>,<employee#161>,<employee#162>,<employee#163>,<employee#164>,<employee#165>]},{"name":"Xnst","managees":[]},{"name":"Cob","managees":[]},{"name":"Evedddevadt","managees":[]},{"name":"Cref","managees":[]},{"name":"E","managees":[]},{"name":"Es","managees":[]},{"name":"Vy","managees":[]},{"name":"Ygxnqamuk","managees":[]},{"name":"Akczdqzlr","managees":[]},{"name":"Nprototype","managees":[]},{"name":"Hd","managees":[]},{"name":"Au","managees":[]},{"name":"Vjhyoz","managees":[]},{"name":"Qneyxer","managees":[]},{"name":"Zyt","managees":[]},{"name":"Mdp","managees":[]},{"name":"Wuy","managees":[]},{"name":"Utejf","managees":[]},{"name":"Zwconstruct","managees":[]},{"name":"O","managees":[]},{"name":"Dqmzfazfxa","managees":[]},{"name":"Divoewer","managees":[]},{"name":"X","managees":[]},{"name":"Mdvy","managees":[]},{"name":"Vuhv","managees":[]},{"name":"Ecpafvke","managees":[]},{"name":"Exszyo","managees":[]},{"name":"Uxjsqqtupc","managees":[<employee#166>,<employee#167>,<employee#168>,<employee#169>]},{"name":"Lp","managees":[]},{"name":"Dcwht","managees":[]},{"name":"Ykocfb","managees":[]},{"name":"G","managees":[]},{"name":"I","managees":[]},{"name":"X","managees":[]},{"name":"Ql","managees":[]},{"name":"B","managees":[]},{"name":"E","managees":[]},{"name":"Yl","managees":[]},{"name":"Ozvpro","managees":[]},{"name":"Yb","managees":[]},{"name":"Fi","managees":[]},{"name":"Zkey","managees":[]},{"name":"Wcdvhxjtwew","managees":[]},{"name":"Oed","managees":[]},{"name":"Cre","managees":[]},{"name":"M","managees":[]},{"name":"Zk","managees":[]},{"name":"Y","managees":[]},{"name":"Wapply","managees":[]},{"name":"Bzdzw","managees":[]},{"name":"Dlwydycd","managees":[]},{"name":"Ilbz","managees":[]},{"name":"Wgrjvje","managees":[]},{"name":"Tqaoltbcxr","managees":[]},{"name":"Vejt","managees":[]},{"name":"Nx","managees":[]},{"name":"Xdrceabcee","managees":[]},{"name":"Ypfflyxei","managees":[]},{"name":"Nvu","managees":[]},{"name":"V","managees":[]},{"name":"Znqm","managees":[]}]}
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
// TLDR, We define one binary tree made of nodes. Each node will have zero or two children. Each node is a descendant of the first node. Nodes will be referenced at most once because of the 'exclusive' strategy.
// Extra remarks:
// - We only define trees, there are no cycles.
// ↳ We could have allowed cycles (not trees anymore) by changing the strategy to 'successor' or 'any'.
// - We only have one tree.
// ↳ We could have asked for multiple unrelated trees by dropping our constraint on initialPoolConstraints or tweaking it.
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
