import type { API, ASTPath, CallExpression, FileInfo, Identifier, ImportSpecifier, JSCodeshift } from 'jscodeshift';
import { awaitContext } from '../allowAwait.js';
import { findBinding, importedName, memberName } from '../fastCheck.js';
import { reportUnsupported } from '../reportUnsupported.js';

// Ignore syntactic names such as obj.property and the key in { property: value }.
function isReference(j: JSCodeshift, path: ASTPath<Identifier>): boolean {
  const parent = path.parent.node;
  if (
    j.ImportSpecifier.check(parent) ||
    j.ImportNamespaceSpecifier.check(parent) ||
    j.ImportDefaultSpecifier.check(parent)
  )
    return false;
  if (j.ExportSpecifier.check(parent) && path.name === 'exported') return false;
  if (j.MemberExpression.check(parent) && path.name === 'property' && !parent.computed) return false;
  if (
    (j.Property.check(parent) || j.ObjectProperty.check(parent) || j.ObjectMethod.check(parent)) &&
    path.name === 'key' &&
    !parent.computed
  )
    return false;
  return true;
}

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  const references = (binding: ASTPath<Identifier>): ASTPath<Identifier>[] =>
    root
      .find(j.Identifier, { name: binding.node.name })
      .filter(
        (ref) =>
          ref.node !== binding.node && isReference(j, ref) && findBinding(j, ref, ref.node.name)?.node === binding.node,
      )
      .paths();
  const calls = root.find(j.CallExpression).paths();
  const properties = calls.filter((path) => importedName(j, path, path.node.callee) === 'property');
  const migrations: { property: ASTPath<CallExpression>; applyConsumers: (() => void)[] }[] = [];

  function planConsumer(use: ASTPath): (() => void) | undefined {
    const path = use.parent;
    const call = path.node;
    const name = j.CallExpression.check(call) ? importedName(j, path, call.callee) : undefined;
    if (
      !j.CallExpression.check(call) ||
      call.optional ||
      call.arguments[0] !== use.node ||
      !name ||
      !['assert', 'check', 'sample', 'statistics'].includes(name)
    ) {
      reportUnsupported(api, use.node, 'Cannot migrate a property that is exported or passed to an unknown consumer.');
      return undefined;
    }
    if (name === 'sample' || name === 'statistics' || j.AwaitExpression.check(path.parent.node))
      return () => {
        // Sampling stays synchronous, and an existing await already observes the assertion.
      };
    const context = awaitContext(j, path, file.path);
    if (!context) {
      reportUnsupported(api, call, `Cannot make ${name}() asynchronous in this context; migrate its caller manually.`);
      return undefined;
    }
    const parent = path.parent.node;
    if (
      (j.ReturnStatement.check(parent) && parent.argument === call) ||
      (j.ArrowFunctionExpression.check(parent) && parent.body === call)
    )
      return () => {
        // The async function or test runner already observes a directly returned promise.
      };
    return () => {
      if (context.functionToMakeAsync) context.functionToMakeAsync.async = true;
      path.replace(j.awaitExpression(call));
    };
  }

  for (const property of properties) {
    const parent = property.parent;
    let uses: ASTPath[];
    if (j.VariableDeclarator.check(parent.node) && parent.node.init === property.node) {
      const declaration = parent.parent;
      if (
        !j.Identifier.check(parent.node.id) ||
        parent.node.id.typeAnnotation ||
        !j.VariableDeclaration.check(declaration.node) ||
        declaration.node.kind !== 'const' ||
        j.ExportNamedDeclaration.check(declaration.parent.node)
      ) {
        reportUnsupported(
          api,
          property.node,
          'Cannot migrate an exported, mutable or explicitly typed property binding.',
        );
        continue;
      }
      uses = references(parent.get('id'));
    } else {
      uses = [property];
    }
    // Do not edit any consumers until all uses of this property have been accepted.
    const actions = uses.map(planConsumer);
    if (actions.every((action) => action !== undefined)) migrations.push({ property, applyConsumers: actions });
  }

  // Report assertions whose property cannot be traced, but leave existing async properties alone.
  for (const call of calls) {
    const name = importedName(j, call, call.node.callee);
    if (name !== 'assert' && name !== 'check') continue;
    let input = call.get('arguments', 0);
    if (j.Identifier.check(input.node)) {
      const binding = findBinding(j, input, input.node.name);
      if (j.VariableDeclarator.check(binding?.parent.node)) input = binding.parent.get('init');
    }
    const origin = j.CallExpression.check(input.node) ? importedName(j, input, input.node.callee) : undefined;
    if (origin !== 'property' && origin !== 'asyncProperty')
      reportUnsupported(
        api,
        call.node,
        'Cannot determine whether this assertion uses a synchronous fast-check property.',
      );
  }

  const named = new Map<ImportSpecifier, { binding: ASTPath<Identifier>; calls: ASTPath<CallExpression>[] }>();
  for (const { property } of migrations) {
    if (!j.Identifier.check(property.node.callee)) continue;
    const binding = findBinding(j, property, property.node.callee.name);
    if (!binding || !j.ImportSpecifier.check(binding.parent.node)) continue;
    let group = named.get(binding.parent.node);
    if (!group) {
      group = { binding, calls: [] };
      named.set(binding.parent.node, group);
    }
    group.calls.push(property);
  }

  // Keep imports needed by unsupported uses; choose aliases that cannot capture shadowed bindings.
  const importEdits: (() => void)[] = [];
  const reserved = new Set(
    root
      .find(j.Identifier)
      .nodes()
      .map((node) => node.name),
  );
  for (const [specifier, group] of named) {
    const binding = group.binding;
    const declaration = binding.parent.parent.node;
    const refs = references(binding);
    const allMigrated = refs.every((ref) => group.calls.some((call) => call.node.callee === ref.node));
    const existing = root
      .find(j.ImportSpecifier, { imported: { name: 'asyncProperty' } })
      .paths()
      .find((path) => {
        const local = path.node.local;
        return (
          j.Identifier.check(local) &&
          group.calls.every(
            (call) =>
              importedName(j, call, local) === 'asyncProperty' &&
              findBinding(j, call, local.name)?.parent.node === path.node,
          )
        );
      });
    let local: string;
    if (existing && j.Identifier.check(existing.node.local)) {
      local = existing.node.local.name;
      if (allMigrated)
        importEdits.push(() => {
          declaration.specifiers = declaration.specifiers.filter((entry: ImportSpecifier) => entry !== specifier);
        });
    } else if (allMigrated) {
      local = binding.node.name === 'property' && !reserved.has('asyncProperty') ? 'asyncProperty' : binding.node.name;
      const replacement = j.importSpecifier(j.identifier('asyncProperty'), j.identifier(local));
      replacement.comments = specifier.comments;
      importEdits.push(() => {
        declaration.specifiers = declaration.specifiers.map((entry: ImportSpecifier) =>
          entry === specifier ? replacement : entry,
        );
      });
    } else {
      local = 'asyncProperty';
      while (reserved.has(local)) local += 'ForProperty';
      const addition = j.importSpecifier(j.identifier('asyncProperty'), j.identifier(local));
      importEdits.push(() => declaration.specifiers.push(addition));
    }
    reserved.add(local);
    importEdits.push(() => {
      for (const call of group.calls) call.node.callee = j.identifier(local);
    });
  }

  // References to the factory itself also escape analysis (for example, passing fc.property as a callback).
  root.find(j.MemberExpression).forEach((path) => {
    if (memberName(j, path, path.node) !== 'property') return;
    if (j.CallExpression.check(path.parent.node) && path.parent.node.callee === path.node) return;
    reportUnsupported(api, path.node, 'Cannot migrate a property factory passed around without a direct call.');
  });
  root.find(j.ImportSpecifier, { imported: { name: 'property' } }).forEach((path) => {
    if (!j.Identifier.check(path.node.local) || importedName(j, path, path.node.local) !== 'property') return;
    for (const ref of references(path.get('local'))) {
      if (j.CallExpression.check(ref.parent.node) && ref.parent.node.callee === ref.node) continue;
      reportUnsupported(api, ref.node, 'Cannot migrate a property factory passed around without a direct call.');
    }
  });

  if (!migrations.length) return file.source;
  for (const edit of importEdits) edit();
  for (const { property, applyConsumers } of migrations) {
    if (j.MemberExpression.check(property.node.callee)) property.node.callee.property = j.identifier('asyncProperty');
    for (const apply of applyConsumers) apply();
  }
  return root.toSource({ quote: 'single' });
}
