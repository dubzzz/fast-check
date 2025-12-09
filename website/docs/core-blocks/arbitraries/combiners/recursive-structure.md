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
// Extra remarks:
// - We are not enforcing the unicity of the names, two distinct instances of "employee" or "team" may come up with the same value of "name".
// - We only have teams that have at least one matching employee.
// ↳ But, we could have prevented it, by dropping the maxLength:0 constraint defined for team via initialPoolConstraints. By dropping it we would have allowed teams not being referenced by any employee.
// Examples of generated values:
// • {"employee":[{"name":"F","team":<team#0>}],"team":[{"name":"Wyck"}]}
// • {"employee":[{"name":"Opx","team":<team#0>}],"team":[{"name":"Zeexwzg"}]}
// • {"employee":[{"name":"Wrlhprtz","team":<team#0>},{"name":"Xv","team":<team#0>},{"name":"Href","team":<team#1>},{"name":"Cmfd","team":<team#2>},{"name":"Cntwk","team":<team#1>}],"team":[{"name":"Yklhbeoncbu"},{"name":"Pu"},{"name":"Dvnt"}]}
// • {"employee":[{"name":"Ohkumvvgf","team":<team#0>},{"name":"Epanzcfch","team":<team#0>},{"name":"Bx","team":<team#0>}],"team":[{"name":"Wca"}]}
// • {"employee":[{"name":"Yrxwa","team":<team#0>},{"name":"Una","team":<team#1>},{"name":"Asjpwudy","team":<team#0>},{"name":"Zmjl","team":<team#1>},{"name":"Z","team":<team#0>}],"team":[{"name":"Brefuqap"},{"name":"Azdyprot"}]}
// • …

