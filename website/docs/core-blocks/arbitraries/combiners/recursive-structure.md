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
- `unicityConstraints?` — _define unicity rules for each kind of entity by providing a selector function, two entities of the same kind will be considered as being incompatible if their outputs are equal for `Object.is`_
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
// • {"node":[{"id":"Sp","linkTo":[<node#0>,<node#1>,<node#2>,<node#3>,<node#4>,<node#5>]},{"id":"Scziyybceal","linkTo":[<node#4>,<node#0>,<node#5>,<node#2>,<node#6>]},{"id":"Apkltuab","linkTo":[<node#1>,<node#2>,<node#7>,<node#6>]},{"id":"Yn","linkTo":[<node#2>]},{"id":"S","linkTo":[<node#1>,<node#0>,<node#5>,<node#6>]},{"id":"Wddc","linkTo":[]},{"id":"Mh","linkTo":[]},{"id":"Zub","linkTo":[<node#6>,<node#8>,<node#2>,<node#1>,<node#0>,<node#5>,<node#7>,<node#4>,<node#9>]},{"id":"Y","linkTo":[<node#3>,<node#6>,<node#8>,<node#10>,<node#9>,<node#7>,<node#0>,<node#5>,<node#1>,<node#4>]},{"id":"Begw","linkTo":[]},{"id":"Ednakec","linkTo":[]}]}
// • {"node":[{"id":"Oarguments","linkTo":[<node#0>,<node#1>,<node#2>,<node#3>,<node#4>,<node#5>]},{"id":"Ffzk","linkTo":[<node#5>,<node#2>,<node#1>,<node#4>,<node#0>,<node#6>,<node#7>,<node#8>,<node#9>]},{"id":"Xe","linkTo":[<node#4>,<node#3>,<node#0>,<node#1>,<node#2>,<node#6>,<node#5>,<node#7>,<node#8>]},{"id":"Zarguments","linkTo":[<node#8>,<node#6>,<node#0>,<node#9>,<node#3>,<node#1>,<node#5>]},{"id":"Hcwyeygjpo","linkTo":[<node#7>,<node#9>,<node#8>,<node#6>,<node#5>,<node#10>,<node#4>,<node#3>,<node#1>,<node#2>]},{"id":"Ed","linkTo":[]},{"id":"Wcaller","linkTo":[]},{"id":"Xvz","linkTo":[<node#2>,<node#6>,<node#8>,<node#10>]},{"id":"Dryzdsxja","linkTo":[<node#10>,<node#8>,<node#9>,<node#1>,<node#2>,<node#4>,<node#5>,<node#0>,<node#3>,<node#11>,<node#6>,<node#7>]},{"id":"Dxmzwrjicoa","linkTo":[<node#4>,<node#6>]},{"id":"Bwoorugv","linkTo":[<node#11>,<node#4>,<node#0>,<node#3>,<node#5>]},{"id":"Eamjkuym","linkTo":[<node#0>,<node#8>,<node#2>]}]}
// • {"node":[{"id":"Cetc","linkTo":[<node#0>,<node#1>,<node#2>,<node#3>,<node#4>,<node#5>,<node#6>,<node#7>]},{"id":"Wco","linkTo":[]},{"id":"Jref","linkTo":[<node#5>,<node#0>,<node#7>,<node#8>,<node#3>,<node#9>,<node#1>]},{"id":"Bro","linkTo":[<node#10>,<node#6>]},{"id":"Ax","linkTo":[<node#0>,<node#2>,<node#10>,<node#7>,<node#1>,<node#5>,<node#3>]},{"id":"Mhwsb","linkTo":[<node#9>,<node#4>,<node#5>]},{"id":"Deqqjbyfkq","linkTo":[<node#2>,<node#7>,<node#3>,<node#8>]},{"id":"W","linkTo":[<node#2>,<node#11>,<node#9>,<node#8>,<node#1>,<node#7>]},{"id":"Kap","linkTo":[<node#0>,<node#6>]},{"id":"Hf","linkTo":[]},{"id":"Xlength","linkTo":[]},{"id":"F","linkTo":[]}]}
// • {"node":[{"id":"Eo","linkTo":[<node#0>]}]}
// • {"node":[{"id":"Xzstljb","linkTo":[<node#1>,<node#0>]},{"id":"E","linkTo":[<node#1>,<node#2>,<node#0>]},{"id":"Wsuypcgo","linkTo":[<node#0>,<node#1>,<node#3>]},{"id":"Vloj","linkTo":[]}]}
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
// • {"employee":[{"name":"Srlu","managees":[<employee#1>,<employee#2>]},{"name":"Byneaxappl","managees":[<employee#3>,<employee#4>,<employee#5>,<employee#6>]},{"name":"Bapply","managees":[<employee#7>,<employee#8>,<employee#9>,<employee#10>,<employee#11>,<employee#12>,<employee#13>,<employee#14>,<employee#15>]},{"name":"Ze","managees":[<employee#16>,<employee#17>,<employee#18>]},{"name":"Asmbm","managees":[<employee#19>,<employee#20>]},{"name":"Baehi","managees":[]},{"name":"Zlength","managees":[<employee#21>,<employee#22>]},{"name":"Naax","managees":[<employee#23>,<employee#24>,<employee#25>]},{"name":"Ikey","managees":[]},{"name":"Bihbcjkv","managees":[<employee#26>,<employee#27>]},{"name":"Umipvsp","managees":[]},{"name":"A","managees":[<employee#28>]},{"name":"Ucargum","managees":[]},{"name":"Dxg","managees":[]},{"name":"Yqvl","managees":[<employee#29>,<employee#30>,<employee#31>,<employee#32>,<employee#33>,<employee#34>]},{"name":"Zhufbmh","managees":[]},{"name":"Bobst","managees":[<employee#35>]},{"name":"Zbe","managees":[]},{"name":"Cpthojrakpv","managees":[]},{"name":"X","managees":[<employee#36>,<employee#37>,<employee#38>,<employee#39>,<employee#40>]},{"name":"Ydfpokynsg","managees":[]},{"name":"Ynfh","managees":[]},{"name":"Ra","managees":[<employee#41>]},{"name":"Vexkdc","managees":[]},{"name":"Etiylxgapti","managees":[]},{"name":"Oecugzhwp","managees":[]},{"name":"D","managees":[]},{"name":"Xt","managees":[]},{"name":"Bbind","managees":[]},{"name":"Qqxy","managees":[]},{"name":"Act","managees":[<employee#42>]},{"name":"Ddflxfmg","managees":[<employee#43>,<employee#44>,<employee#45>,<employee#46>,<employee#47>,<employee#48>,<employee#49>,<employee#50>]},{"name":"Zwkuipchzd","managees":[<employee#51>,<employee#52>,<employee#53>,<employee#54>]},{"name":"Bdbynwqez","managees":[<employee#55>,<employee#56>,<employee#57>,<employee#58>,<employee#59>,<employee#60>,<employee#61>,<employee#62>,<employee#63>,<employee#64>,<employee#65>]},{"name":"Rsiv","managees":[]},{"name":"Ljxssw","managees":[]},{"name":"Cwvlsrz","managees":[<employee#66>,<employee#67>]},{"name":"Cnvxpkgnc","managees":[]},{"name":"Flkkkjvhcv","managees":[]},{"name":"Vpkeydjleng","managees":[<employee#68>,<employee#69>,<employee#70>,<employee#71>,<employee#72>,<employee#73>,<employee#74>,<employee#75>,<employee#76>,<employee#77>,<employee#78>,<employee#79>]},{"name":"Emmz","managees":[]},{"name":"Ddkzlomfwa","managees":[]},{"name":"Dhef","managees":[<employee#80>,<employee#81>,<employee#82>,<employee#83>]},{"name":"Barguments","managees":[]},{"name":"Ybind","managees":[<employee#84>,<employee#85>,<employee#86>,<employee#87>,<employee#88>,<employee#89>,<employee#90>,<employee#91>,<employee#92>,<employee#93>]},{"name":"Ka","managees":[]},{"name":"Vccpjacbj","managees":[]},{"name":"Oczmoyapnc","managees":[]},{"name":"Na","managees":[]},{"name":"Huixx","managees":[<employee#94>]},{"name":"Qeaa","managees":[]},{"name":"Xe","managees":[]},{"name":"Et","managees":[]},{"name":"Apvatda","managees":[<employee#95>,<employee#96>,<employee#97>]},{"name":"Jcallerd","managees":[<employee#98>,<employee#99>,<employee#100>,<employee#101>,<employee#102>,<employee#103>,<employee#104>,<employee#105>,<employee#106>,<employee#107>,<employee#108>,<employee#109>]},{"name":"Bef","managees":[]},{"name":"Xwcqdywdeg","managees":[<employee#110>,<employee#111>,<employee#112>,<employee#113>,<employee#114>,<employee#115>,<employee#116>,<employee#117>,<employee#118>,<employee#119>,<employee#120>]},{"name":"Inomfaisi","managees":[]},{"name":"Ewev","managees":[]},{"name":"Mtctnnxn","managees":[]},{"name":"Bejryck","managees":[]},{"name":"Zxna","managees":[]},{"name":"Feqa","managees":[]},{"name":"Sevrwlz","managees":[]},{"name":"Ayarguments","managees":[]},{"name":"Bkey","managees":[]},{"name":"Ah","managees":[]},{"name":"Fopb","managees":[]},{"name":"Vwneawz","managees":[]},{"name":"Ve","managees":[]},{"name":"Zca","managees":[<employee#121>,<employee#122>,<employee#123>,<employee#124>,<employee#125>,<employee#126>,<employee#127>,<employee#128>]},{"name":"Wprotot","managees":[<employee#129>,<employee#130>,<employee#131>,<employee#132>,<employee#133>,<employee#134>,<employee#135>,<employee#136>,<employee#137>,<employee#138>,<employee#139>]},{"name":"Y","managees":[]},{"name":"Bxiuihee","managees":[]},{"name":"Rp","managees":[]},{"name":"Weuilvsjckz","managees":[]},{"name":"Ndkze","managees":[]},{"name":"Lsrkdk","managees":[]},{"name":"Cp","managees":[]},{"name":"Aipb","managees":[]},{"name":"Gcg","managees":[]},{"name":"Iref","managees":[]},{"name":"Rfty","managees":[]},{"name":"Dkaaw","managees":[]},{"name":"Cvw","managees":[]},{"name":"Gkzoz","managees":[]},{"name":"Xkbu","managees":[]},{"name":"W","managees":[]},{"name":"Eoqh","managees":[]},{"name":"Vrif","managees":[]},{"name":"Wwlfk","managees":[<employee#140>,<employee#141>,<employee#142>,<employee#143>,<employee#144>]},{"name":"Vtezjcdzycb","managees":[]},{"name":"Clzeg","managees":[]},{"name":"C","managees":[]},{"name":"Esorkqze","managees":[]},{"name":"Bxvwoigyy","managees":[]},{"name":"Gw","managees":[]},{"name":"Bm","managees":[]},{"name":"Ycal","managees":[]},{"name":"Scjplx","managees":[]},{"name":"Xx","managees":[]},{"name":"Klcvzmzcyio","managees":[]},{"name":"Fr","managees":[]},{"name":"E","managees":[]},{"name":"Nionk","managees":[<employee#145>,<employee#146>,<employee#147>,<employee#148>,<employee#149>]},{"name":"Feefvl","managees":[]},{"name":"Dig","managees":[]},{"name":"Zngtprototy","managees":[]},{"name":"Lxat","managees":[]},{"name":"Clqqhatifq","managees":[]},{"name":"Ekxifsh","managees":[]},{"name":"Xaxzujmxvn","managees":[]},{"name":"Yd","managees":[]},{"name":"Xyi","managees":[]},{"name":"Bls","managees":[]},{"name":"Vbbwk","managees":[]},{"name":"Brywcalle","managees":[]},{"name":"Zpxfkte","managees":[]},{"name":"Nyy","managees":[]},{"name":"Db","managees":[]},{"name":"Vme","managees":[]},{"name":"Ano","managees":[<employee#150>,<employee#151>,<employee#152>,<employee#153>,<employee#154>,<employee#155>,<employee#156>,<employee#157>,<employee#158>,<employee#159>,<employee#160>,<employee#161>]},{"name":"Cdg","managees":[]},{"name":"Xpyeywo","managees":[]},{"name":"Jwxxvunmpbv","managees":[]},{"name":"Cqubn","managees":[]},{"name":"Dywovqrpmvk","managees":[]},{"name":"Gczefrktq","managees":[]},{"name":"Zbkeyefuc","managees":[]},{"name":"Adxcjeu","managees":[]},{"name":"Ubbfj","managees":[]},{"name":"Nztofb","managees":[]},{"name":"Aca","managees":[]},{"name":"Oekr","managees":[]},{"name":"Onf","managees":[]},{"name":"Vca","managees":[]},{"name":"Mdc","managees":[]},{"name":"Avbg","managees":[]},{"name":"Ecr","managees":[]},{"name":"Stbdealzdc","managees":[]},{"name":"Oconstru","managees":[]},{"name":"Buiupq","managees":[]},{"name":"Cbv","managees":[]},{"name":"Mbojlnuzagm","managees":[]},{"name":"Xzcfhuqgi","managees":[<employee#162>,<employee#163>,<employee#164>,<employee#165>,<employee#166>,<employee#167>,<employee#168>,<employee#169>,<employee#170>,<employee#171>,<employee#172>,<employee#173>]},{"name":"Arc","managees":[]},{"name":"Jthuoooai","managees":[]},{"name":"Sgadeidzgdc","managees":[]},{"name":"Clvredwv","managees":[]},{"name":"Dwuc","managees":[]},{"name":"Axqx","managees":[]},{"name":"Ds","managees":[]},{"name":"U","managees":[]},{"name":"Ecaller","managees":[]},{"name":"Pu","managees":[]},{"name":"Bkpmebrhw","managees":[]},{"name":"Pnpmqzln","managees":[]},{"name":"Eqabywqz","managees":[]},{"name":"Yrqammgdp","managees":[]},{"name":"Dzfkbwqxk","managees":[]},{"name":"Zrlengthkr","managees":[]},{"name":"Qvc","managees":[]},{"name":"Ckey","managees":[]},{"name":"Xco","managees":[]},{"name":"Hqm","managees":[]},{"name":"Rdvgdtc","managees":[]},{"name":"Het","managees":[]},{"name":"Djvysgwujt","managees":[]},{"name":"Abq","managees":[]},{"name":"Wic","managees":[]},{"name":"Dln","managees":[<employee#174>]},{"name":"Cjg","managees":[]},{"name":"Bwseeojyxi","managees":[]},{"name":"Carguments","managees":[]},{"name":"Fcyxvvg","managees":[]}]}
// • {"employee":[{"name":"Lzbindaoewz","managees":[<employee#1>,<employee#2>,<employee#3>,<employee#4>,<employee#5>,<employee#6>]},{"name":"Zzxywwrey","managees":[<employee#7>,<employee#8>,<employee#9>,<employee#10>,<employee#11>,<employee#12>,<employee#13>,<employee#14>,<employee#15>]},{"name":"Bycslhwru","managees":[<employee#16>,<employee#17>]},{"name":"Dpwvolh","managees":[<employee#18>,<employee#19>,<employee#20>,<employee#21>,<employee#22>]},{"name":"I","managees":[<employee#23>,<employee#24>]},{"name":"V","managees":[<employee#25>,<employee#26>,<employee#27>,<employee#28>,<employee#29>,<employee#30>,<employee#31>,<employee#32>,<employee#33>]},{"name":"Are","managees":[<employee#34>,<employee#35>,<employee#36>,<employee#37>,<employee#38>,<employee#39>,<employee#40>,<employee#41>,<employee#42>,<employee#43>,<employee#44>,<employee#45>]},{"name":"Dfnsevbcr","managees":[]},{"name":"Jmdyh","managees":[]},{"name":"Cqheohyy","managees":[]},{"name":"Dwn","managees":[<employee#46>,<employee#47>,<employee#48>]},{"name":"Mj","managees":[]},{"name":"Uexhbx","managees":[<employee#49>,<employee#50>,<employee#51>,<employee#52>,<employee#53>,<employee#54>,<employee#55>,<employee#56>]},{"name":"Ehigqoqhb","managees":[]},{"name":"Bh","managees":[]},{"name":"Kdce","managees":[<employee#57>,<employee#58>,<employee#59>,<employee#60>]},{"name":"Bmpg","managees":[]},{"name":"Vlengthilen","managees":[]},{"name":"Mconstructo","managees":[]},{"name":"J","managees":[]},{"name":"Kbw","managees":[]},{"name":"Skrcjvxhe","managees":[<employee#61>,<employee#62>,<employee#63>,<employee#64>,<employee#65>,<employee#66>,<employee#67>,<employee#68>,<employee#69>,<employee#70>,<employee#71>]},{"name":"Enk","managees":[<employee#72>,<employee#73>,<employee#74>,<employee#75>,<employee#76>,<employee#77>,<employee#78>,<employee#79>,<employee#80>,<employee#81>,<employee#82>]},{"name":"Ykdonasc","managees":[<employee#83>,<employee#84>,<employee#85>,<employee#86>,<employee#87>,<employee#88>,<employee#89>]},{"name":"Wq","managees":[<employee#90>,<employee#91>,<employee#92>,<employee#93>,<employee#94>,<employee#95>,<employee#96>]},{"name":"Abmxdbxzddb","managees":[]},{"name":"Ep","managees":[]},{"name":"Vszz","managees":[]},{"name":"Cd","managees":[<employee#97>,<employee#98>,<employee#99>,<employee#100>,<employee#101>,<employee#102>,<employee#103>,<employee#104>,<employee#105>,<employee#106>]},{"name":"Ac","managees":[<employee#107>,<employee#108>,<employee#109>,<employee#110>]},{"name":"Z","managees":[]},{"name":"B","managees":[]},{"name":"Ahqupu","managees":[<employee#111>,<employee#112>,<employee#113>,<employee#114>,<employee#115>,<employee#116>]},{"name":"Zddbxqplpr","managees":[]},{"name":"Vwnflqqdyju","managees":[]},{"name":"Dozvj","managees":[]},{"name":"Edqu","managees":[<employee#117>,<employee#118>,<employee#119>,<employee#120>,<employee#121>,<employee#122>,<employee#123>,<employee#124>]},{"name":"P","managees":[]},{"name":"Qapply","managees":[<employee#125>,<employee#126>,<employee#127>,<employee#128>,<employee#129>,<employee#130>,<employee#131>,<employee#132>,<employee#133>,<employee#134>]},{"name":"Cyqxvnwhgi","managees":[<employee#135>,<employee#136>,<employee#137>,<employee#138>,<employee#139>,<employee#140>]},{"name":"Aa","managees":[]},{"name":"Bocqrzq","managees":[<employee#141>,<employee#142>,<employee#143>,<employee#144>,<employee#145>,<employee#146>,<employee#147>,<employee#148>,<employee#149>]},{"name":"Blutezax","managees":[<employee#150>]},{"name":"Rd","managees":[<employee#151>,<employee#152>,<employee#153>,<employee#154>]},{"name":"Qrnzf","managees":[]},{"name":"Pkcwxdcq","managees":[]},{"name":"Ysvefe","managees":[<employee#155>]},{"name":"Yncqxzzhtg","managees":[]},{"name":"Mscz","managees":[]},{"name":"Bk","managees":[]},{"name":"Ap","managees":[]},{"name":"Xpro","managees":[]},{"name":"Adiwa","managees":[]},{"name":"Axxcdlboyua","managees":[]},{"name":"Bnhbo","managees":[]},{"name":"Darguments","managees":[]},{"name":"E","managees":[]},{"name":"L","managees":[]},{"name":"Vler","managees":[]},{"name":"Cengt","managees":[]},{"name":"Yrxbkmupat","managees":[]},{"name":"Vgafwkfkpol","managees":[]},{"name":"D","managees":[]},{"name":"Rktdxft","managees":[]},{"name":"Ergi","managees":[]},{"name":"Sd","managees":[]},{"name":"Bqllzrt","managees":[]},{"name":"Oagwenseyr","managees":[]},{"name":"Cry","managees":[]},{"name":"Dsv","managees":[]},{"name":"Yqyrogjk","managees":[]},{"name":"Aaven","managees":[<employee#156>,<employee#157>,<employee#158>,<employee#159>,<employee#160>,<employee#161>,<employee#162>,<employee#163>,<employee#164>]},{"name":"Ut","managees":[<employee#165>]},{"name":"Cdjpfb","managees":[]},{"name":"Ryda","managees":[]},{"name":"Evc","managees":[]},{"name":"Zkvvrxnp","managees":[]},{"name":"Wtzc","managees":[<employee#166>,<employee#167>]},{"name":"Bs","managees":[<employee#168>,<employee#169>,<employee#170>,<employee#171>,<employee#172>,<employee#173>,<employee#174>,<employee#175>,<employee#176>]},{"name":"Exn","managees":[]},{"name":"Eargumen","managees":[]},{"name":"Lzbv","managees":[]},{"name":"Vikeeze","managees":[]},{"name":"Ckeylen","managees":[<employee#177>,<employee#178>,<employee#179>,<employee#180>,<employee#181>,<employee#182>]},{"name":"Cxza","managees":[]},{"name":"Hbgbrb","managees":[]},{"name":"Ckey","managees":[<employee#183>,<employee#184>]},{"name":"Idkwb","managees":[<employee#185>,<employee#186>,<employee#187>,<employee#188>]},{"name":"Zcallappl","managees":[<employee#189>,<employee#190>,<employee#191>,<employee#192>,<employee#193>]},{"name":"Nrxe","managees":[]},{"name":"Lnbua","managees":[]},{"name":"Oxx","managees":[]},{"name":"S","managees":[]},{"name":"W","managees":[]},{"name":"Dfctghvhk","managees":[]},{"name":"Frqe","managees":[]},{"name":"We","managees":[]},{"name":"Qsmxniz","managees":[]},{"name":"Ruwchikk","managees":[]},{"name":"Zygkzpil","managees":[<employee#194>,<employee#195>,<employee#196>,<employee#197>,<employee#198>,<employee#199>,<employee#200>,<employee#201>,<employee#202>]},{"name":"Downame","managees":[]},{"name":"Xxoqdkjczq","managees":[]},{"name":"Azg","managees":[]},{"name":"Nupndfbu","managees":[]},{"name":"Y","managees":[]},{"name":"Cozlllerbca","managees":[]},{"name":"Hecexfaeia","managees":[<employee#203>,<employee#204>,<employee#205>,<employee#206>]},{"name":"Nijf","managees":[<employee#207>,<employee#208>]},{"name":"Wbind","managees":[<employee#209>,<employee#210>,<employee#211>]},{"name":"Jkey","managees":[]},{"name":"Nnyeirsnea","managees":[<employee#212>]},{"name":"Sbindxec","managees":[]},{"name":"Yuln","managees":[]},{"name":"Bbunqsxvngi","managees":[<employee#213>]},{"name":"Zkv","managees":[]},{"name":"Xgeui","managees":[<employee#214>,<employee#215>,<employee#216>,<employee#217>,<employee#218>,<employee#219>,<employee#220>,<employee#221>,<employee#222>]},{"name":"Vyruttm","managees":[]},{"name":"Bbevlsuio","managees":[]},{"name":"Eruza","managees":[<employee#223>,<employee#224>,<employee#225>,<employee#226>,<employee#227>,<employee#228>,<employee#229>,<employee#230>]},{"name":"Kqbi","managees":[]},{"name":"Ruvbca","managees":[<employee#231>]},{"name":"Cycywadtnbi","managees":[]},{"name":"X","managees":[<employee#232>,<employee#233>,<employee#234>,<employee#235>]},{"name":"Zjhn","managees":[]},{"name":"Csvkhd","managees":[<employee#236>]},{"name":"Znyr","managees":[]},{"name":"Osoogdg","managees":[<employee#237>,<employee#238>,<employee#239>,<employee#240>,<employee#241>,<employee#242>,<employee#243>,<employee#244>]},{"name":"Chqggpy","managees":[]},{"name":"Aiqajzvud","managees":[]},{"name":"Cincallwzey","managees":[]},{"name":"Froamapp","managees":[]},{"name":"Cbi","managees":[<employee#245>,<employee#246>,<employee#247>,<employee#248>,<employee#249>,<employee#250>]},{"name":"Ix","managees":[]},{"name":"Dmmsd","managees":[]},{"name":"Bwtpsoz","managees":[]},{"name":"Ztf","managees":[]},{"name":"Acaller","managees":[]},{"name":"Cwlvmoerou","managees":[]},{"name":"And","managees":[]},{"name":"Gqhlnc","managees":[]},{"name":"Crrm","managees":[]},{"name":"C","managees":[]},{"name":"Onfdea","managees":[<employee#251>,<employee#252>,<employee#253>,<employee#254>,<employee#255>,<employee#256>]},{"name":"Breb","managees":[]},{"name":"Awacnn","managees":[]},{"name":"Ecd","managees":[]},{"name":"Fa","managees":[]},{"name":"Azy","managees":[]},{"name":"O","managees":[]},{"name":"Tnsussvk","managees":[]},{"name":"Eplfecxlp","managees":[]},{"name":"Wg","managees":[]},{"name":"Scbqz","managees":[]},{"name":"Ekey","managees":[<employee#257>,<employee#258>,<employee#259>,<employee#260>,<employee#261>,<employee#262>,<employee#263>]},{"name":"Nninhmb","managees":[]},{"name":"Eref","managees":[<employee#264>,<employee#265>,<employee#266>,<employee#267>,<employee#268>,<employee#269>,<employee#270>]},{"name":"Eapply","managees":[<employee#271>,<employee#272>,<employee#273>,<employee#274>,<employee#275>,<employee#276>,<employee#277>]},{"name":"Xissq","managees":[]},{"name":"Xjqgutkgcdh","managees":[]},{"name":"Jxohzpc","managees":[]},{"name":"Zname","managees":[]},{"name":"Segas","managees":[]},{"name":"Dn","managees":[]},{"name":"Enqbc","managees":[<employee#278>,<employee#279>,<employee#280>,<employee#281>]},{"name":"Vrcobacdrrn","managees":[]},{"name":"Fk","managees":[]},{"name":"Wt","managees":[]},{"name":"Cscevmwhqg","managees":[]},{"name":"Xmp","managees":[]},{"name":"Rl","managees":[]},{"name":"Arnznwv","managees":[]},{"name":"Yfnxokalep","managees":[]},{"name":"Enrjh","managees":[]},{"name":"Skuam","managees":[]},{"name":"Cdar","managees":[]},{"name":"Gdv","managees":[]},{"name":"Xzheucrfgx","managees":[]},{"name":"Khy","managees":[<employee#282>,<employee#283>,<employee#284>,<employee#285>,<employee#286>]},{"name":"Eknwbnh","managees":[]},{"name":"Yif","managees":[]},{"name":"Wwzpz","managees":[]},{"name":"Bo","managees":[]},{"name":"Mw","managees":[]},{"name":"Yzc","managees":[]},{"name":"Ecgebbve","managees":[]},{"name":"Zc","managees":[]},{"name":"Ailsbmjoq","managees":[]},{"name":"Cf","managees":[]},{"name":"War","managees":[]},{"name":"Audjrxkamg","managees":[]},{"name":"Fzregqhaxro","managees":[]},{"name":"Gtezaizhwm","managees":[]},{"name":"Abcwo","managees":[]},{"name":"Xzn","managees":[]},{"name":"Cnbyblawjck","managees":[]},{"name":"Vqjurawckc","managees":[]},{"name":"Ae","managees":[]},{"name":"Yencna","managees":[]},{"name":"Tzcc","managees":[]},{"name":"Dbv","managees":[]},{"name":"Wzwoh","managees":[]},{"name":"Vqme","managees":[]},{"name":"Wqed","managees":[]},{"name":"Ptwa","managees":[]},{"name":"Renc","managees":[]},{"name":"Eytkaql","managees":[]},{"name":"Ecobomxt","managees":[]},{"name":"Dapply","managees":[]},{"name":"Fwhd","managees":[]},{"name":"Yxw","managees":[]},{"name":"Newytkdl","managees":[]},{"name":"Jaf","managees":[]},{"name":"Xvq","managees":[<employee#287>,<employee#288>,<employee#289>]},{"name":"Tti","managees":[]},{"name":"Agb","managees":[]},{"name":"Eja","managees":[]},{"name":"Nbdkeyzcon","managees":[]},{"name":"Ra","managees":[]},{"name":"Aanbind","managees":[<employee#290>,<employee#291>,<employee#292>,<employee#293>]},{"name":"Chcddv","managees":[]},{"name":"Lpumenthc","managees":[<employee#294>,<employee#295>,<employee#296>,<employee#297>,<employee#298>,<employee#299>,<employee#300>,<employee#301>,<employee#302>,<employee#303>]},{"name":"Bevb","managees":[]},{"name":"Jadaudtxyb","managees":[]},{"name":"Vn","managees":[]},{"name":"Bd","managees":[]},{"name":"Wwptbmblz","managees":[]},{"name":"Zuk","managees":[]},{"name":"Aida","managees":[]},{"name":"Ccz","managees":[<employee#304>,<employee#305>,<employee#306>]},{"name":"Xsd","managees":[]},{"name":"Afedfluuosg","managees":[]},{"name":"Tnd","managees":[]},{"name":"Ohmx","managees":[]},{"name":"Hxexxcvr","managees":[]},{"name":"Bbtpopucg","managees":[]},{"name":"Cmfgafwzdca","managees":[]},{"name":"An","managees":[]},{"name":"Cevaqzkn","managees":[]},{"name":"Eky","managees":[<employee#307>,<employee#308>,<employee#309>]},{"name":"Brrfgq","managees":[]},{"name":"Harguments","managees":[]},{"name":"Aballe","managees":[]},{"name":"Vtp","managees":[]},{"name":"Eayxepv","managees":[]},{"name":"Vcyuyh","managees":[]},{"name":"Cqa","managees":[]},{"name":"Hlokfchje","managees":[]},{"name":"Znamvbxo","managees":[]},{"name":"Oksdhlgarbl","managees":[]},{"name":"Q","managees":[]},{"name":"Bremjaks","managees":[]},{"name":"Fs","managees":[]},{"name":"By","managees":[]},{"name":"Wwuqjcxck","managees":[<employee#310>,<employee#311>,<employee#312>,<employee#313>]},{"name":"Gpzbrl","managees":[]},{"name":"A","managees":[]},{"name":"Caxsaip","managees":[<employee#314>,<employee#315>,<employee#316>,<employee#317>,<employee#318>,<employee#319>,<employee#320>,<employee#321>]},{"name":"Yvsfw","managees":[]},{"name":"Zekjxctqjoa","managees":[]},{"name":"Ed","managees":[]},{"name":"Ctjpk","managees":[]},{"name":"Bkvid","managees":[]},{"name":"U","managees":[]},{"name":"Rg","managees":[]},{"name":"Kwszd","managees":[]},{"name":"Ujpqjkaqip","managees":[<employee#322>]},{"name":"Dsk","managees":[]},{"name":"Xxvzeihvry","managees":[]},{"name":"Ecu","managees":[]},{"name":"Nmkit","managees":[]},{"name":"Dw","managees":[]},{"name":"Czo","managees":[]},{"name":"Wdiatyris","managees":[]},{"name":"Ic","managees":[]},{"name":"Ejotyeall","managees":[]},{"name":"Bcaawbnledq","managees":[<employee#323>,<employee#324>,<employee#325>,<employee#326>]},{"name":"Gab","managees":[]},{"name":"R","managees":[]},{"name":"Gkey","managees":[]},{"name":"Care","managees":[<employee#327>,<employee#328>,<employee#329>,<employee#330>]},{"name":"Edaekcailz","managees":[]},{"name":"Adb","managees":[]},{"name":"Fwkeyel","managees":[]},{"name":"Eototypke","managees":[]},{"name":"Iv","managees":[]},{"name":"Ar","managees":[]},{"name":"Epl","managees":[]},{"name":"Zwds","managees":[]},{"name":"Xmlb","managees":[<employee#331>,<employee#332>]},{"name":"Xvgqaaqrb","managees":[]},{"name":"Vfk","managees":[]},{"name":"Dbw","managees":[]},{"name":"Xes","managees":[]},{"name":"Vjp","managees":[]},{"name":"Dcallerl","managees":[]},{"name":"Ylzhzeyci","managees":[]},{"name":"Cbulqhz","managees":[]},{"name":"Aqcbldfhbdk","managees":[]},{"name":"Cxzz","managees":[]},{"name":"Lbacwabxaac","managees":[]},{"name":"Rajvyawywwo","managees":[<employee#333>,<employee#334>,<employee#335>]},{"name":"Wmgok","managees":[]},{"name":"Qbh","managees":[<employee#336>,<employee#337>,<employee#338>,<employee#339>]},{"name":"Bdl","managees":[]},{"name":"Pcd","managees":[]},{"name":"Njw","managees":[]},{"name":"Yjfxugbiyt","managees":[]},{"name":"Cwgyjfyedc","managees":[]},{"name":"Qsele","managees":[]},{"name":"Dadakb","managees":[]},{"name":"Hztwt","managees":[]},{"name":"Eoe","managees":[]},{"name":"F","managees":[]},{"name":"Ndx","managees":[]},{"name":"Gname","managees":[]},{"name":"Cdllnam","managees":[]},{"name":"Bxeyconstr","managees":[]},{"name":"Acume","managees":[]},{"name":"Iec","managees":[<employee#340>,<employee#341>,<employee#342>,<employee#343>,<employee#344>,<employee#345>,<employee#346>,<employee#347>,<employee#348>]},{"name":"Aw","managees":[<employee#349>,<employee#350>,<employee#351>,<employee#352>,<employee#353>,<employee#354>]},{"name":"Bpq","managees":[]},{"name":"Xdaoexjwco","managees":[]},{"name":"Wjwarefcg","managees":[]},{"name":"Eejoe","managees":[]},{"name":"Ceyqveaurw","managees":[]},{"name":"Xhcbxcpwdfz","managees":[]},{"name":"To","managees":[]},{"name":"Uue","managees":[]},{"name":"Dzu","managees":[]},{"name":"Fxw","managees":[<employee#355>]},{"name":"Yc","managees":[]},{"name":"Doyogewoywd","managees":[]},{"name":"Cjet","managees":[]},{"name":"Huy","managees":[]},{"name":"Fr","managees":[]},{"name":"Pyx","managees":[]},{"name":"Uzc","managees":[]},{"name":"Jw","managees":[]},{"name":"Auj","managees":[]},{"name":"Aapply","managees":[<employee#356>]},{"name":"Yczv","managees":[]},{"name":"Bfqj","managees":[]},{"name":"Ec","managees":[]},{"name":"Gcjhti","managees":[]},{"name":"Vtgptzfgrhj","managees":[]},{"name":"Wgy","managees":[<employee#357>,<employee#358>,<employee#359>,<employee#360>,<employee#361>,<employee#362>,<employee#363>,<employee#364>,<employee#365>,<employee#366>,<employee#367>,<employee#368>]},{"name":"Np","managees":[]},{"name":"Dvd","managees":[]},{"name":"Dad","managees":[]},{"name":"Zqa","managees":[]},{"name":"Emmototbl","managees":[]},{"name":"Zceeeb","managees":[]},{"name":"Brttq","managees":[]},{"name":"Dy","managees":[]},{"name":"Mf","managees":[<employee#369>]},{"name":"Vglhgau","managees":[]},{"name":"Ebx","managees":[]},{"name":"Rsfenglcon","managees":[]},{"name":"Bb","managees":[]},{"name":"Mehdrtu","managees":[]},{"name":"Vtlniw","managees":[]},{"name":"Yxcadiezpr","managees":[]},{"name":"Cl","managees":[]},{"name":"Wcexxkcy","managees":[]},{"name":"Vomjcrzk","managees":[]},{"name":"Bdllpn","managees":[]},{"name":"Dav","managees":[]},{"name":"Yr","managees":[]},{"name":"Ze","managees":[]},{"name":"Edxa","managees":[]}]}
// • {"employee":[{"name":"K","managees":[<employee#1>,<employee#2>,<employee#3>,<employee#4>]},{"name":"Dnamerefeyp","managees":[<employee#5>]},{"name":"Wvxkeycyzyo","managees":[<employee#6>,<employee#7>,<employee#8>,<employee#9>,<employee#10>,<employee#11>,<employee#12>,<employee#13>,<employee#14>,<employee#15>,<employee#16>]},{"name":"Byjct","managees":[<employee#17>,<employee#18>,<employee#19>,<employee#20>,<employee#21>,<employee#22>,<employee#23>,<employee#24>]},{"name":"Dxhzcgmtq","managees":[]},{"name":"De","managees":[]},{"name":"All","managees":[<employee#25>,<employee#26>]},{"name":"Qfiikqng","managees":[]},{"name":"Yj","managees":[<employee#27>,<employee#28>,<employee#29>,<employee#30>,<employee#31>,<employee#32>,<employee#33>,<employee#34>,<employee#35>,<employee#36>,<employee#37>,<employee#38>]},{"name":"Afo","managees":[]},{"name":"Wvjhzsfex","managees":[<employee#39>,<employee#40>,<employee#41>,<employee#42>,<employee#43>,<employee#44>,<employee#45>,<employee#46>,<employee#47>,<employee#48>]},{"name":"Vbufhomgjh","managees":[]},{"name":"Exwb","managees":[<employee#49>,<employee#50>,<employee#51>,<employee#52>,<employee#53>,<employee#54>,<employee#55>,<employee#56>,<employee#57>,<employee#58>,<employee#59>,<employee#60>]},{"name":"Bre","managees":[<employee#61>,<employee#62>,<employee#63>,<employee#64>,<employee#65>,<employee#66>,<employee#67>,<employee#68>]},{"name":"Ehrthuto","managees":[]},{"name":"D","managees":[<employee#69>,<employee#70>,<employee#71>]},{"name":"Aba","managees":[]},{"name":"Xb","managees":[]},{"name":"Oiazideb","managees":[]},{"name":"Dbindahsbap","managees":[]},{"name":"Ypbioplykzv","managees":[<employee#72>,<employee#73>,<employee#74>,<employee#75>]},{"name":"Mwcw","managees":[]},{"name":"Ajohm","managees":[]},{"name":"Abiaapvffn","managees":[]},{"name":"Edz","managees":[<employee#76>,<employee#77>,<employee#78>,<employee#79>,<employee#80>,<employee#81>]},{"name":"Ovfsedc","managees":[]},{"name":"Drdddllxj","managees":[<employee#82>,<employee#83>,<employee#84>,<employee#85>,<employee#86>,<employee#87>,<employee#88>,<employee#89>,<employee#90>]},{"name":"Vqodxqvlcpg","managees":[]},{"name":"Ela","managees":[]},{"name":"Ci","managees":[]},{"name":"Bxjbiqlopw","managees":[]},{"name":"Weagzsutzh","managees":[]},{"name":"Bt","managees":[]},{"name":"Bdxdtbdmr","managees":[<employee#91>,<employee#92>,<employee#93>,<employee#94>]},{"name":"Aqts","managees":[]},{"name":"Z","managees":[<employee#95>]},{"name":"Zbhh","managees":[]},{"name":"Cb","managees":[]},{"name":"Wle","managees":[]},{"name":"Que","managees":[<employee#96>,<employee#97>,<employee#98>,<employee#99>,<employee#100>,<employee#101>,<employee#102>,<employee#103>]},{"name":"Eyxd","managees":[<employee#104>,<employee#105>,<employee#106>]},{"name":"Tdqzaogn","managees":[]},{"name":"Dayxvi","managees":[]},{"name":"Ast","managees":[<employee#107>,<employee#108>,<employee#109>,<employee#110>,<employee#111>,<employee#112>,<employee#113>]},{"name":"Dewwic","managees":[]},{"name":"Dw","managees":[]},{"name":"Bpsefxftm","managees":[]},{"name":"Tew","managees":[]},{"name":"Ryandbb","managees":[]},{"name":"Oxwfiguns","managees":[]},{"name":"Br","managees":[]},{"name":"Opzx","managees":[<employee#114>,<employee#115>,<employee#116>,<employee#117>,<employee#118>,<employee#119>,<employee#120>,<employee#121>,<employee#122>,<employee#123>,<employee#124>]},{"name":"Ah","managees":[]},{"name":"Ka","managees":[]},{"name":"Aizyf","managees":[]},{"name":"Qzyry","managees":[<employee#125>,<employee#126>,<employee#127>,<employee#128>,<employee#129>,<employee#130>,<employee#131>,<employee#132>,<employee#133>,<employee#134>]},{"name":"A","managees":[]},{"name":"Yk","managees":[]},{"name":"Lkey","managees":[]},{"name":"Wyb","managees":[<employee#135>,<employee#136>]},{"name":"Yhjw","managees":[]},{"name":"Acaller","managees":[]},{"name":"Nsvszjv","managees":[]},{"name":"Augg","managees":[]},{"name":"Ee","managees":[]},{"name":"Gnmkadfxo","managees":[]},{"name":"Xuct","managees":[<employee#137>,<employee#138>,<employee#139>]},{"name":"Vca","managees":[]},{"name":"Gsupcji","managees":[<employee#140>,<employee#141>]},{"name":"Sqq","managees":[]},{"name":"Xlyee","managees":[]},{"name":"Bbvijmzt","managees":[]},{"name":"Aznameu","managees":[]},{"name":"Dgca","managees":[<employee#142>,<employee#143>,<employee#144>]},{"name":"Bm","managees":[]},{"name":"Dpftoijzo","managees":[]},{"name":"Ckx","managees":[]},{"name":"Bcjnzrxps","managees":[]},{"name":"Xs","managees":[<employee#145>,<employee#146>,<employee#147>,<employee#148>]},{"name":"Wrifomvux","managees":[]},{"name":"Mnbmcrd","managees":[]},{"name":"I","managees":[<employee#149>,<employee#150>]},{"name":"X","managees":[]},{"name":"Aprototy","managees":[]},{"name":"Qteo","managees":[<employee#151>,<employee#152>,<employee#153>,<employee#154>,<employee#155>,<employee#156>,<employee#157>]},{"name":"Axra","managees":[]},{"name":"Vxk","managees":[]},{"name":"Hwcyjgbli","managees":[]},{"name":"Pkeyl","managees":[]},{"name":"Cvo","managees":[]},{"name":"Exfwtkjyf","managees":[]},{"name":"Eb","managees":[]},{"name":"Y","managees":[]},{"name":"Edcd","managees":[<employee#158>,<employee#159>,<employee#160>,<employee#161>,<employee#162>,<employee#163>,<employee#164>,<employee#165>,<employee#166>,<employee#167>]},{"name":"Xvlo","managees":[]},{"name":"Abhpv","managees":[]},{"name":"Zsbrhlmk","managees":[]},{"name":"Do","managees":[]},{"name":"Bslnwcq","managees":[]},{"name":"Xe","managees":[]},{"name":"Vagn","managees":[]},{"name":"Cia","managees":[]},{"name":"Hi","managees":[<employee#168>,<employee#169>,<employee#170>,<employee#171>,<employee#172>,<employee#173>,<employee#174>,<employee#175>,<employee#176>,<employee#177>,<employee#178>]},{"name":"Xdoepc","managees":[]},{"name":"Zpwkohivnyq","managees":[]},{"name":"Eksnejw","managees":[]},{"name":"O","managees":[]},{"name":"Ygeyhwjdg","managees":[]},{"name":"Q","managees":[]},{"name":"Zibiiwtzjgi","managees":[]},{"name":"Yu","managees":[]},{"name":"Jlength","managees":[]},{"name":"Wde","managees":[]},{"name":"J","managees":[]},{"name":"Yr","managees":[]},{"name":"Vst","managees":[]},{"name":"Nal","managees":[]},{"name":"Yyzxonxtjae","managees":[]},{"name":"Kscqhtyk","managees":[<employee#179>,<employee#180>,<employee#181>,<employee#182>]},{"name":"R","managees":[]},{"name":"Qwwnx","managees":[]},{"name":"Xqeogfj","managees":[<employee#183>,<employee#184>,<employee#185>,<employee#186>,<employee#187>,<employee#188>]},{"name":"G","managees":[]},{"name":"Eyo","managees":[]},{"name":"Lcycgyvcgc","managees":[]},{"name":"Anamhp","managees":[]},{"name":"Efeo","managees":[]},{"name":"Ewttde","managees":[<employee#189>]},{"name":"Elvjcqguoi","managees":[]},{"name":"Yv","managees":[]},{"name":"Ib","managees":[<employee#190>,<employee#191>,<employee#192>]},{"name":"Bud","managees":[]},{"name":"C","managees":[]},{"name":"Erpb","managees":[]},{"name":"Hdxh","managees":[]},{"name":"Bim","managees":[]},{"name":"Edrqrqi","managees":[]},{"name":"Uypstediwqd","managees":[]},{"name":"Czdkpgqsazv","managees":[]},{"name":"Dgjhzd","managees":[]},{"name":"Ab","managees":[]},{"name":"Ixe","managees":[]},{"name":"Adva","managees":[]},{"name":"Xwzi","managees":[]},{"name":"Xmvrzfz","managees":[]},{"name":"Vap","managees":[]},{"name":"Udlvokn","managees":[]},{"name":"Zke","managees":[]},{"name":"Oyaqgu","managees":[]},{"name":"Xat","managees":[]},{"name":"Tydayc","managees":[]},{"name":"Oxac","managees":[<employee#193>,<employee#194>,<employee#195>]},{"name":"Ocev","managees":[]},{"name":"Ebvgexzzwz","managees":[]},{"name":"Jjucesonm","managees":[]},{"name":"Vzle","managees":[<employee#196>]},{"name":"Eapply","managees":[]},{"name":"Jcb","managees":[]},{"name":"Dafddk","managees":[]},{"name":"Vllbal","managees":[]},{"name":"Zbtpy","managees":[]},{"name":"Jdutxfskskj","managees":[]},{"name":"Wyrlwqtrszq","managees":[]},{"name":"Isvneoekbxm","managees":[]},{"name":"Exll","managees":[]},{"name":"Dsjtsqzrlz","managees":[]},{"name":"Vulvjctp","managees":[]},{"name":"Abvolmraq","managees":[]},{"name":"Cjrojvwmilx","managees":[]},{"name":"Bjyydtvop","managees":[]},{"name":"Yqdfvhgwe","managees":[]},{"name":"Zifnujwbrro","managees":[]},{"name":"Zwapplycall","managees":[]},{"name":"Wupwpkc","managees":[]},{"name":"Dga","managees":[<employee#197>]},{"name":"Sa","managees":[]},{"name":"Scfrqjrvjgv","managees":[]},{"name":"Dgocqotaz","managees":[]},{"name":"Kxemxlrhrre","managees":[]},{"name":"Pusptfmg","managees":[]},{"name":"Xze","managees":[]},{"name":"E","managees":[]},{"name":"Eaapplyr","managees":[]},{"name":"Cwyrrncjmnz","managees":[]},{"name":"Rzrwppwn","managees":[]},{"name":"Xvc","managees":[<employee#198>,<employee#199>,<employee#200>,<employee#201>,<employee#202>,<employee#203>,<employee#204>,<employee#205>,<employee#206>,<employee#207>,<employee#208>,<employee#209>]},{"name":"Cypeprototy","managees":[]},{"name":"Ie","managees":[]},{"name":"Ozac","managees":[]},{"name":"Yad","managees":[]},{"name":"Wavmpihb","managees":[]},{"name":"Xpqnvdnd","managees":[]},{"name":"V","managees":[]},{"name":"Ga","managees":[]},{"name":"Djfmjuh","managees":[]},{"name":"Mjhmocsou","managees":[]},{"name":"Fja","managees":[]},{"name":"Adgy","managees":[]},{"name":"Gcaller","managees":[]},{"name":"Rur","managees":[]},{"name":"Chozltdqdt","managees":[]},{"name":"Gmpyivthhk","managees":[<employee#210>,<employee#211>,<employee#212>,<employee#213>,<employee#214>,<employee#215>,<employee#216>,<employee#217>,<employee#218>,<employee#219>]},{"name":"Rlov","managees":[]},{"name":"Ekey","managees":[]},{"name":"Qarguments","managees":[<employee#220>,<employee#221>,<employee#222>,<employee#223>,<employee#224>,<employee#225>]},{"name":"Wvu","managees":[]},{"name":"Ckkc","managees":[]},{"name":"Aqnycv","managees":[]},{"name":"Znxe","managees":[]},{"name":"Ulength","managees":[]},{"name":"Ywnh","managees":[]},{"name":"Qdsblgmi","managees":[]},{"name":"Ebtlhhtypja","managees":[]},{"name":"Blhanqxoa","managees":[]},{"name":"Dnw","managees":[]},{"name":"Cvx","managees":[]},{"name":"Vnmhkmtwbug","managees":[]},{"name":"Dhrqxs","managees":[]},{"name":"Ynpgxlho","managees":[]},{"name":"Ibnameref","managees":[]},{"name":"Tk","managees":[]},{"name":"Idnten","managees":[]},{"name":"Maqsap","managees":[]},{"name":"Fme","managees":[]},{"name":"Eis","managees":[]},{"name":"Bun","managees":[]}]}
// • {"employee":[{"name":"Ejrwltec","managees":[]}]}
// • {"employee":[{"name":"Wlengthj","managees":[<employee#1>,<employee#2>,<employee#3>,<employee#4>,<employee#5>,<employee#6>]},{"name":"Ebedi","managees":[<employee#7>,<employee#8>,<employee#9>,<employee#10>,<employee#11>,<employee#12>,<employee#13>,<employee#14>,<employee#15>,<employee#16>,<employee#17>]},{"name":"Earots","managees":[<employee#18>,<employee#19>,<employee#20>]},{"name":"W","managees":[]},{"name":"Gktnsqts","managees":[<employee#21>,<employee#22>,<employee#23>]},{"name":"Pkew","managees":[]},{"name":"Q","managees":[<employee#24>,<employee#25>,<employee#26>,<employee#27>,<employee#28>,<employee#29>]},{"name":"Yckkoy","managees":[]},{"name":"M","managees":[]},{"name":"An","managees":[<employee#30>,<employee#31>]},{"name":"Cmuyiz","managees":[<employee#32>,<employee#33>,<employee#34>,<employee#35>,<employee#36>,<employee#37>,<employee#38>,<employee#39>,<employee#40>,<employee#41>]},{"name":"Rv","managees":[]},{"name":"Kkca","managees":[<employee#42>,<employee#43>]},{"name":"Wccyfqdiia","managees":[]},{"name":"Ve","managees":[]},{"name":"Bbr","managees":[<employee#44>,<employee#45>,<employee#46>,<employee#47>,<employee#48>,<employee#49>]},{"name":"Pdap","managees":[]},{"name":"Dcprat","managees":[<employee#50>,<employee#51>,<employee#52>,<employee#53>,<employee#54>,<employee#55>,<employee#56>]},{"name":"Zdvycdnlix","managees":[]},{"name":"Pemthww","managees":[<employee#57>,<employee#58>,<employee#59>]},{"name":"Pp","managees":[<employee#60>]},{"name":"Aivamc","managees":[]},{"name":"Veev","managees":[]},{"name":"Lgk","managees":[]},{"name":"Msxelseyy","managees":[<employee#61>,<employee#62>,<employee#63>,<employee#64>,<employee#65>,<employee#66>]},{"name":"Xvpdsgz","managees":[]},{"name":"Zdwrzveacc","managees":[<employee#67>,<employee#68>,<employee#69>,<employee#70>,<employee#71>,<employee#72>,<employee#73>,<employee#74>,<employee#75>,<employee#76>]},{"name":"Eijnxcjbvrr","managees":[]},{"name":"Zvzimewk","managees":[]},{"name":"Vtlcyzc","managees":[<employee#77>,<employee#78>]},{"name":"Qggkw","managees":[]},{"name":"A","managees":[]},{"name":"D","managees":[]},{"name":"Cj","managees":[<employee#79>]},{"name":"Acgkeyxlea","managees":[]},{"name":"Toinkihc","managees":[]},{"name":"Abfzo","managees":[]},{"name":"Uiwwamegfca","managees":[]},{"name":"Zca","managees":[<employee#80>,<employee#81>,<employee#82>]},{"name":"Zu","managees":[]},{"name":"Wbvfck","managees":[]},{"name":"Lrv","managees":[]},{"name":"Wblavxkmsl","managees":[]},{"name":"N","managees":[]},{"name":"Awt","managees":[]},{"name":"Cac","managees":[]},{"name":"Xr","managees":[<employee#83>,<employee#84>,<employee#85>,<employee#86>,<employee#87>,<employee#88>]},{"name":"Ambpxee","managees":[]},{"name":"Edsu","managees":[<employee#89>,<employee#90>,<employee#91>,<employee#92>,<employee#93>,<employee#94>,<employee#95>]},{"name":"Izdo","managees":[]},{"name":"Ymopyunrkeu","managees":[<employee#96>,<employee#97>,<employee#98>,<employee#99>,<employee#100>,<employee#101>,<employee#102>,<employee#103>,<employee#104>,<employee#105>,<employee#106>]},{"name":"Bwhshrpihgk","managees":[<employee#107>]},{"name":"Jbde","managees":[<employee#108>,<employee#109>,<employee#110>,<employee#111>,<employee#112>,<employee#113>,<employee#114>,<employee#115>,<employee#116>]},{"name":"Apo","managees":[]},{"name":"Bxbwbnvubfc","managees":[<employee#117>,<employee#118>,<employee#119>]},{"name":"Zmtrbh","managees":[]},{"name":"Hpr","managees":[<employee#120>,<employee#121>,<employee#122>,<employee#123>,<employee#124>,<employee#125>,<employee#126>,<employee#127>]},{"name":"Wre","managees":[<employee#128>,<employee#129>,<employee#130>,<employee#131>,<employee#132>,<employee#133>,<employee#134>,<employee#135>,<employee#136>,<employee#137>]},{"name":"Bn","managees":[]},{"name":"Eekhfudj","managees":[<employee#138>,<employee#139>,<employee#140>]},{"name":"Xzqee","managees":[<employee#141>,<employee#142>,<employee#143>,<employee#144>]},{"name":"Yro","managees":[]},{"name":"Fyapplyp","managees":[<employee#145>]},{"name":"Zawadyxqlev","managees":[]},{"name":"Mzzb","managees":[]},{"name":"Ahjcrv","managees":[]},{"name":"Zcallerar","managees":[]},{"name":"Xkey","managees":[]},{"name":"T","managees":[]},{"name":"Z","managees":[<employee#146>,<employee#147>,<employee#148>]},{"name":"Bfqjphnpy","managees":[<employee#149>,<employee#150>]},{"name":"Eapply","managees":[]},{"name":"Cxd","managees":[]},{"name":"Blwypno","managees":[]},{"name":"Dhkdyacwxk","managees":[]},{"name":"Yp","managees":[]},{"name":"Cxey","managees":[<employee#151>,<employee#152>,<employee#153>,<employee#154>,<employee#155>,<employee#156>,<employee#157>,<employee#158>,<employee#159>,<employee#160>]},{"name":"Cfzfkjib","managees":[]},{"name":"Fndfjushqs","managees":[]},{"name":"Dcaller","managees":[]},{"name":"Zd","managees":[<employee#161>,<employee#162>,<employee#163>,<employee#164>,<employee#165>,<employee#166>]},{"name":"Aa","managees":[]},{"name":"Cjei","managees":[]},{"name":"Wggva","managees":[<employee#167>]},{"name":"Avhqz","managees":[]},{"name":"Efvz","managees":[]},{"name":"Cwby","managees":[]},{"name":"Cvawy","managees":[<employee#168>,<employee#169>,<employee#170>]},{"name":"Tp","managees":[]},{"name":"Ksyeick","managees":[]},{"name":"Ejdoe","managees":[]},{"name":"Wcsvjxxanw","managees":[]},{"name":"Lwbf","managees":[]},{"name":"Apibjuo","managees":[<employee#171>,<employee#172>,<employee#173>,<employee#174>,<employee#175>,<employee#176>,<employee#177>,<employee#178>,<employee#179>,<employee#180>]},{"name":"Aiqadxzzdg","managees":[<employee#181>,<employee#182>,<employee#183>,<employee#184>,<employee#185>,<employee#186>]},{"name":"Nrxceezza","managees":[]},{"name":"Snja","managees":[]},{"name":"S","managees":[]},{"name":"Vwdwydab","managees":[]},{"name":"Xidnifwwpo","managees":[]},{"name":"Gn","managees":[]},{"name":"Ialerxgla","managees":[]},{"name":"Er","managees":[]},{"name":"Sprrheffb","managees":[]},{"name":"F","managees":[]},{"name":"Mok","managees":[]},{"name":"Btylcbboku","managees":[]},{"name":"Ziby","managees":[<employee#187>,<employee#188>,<employee#189>,<employee#190>,<employee#191>,<employee#192>,<employee#193>,<employee#194>]},{"name":"Xrecwdjuqel","managees":[]},{"name":"C","managees":[]},{"name":"Avib","managees":[]},{"name":"Rnluir","managees":[]},{"name":"Dthc","managees":[]},{"name":"B","managees":[]},{"name":"Yw","managees":[]},{"name":"Vv","managees":[]},{"name":"Cpgspwkm","managees":[]},{"name":"Zwjew","managees":[]},{"name":"Zjgiyzlk","managees":[]},{"name":"Jczb","managees":[]},{"name":"Yu","managees":[]},{"name":"Ylr","managees":[]},{"name":"Gcgu","managees":[]},{"name":"Eaxkyugwlbz","managees":[]},{"name":"Wbew","managees":[]},{"name":"Zwfpkfvkvpd","managees":[]},{"name":"Mjji","managees":[]},{"name":"Xkeyargume","managees":[]},{"name":"Bdgmq","managees":[]},{"name":"Xt","managees":[]},{"name":"Febciupcfi","managees":[]},{"name":"Awddsc","managees":[]},{"name":"Erl","managees":[]},{"name":"Kktzz","managees":[]},{"name":"Lygcaabin","managees":[]},{"name":"Df","managees":[]},{"name":"Xpq","managees":[]},{"name":"Eref","managees":[]},{"name":"Kcsdqo","managees":[]},{"name":"Biy","managees":[]},{"name":"My","managees":[]},{"name":"Xhd","managees":[]},{"name":"Ke","managees":[]},{"name":"Doqlllaxpr","managees":[]},{"name":"Tqsnhlx","managees":[]},{"name":"Ywcc","managees":[]},{"name":"Emdkle","managees":[]},{"name":"Ax","managees":[]},{"name":"Vy","managees":[]},{"name":"Ywahfecz","managees":[]},{"name":"Xln","managees":[]},{"name":"K","managees":[]},{"name":"Eawpoqjfh","managees":[]},{"name":"Ckeycatbr","managees":[]},{"name":"Dhfe","managees":[]},{"name":"Yvvu","managees":[]},{"name":"Fbxbghhwos","managees":[]},{"name":"Cq","managees":[]},{"name":"Xvcb","managees":[<employee#195>,<employee#196>,<employee#197>,<employee#198>]},{"name":"Cyaoxkeyyyg","managees":[<employee#199>,<employee#200>,<employee#201>,<employee#202>,<employee#203>,<employee#204>,<employee#205>,<employee#206>,<employee#207>]},{"name":"Gkey","managees":[]},{"name":"Omakczir","managees":[]},{"name":"Pdh","managees":[]},{"name":"Kdn","managees":[]},{"name":"Ccaller","managees":[]},{"name":"Bgpluhx","managees":[]},{"name":"Rckbrbkbka","managees":[]},{"name":"Evwz","managees":[]},{"name":"Cnvzbindc","managees":[]},{"name":"Eallvewbi","managees":[]},{"name":"Dvhkgwig","managees":[]},{"name":"Vconstructo","managees":[]},{"name":"Syr","managees":[]},{"name":"Afb","managees":[]},{"name":"Bg","managees":[]},{"name":"Celayp","managees":[]},{"name":"Dgq","managees":[]},{"name":"Xd","managees":[]},{"name":"Cjjsrkjjiw","managees":[]},{"name":"Ousdcgz","managees":[]},{"name":"Klc","managees":[]},{"name":"Nsaylzer","managees":[]},{"name":"Aref","managees":[]},{"name":"Cv","managees":[]},{"name":"X","managees":[]},{"name":"Bdzpacghylf","managees":[]},{"name":"Jukp","managees":[]},{"name":"Zma","managees":[]},{"name":"Wexwrmeamn","managees":[]},{"name":"Gkot","managees":[]},{"name":"Hpdetyczfs","managees":[]},{"name":"Dynclbkbmev","managees":[]},{"name":"Rrb","managees":[]},{"name":"Exjtue","managees":[]},{"name":"Ap","managees":[]},{"name":"Clengthcjc","managees":[]},{"name":"Bodeajrwvdn","managees":[<employee#208>,<employee#209>,<employee#210>,<employee#211>,<employee#212>,<employee#213>,<employee#214>]},{"name":"Wcz","managees":[]},{"name":"Ey","managees":[]},{"name":"Hatdu","managees":[]},{"name":"Bqnisfagr","managees":[]},{"name":"Wikskjcpxr","managees":[]},{"name":"Cwjyrhif","managees":[]},{"name":"Yhr","managees":[]},{"name":"Wvrvsh","managees":[<employee#215>,<employee#216>,<employee#217>,<employee#218>,<employee#219>,<employee#220>,<employee#221>,<employee#222>,<employee#223>,<employee#224>,<employee#225>,<employee#226>]},{"name":"Xtshcblks","managees":[]},{"name":"Zkc","managees":[]},{"name":"Adoec","managees":[]},{"name":"Bewpwe","managees":[<employee#227>,<employee#228>,<employee#229>,<employee#230>,<employee#231>,<employee#232>,<employee#233>,<employee#234>,<employee#235>,<employee#236>,<employee#237>]},{"name":"Ehpvaezqwc","managees":[]},{"name":"Atqt","managees":[]},{"name":"Zbgmocdf","managees":[]},{"name":"Brp","managees":[]},{"name":"Stspl","managees":[]},{"name":"Ur","managees":[]},{"name":"Vsstxakstgu","managees":[]},{"name":"Ac","managees":[]},{"name":"Walqkxhoc","managees":[]},{"name":"Ymuiqaj","managees":[]},{"name":"Bref","managees":[]},{"name":"Cef","managees":[<employee#238>,<employee#239>,<employee#240>]},{"name":"Nb","managees":[]},{"name":"Xvywivh","managees":[]},{"name":"Vcddydtvb","managees":[]},{"name":"Obindrbin","managees":[]},{"name":"Xqnr","managees":[]},{"name":"Bqka","managees":[]},{"name":"Yb","managees":[]},{"name":"Suswm","managees":[]},{"name":"Dma","managees":[]},{"name":"Bbgrumry","managees":[]},{"name":"Axwouafxm","managees":[]},{"name":"Cbtf","managees":[]},{"name":"Ab","managees":[]},{"name":"Bc","managees":[]},{"name":"Azxw","managees":[]},{"name":"Xagtekey","managees":[<employee#241>,<employee#242>,<employee#243>,<employee#244>,<employee#245>]},{"name":"Gm","managees":[]},{"name":"Eni","managees":[]},{"name":"Aoloslkjh","managees":[]},{"name":"Xmtcegclfxe","managees":[]},{"name":"Eyazappeng","managees":[]},{"name":"Dxvu","managees":[]},{"name":"Gzmn","managees":[]},{"name":"Tndqxt","managees":[]},{"name":"Czrbe","managees":[]}]}
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
// - We are enforcing the unicity of the names for users and of ids for profiles.
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
