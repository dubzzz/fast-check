import type { API, FileInfo } from 'jscodeshift';
import { memberName } from '../fastCheck.js';

const optionsIndex = new Map([
  ['configureGlobal', 0],
  ['assert', 1],
  ['check', 1],
  ['sample', 1],
  ['statistics', 2],
]);
const factories = ['congruential32', 'mersenne', 'xorshift128plus', 'xoroshiro128plus'];

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  const imports = root.find(j.ImportDeclaration);
  const newFactories = new Map<string, string>();
  const names = new Set(
    root
      .find(j.Identifier)
      .nodes()
      .map((node) => node.name),
  );

  root.find(j.CallExpression).forEach((path) => {
    const index = optionsIndex.get(memberName(j, path, path.node.callee) ?? '');
    if (index === undefined) return;
    const options = path.node.arguments[index];
    if (!j.ObjectExpression.check(options)) return;
    for (const prop of options.properties) {
      if (
        !j.ObjectProperty.check(prop) ||
        prop.computed ||
        !j.Identifier.check(prop.key) ||
        prop.key.name !== 'randomType' ||
        !j.StringLiteral.check(prop.value)
      )
        continue;
      const factory = prop.value.value === 'congruential' ? 'congruential32' : prop.value.value;
      if (!factories.includes(factory)) continue;
      const source = 'pure-rand/generator/' + factory;
      const existing = imports
        .nodes()
        .filter((node) => node.source.value === source && node.importKind !== 'type')
        .flatMap((node) => node.specifiers ?? [])
        .find(
          (spec) =>
            j.ImportSpecifier.check(spec) &&
            (!('importKind' in spec) || spec.importKind !== 'type') &&
            spec.imported.name === factory &&
            j.Identifier.check(spec.local) &&
            path.scope.lookup(spec.local.name)?.getBindings()[spec.local.name]?.[0]?.parent.node === spec,
        );
      let local = j.Identifier.check(existing?.local) ? existing.local.name : newFactories.get(factory);
      if (!local) {
        local = factory;
        while (names.has(local)) local += 'Factory';
        names.add(local);
        newFactories.set(factory, local);
      }
      prop.value = Object.assign(j.identifier(local), { comments: prop.value.comments });
    }
  });
  for (const [factory, local] of newFactories) {
    const spec = j.importSpecifier(j.identifier(factory), local === factory ? null : j.identifier(local));
    imports.at(0).insertBefore(j.importDeclaration([spec], j.stringLiteral('pure-rand/generator/' + factory)));
  }
  return root.toSource({ quote: 'single' });
}
