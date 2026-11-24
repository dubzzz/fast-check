import type { API, FileInfo } from 'jscodeshift';
import { isFunctionExpression, isNamedProperty, withComments } from '../ast.js';
import { freshName, identifierNames } from '../bindings.js';
import { isFastCheckMember } from '../fastCheck.js';
import { resolveImport, visibleNamedImport } from '../imports.js';
import { parseFile } from '../transformFile.js';

const optionsIndex = new Map([
  ['configureGlobal', 0],
  ['assert', 1],
  ['check', 1],
  ['sample', 1],
  ['statistics', 2],
]);
const factories = ['congruential32', 'mersenne', 'xorshift128plus', 'xoroshiro128plus'];
const generatorSource = (factory: string): string => 'pure-rand/generator/' + factory;

export default function transform(file: FileInfo, api: API): string {
  const { j, root, report, print } = parseFile(file, api);
  const imports = root.find(j.ImportDeclaration);
  const names = identifierNames(j, root);
  const newFactories = new Map<string, string>();

  root.find(j.CallExpression).forEach((path) => {
    const { callee } = path.node;
    if (!isFastCheckMember(j, path, callee)) return;
    const index = optionsIndex.get(callee.property.name);
    if (index === undefined) return;
    const options = path.node.arguments[index];
    if (!j.ObjectExpression.check(options)) return;
    for (const prop of options.properties) {
      if (!isNamedProperty(j, prop) || prop.key.name !== 'randomType') continue;
      if (!j.StringLiteral.check(prop.value)) {
        if (isFunctionExpression(j, prop.value)) continue;
        const binding = resolveImport(j, path, prop.value);
        if (
          binding?.namedExport &&
          !binding.typeOnly &&
          factories.includes(binding.namedExport) &&
          binding.source === generatorSource(binding.namedExport)
        )
          continue;
        report(prop, 'Cannot migrate dynamic randomType; ensure its value is a generator factory.');
        continue;
      }
      const factory = prop.value.value === 'congruential' ? 'congruential32' : prop.value.value;
      if (!factories.includes(factory)) {
        report(prop, `Cannot migrate unknown randomType '${prop.value.value}'; choose a generator factory manually.`);
        continue;
      }
      let local =
        visibleNamedImport(j, imports, generatorSource(factory), factory, [path]) ?? newFactories.get(factory);
      if (!local) {
        local = freshName(names, factory, 'Factory');
        names.add(local);
        newFactories.set(factory, local);
      }
      prop.value = withComments(j.identifier(local), prop.value);
    }
  });
  const firstImport = imports.at(0);
  for (const [factory, local] of newFactories) {
    const spec = j.importSpecifier(j.identifier(factory), local === factory ? null : j.identifier(local));
    firstImport.insertBefore(j.importDeclaration([spec], j.stringLiteral(generatorSource(factory))));
  }
  return print();
}