fc.entityGraph(
  { employee: { name: fc.stringMatching(/^[A-Z][a-z]*$/) } },
  { employee: { manager: { arity: '0-1', type: 'employee', strategy: 'successor' } } },
  { noNullPrototype: true },
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
// • {"employee":[{"name":"Sb","manager":<employee#4>},{"name":"Mgnuulomqpz","manager":<employee#2>},{"name":"Bentck","manager":<employee#5>},{"name":"Zwysadtiri","manager":<employee#5>},{"name":"Qfzzgjqpw","manager":<employee#5>},{"name":"Wb","manager":<employee#6>},{"name":"Uxp","manager":undefined}]}
// • {"employee":[{"name":"Lwrccd","manager":<employee#1>},{"name":"Lw","manager":<employee#2>},{"name":"A","manager":<employee#3>},{"name":"Cvmjd","manager":undefined}]}
// • {"employee":[{"name":"Mbwyoevaqd","manager":<employee#1>},{"name":"Eapduphwi","manager":<employee#2>},{"name":"N","manager":<employee#3>},{"name":"Ye","manager":undefined}]}
// • {"employee":[{"name":"Zyz","manager":<employee#1>},{"name":"Yblkdqezlfj","manager":<employee#2>},{"name":"Ay","manager":<employee#3>},{"name":"E","manager":<employee#4>},{"name":"Ac","manager":undefined}]}
// • {"employee":[{"name":"Qxixobxj","manager":undefined},{"name":"Ye","manager":<employee#4>},{"name":"Bpczfxif","manager":<employee#5>},{"name":"Eb","manager":<employee#4>},{"name":"By","manager":<employee#6>},{"name":"Af","manager":<employee#6>},{"name":"Xm","manager":<employee#7>},{"name":"Ablhi","manager":<employee#8>},{"name":"Bief","manager":<employee#9>},{"name":"Fosulfs","manager":undefined}]}
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
  { initialPoolConstraints: { profile: { maxLength: 0 } }, noNullPrototype: true },
);
// TLDR, We define a structure made of users and profiles. Each user as its own profile, and we don't have any profile not being linked to a user.
// Extra remarks:
// - Every profile is linked to a user
// ↳ We could have allowed profiles not being connected to any user by dropping the maxLength:0 constraints defined on profile via initialPoolConstraints. By doing so we would allow profiles not being related to any user, while keeping the compulsory link when we have one user.
// Examples of generated values:
// • {"user":[{"name":"Ire","profile":<profile#0>},{"name":"Y","profile":<profile#1>},{"name":"Zuriwce","profile":<profile#2>},{"name":"Egym","profile":<profile#3>},{"name":"E","profile":<profile#4>},{"name":"D","profile":<profile#5>},{"name":"Dcbincl","profile":<profile#6>}],"profile":[{"id":"c655e362-0014-1000-bfff-ffec00000010","pictureUrl":"https://rvyx5dcite.oq6-f.dr"},{"id":"acf6b8e4-ffe5-8fff-8000-0006edcacef6","pictureUrl":"https://a.zc//F/o/"},{"id":"8fb31638-49fe-81a1-88f4-fc4cdb26e00c","pictureUrl":"https://ju7hm.rjy.hyc////A"},{"id":"c68cb485-0015-1000-8000-001900000010","pictureUrl":"http://49bzbn.xy/T"},{"id":"6a2b684a-0011-1000-a30e-24c60000000f","pictureUrl":"https://xr.gb/m"},{"id":"fffffff9-e2db-1823-8af9-599e4d462423","pictureUrl":"http://9uwon5eb.i9f.xre"},{"id":"b6a0bbfa-0008-1000-bfff-ffe600000010","pictureUrl":"http://4xko.syr/_///G/:/_/X"}]}
// • {"user":[{"name":"Cu","profile":<profile#0>},{"name":"Ny","profile":<profile#1>},{"name":"Ua","profile":<profile#2>},{"name":"D","profile":<profile#3>},{"name":"Clctnamcall","profile":<profile#4>},{"name":"Fdvv","profile":<profile#5>},{"name":"A","profile":<profile#6>},{"name":"D","profile":<profile#7>},{"name":"Ytjbuht","profile":<profile#8>}],"profile":[{"id":"00000015-0015-1000-8000-000268fb9e58","pictureUrl":"https://b.bbd"},{"id":"00000005-4875-4b1d-937d-5b8c00000001","pictureUrl":"https://6l8ryqy.gyf/"},{"id":"00000014-c191-6d4e-a3e8-e0ddfffffff2","pictureUrl":"http://zj5-xxel6.wq/"},{"id":"3aff4fcf-0017-1000-8000-00195f21ac12","pictureUrl":"http://0.wlengu.of"},{"id":"b6c334f4-f10f-8576-bfff-ffe915e988ff","pictureUrl":"https://q.fld.yb"},{"id":"fffffff4-13d2-4f5b-88f4-1120dc30d31c","pictureUrl":"http://ao67z.941vr6zq4.ss"},{"id":"f35c06ba-2106-6ea3-bfff-fff6ffffffea","pictureUrl":"http://54.c06-5.xf/ot%F2%B0%B5%B8:"},{"id":"ffffffea-ffe5-8fff-bfff-fffb0000000a","pictureUrl":"https://bcld0gh.hkw"},{"id":"e602a429-c301-8de2-9d0a-973b0000001d","pictureUrl":"http://si.r.av//"}]}
// • {"user":[{"name":"Aiqgspiwqk","profile":<profile#0>},{"name":"Wewfmec","profile":<profile#1>},{"name":"X","profile":<profile#2>},{"name":"Ell","profile":<profile#3>},{"name":"Yob","profile":<profile#4>},{"name":"Izcmdk","profile":<profile#5>},{"name":"L","profile":<profile#6>},{"name":"Ocallduwdc","profile":<profile#7>}],"profile":[{"id":"f194d4f2-fffa-8fff-8000-0007fffffff1","pictureUrl":"http://dgqinc.yaw/%F1%BE%BB%A2r%F2%8D%B7%98"},{"id":"d154d8ea-001d-1000-8492-3e260000001e","pictureUrl":"https://4pv4mb-8.b3c.sx"},{"id":"ffffffef-000d-1000-b8f8-d6184615fb88","pictureUrl":"http://d6.wh//"},{"id":"0000001d-e28f-3005-ba07-7a7700000019","pictureUrl":"http://fc.kz/_N"},{"id":"0000000b-015c-597f-9893-261c325872cb","pictureUrl":"https://2ivgmw7-2.s4c8.dar/g~"},{"id":"597b1994-0006-1000-8000-0009ffffffea","pictureUrl":"http://feyqt.c.bn/y//%F1%B9%93%BD////o"},{"id":"0000001a-0010-1000-8000-0017d550f770","pictureUrl":"http://6addg.cc///6//////4"},{"id":"bee39683-ffea-8fff-bf98-a295915990e4","pictureUrl":"https://4namejeby.au/J//c/,/@/J//"}]}
// • {"user":[{"name":"Uar","profile":<profile#0>},{"name":"Zspth","profile":<profile#1>},{"name":"Wcrxwfudcc","profile":<profile#2>},{"name":"Ena","profile":<profile#3>},{"name":"Rw","profile":<profile#4>},{"name":"Acdq","profile":<profile#5>},{"name":"Ckg","profile":<profile#6>},{"name":"Ckbuhlblvm","profile":<profile#7>}],"profile":[{"id":"00000004-fbec-7ca5-8d7f-62172afc8308","pictureUrl":"https://n.urg.hn"},{"id":"7a62c8db-f546-711c-8110-fbb10eab12fc","pictureUrl":"https://i9dvp.rq"},{"id":"0000001d-ffff-8fff-bfff-fffb6a9a86a5","pictureUrl":"https://dpn.rzb"},{"id":"00000009-fff8-8fff-bf9a-64ac1d43e41e","pictureUrl":"https://ied.fab//"},{"id":"0000000a-0019-1000-b02d-8a3db8b3f6f6","pictureUrl":"http://b9up8.b.pmz///S/"},{"id":"535e558c-0014-1000-b680-f6b200000015","pictureUrl":"https://6.wpz/o///////"},{"id":"00000010-0001-1000-8000-00190000001d","pictureUrl":"http://fzda95kfczs.eg/%F2%B4%92%82EFYg&cm+"},{"id":"3ffa3c13-bde6-5064-bfff-ffe300000002","pictureUrl":"https://8zs-h6ltp9t5.vzomtpnp3k.bin/%F4%8F%BB%B4"}]}
// • {"user":[{"name":"C","profile":<profile#0>},{"name":"Cuoxbprot","profile":<profile#1>},{"name":"Fbwpleng","profile":<profile#2>}],"profile":[{"id":"fffffffc-c177-8c62-9b19-afce0922f4a0","pictureUrl":"https://d.pc//1//"},{"id":"a832a6a0-e6b6-23a0-ab21-a976c92c8c98","pictureUrl":"https://98d.yv/c///!/E//"},{"id":"00000010-fff2-8fff-b4ea-6ae10000000d","pictureUrl":"http://eef.yy"}]}
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/entityGraph.html).  
Available since 4.5.0.
