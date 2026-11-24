import type { API, ASTPath, CallExpression, FileInfo } from 'jscodeshift';
import { planAwait } from '../awaitCall.js';
import { findBinding, freshName, identifierNames, localConstBinding, referencesOf } from '../bindings.js';
import { importedName, inputFactoryName, isFastCheckMember, isPropertyFactory } from '../fastCheck.js';
import { namedImports, renameImport, visibleNamedImport } from '../imports.js';
import { parseFile } from '../transformFile.js';

export default function transform(file: FileInfo, api: API): string {
  const { j, root, report, print } = parseFile(file, api);
  const imports = root.find(j.ImportDeclaration);
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
      report(use.node, 'Cannot migrate a property that is exported or passed to an unknown consumer.');
      return undefined;
    }
    if (name === 'sample' || name === 'statistics' || j.AwaitExpression.check(path.parent.node))
      return () => {
        // The sample and statistics codemods handle their own awaits. An awaited assertion is already covered.
      };
    const awaitCall = planAwait(
      j,
      path,
      file.path,
      report,
      `Cannot make ${name}() asynchronous in this context; migrate its caller manually.`,
    );
    if (!awaitCall) return undefined;
    const parent = path.parent.node;
    if (
      (j.ReturnStatement.check(parent) && parent.argument === call) ||
      (j.ArrowFunctionExpression.check(parent) && parent.body === call)
    )
      return () => {
        // The async function or test runner already observes a directly returned promise.
      };
    return () => {
      path.replace(awaitCall());
    };
  }

  for (const property of properties) {
    const parent = property.parent;
    let uses: ASTPath[];
    if (j.VariableDeclarator.check(parent.node) && parent.node.init === property.node) {
      const binding = localConstBinding(j, property);
      if (!binding || binding.node.typeAnnotation) {
        report(property.node, 'Cannot migrate an exported, mutable or explicitly typed property binding.');
        continue;
      }
      uses = referencesOf(j, binding);
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
    const origin = inputFactoryName(j, call.get('arguments', 0), 'any');
    if (!isPropertyFactory(origin))
      report(call.node, 'Cannot determine whether this assertion uses a synchronous fast-check property.');
  }

  const named = Map.groupBy(migrations, ({ property }) => {
    const { callee } = property.node;
    return j.Identifier.check(callee) ? findBinding(j, property, callee.name) : undefined;
  });

  // Unsupported uses still need the old import. A replacement alias must be visible at every migrated call.
  const importEdits: (() => void)[] = [];
  const reserved = identifierNames(j, root);
  for (const [binding, group] of named) {
    if (!binding || !j.ImportSpecifier.check(binding.parent.node)) continue;
    const specifier = binding.parent;
    const calls = group.map(({ property }) => property);
    const refs = referencesOf(j, binding);
    const allMigrated = refs.every((ref) => calls.some((call) => call.node.callee === ref.node));
    const existing = visibleNamedImport(j, imports, 'fast-check', 'asyncProperty', calls);
    let local: string;
    if (existing !== undefined) {
      local = existing;
      if (allMigrated) importEdits.push(() => specifier.prune());
    } else if (allMigrated) {
      local = binding.node.name === 'property' && !reserved.has('asyncProperty') ? 'asyncProperty' : binding.node.name;
      const replacement = renameImport(j, specifier.node, 'asyncProperty', j.identifier(local));
      importEdits.push(() => specifier.replace(replacement));
    } else {
      local = freshName(reserved, 'asyncProperty', 'ForProperty');
      const addition = j.importSpecifier(j.identifier('asyncProperty'), j.identifier(local));
      importEdits.push(() => specifier.parent.get('specifiers').push(addition));
    }
    reserved.add(local);
    importEdits.push(() => {
      for (const call of calls) call.node.callee = j.identifier(local);
    });
  }

  // References to the factory itself also escape analysis (for example, passing fc.property as a callback).
  function reportDetachedFactory(path: ASTPath): void {
    if (j.CallExpression.check(path.parent.node) && path.parent.node.callee === path.node) return;
    report(path.node, 'Cannot migrate a property factory passed around without a direct call.');
  }
  root.find(j.MemberExpression).forEach((path) => {
    if (isFastCheckMember(j, path, path.node, 'property')) reportDetachedFactory(path);
  });
  namedImports(j, imports, 'fast-check', 'property').forEach((path) => {
    if (importedName(j, path, path.node.local) === 'property')
      referencesOf(j, path.get('local')).forEach(reportDetachedFactory);
  });

  if (!migrations.length) return file.source;
  for (const edit of importEdits) edit();
  for (const { property, applyConsumers } of migrations) {
    if (j.MemberExpression.check(property.node.callee)) property.node.callee.property = j.identifier('asyncProperty');
    for (const apply of applyConsumers) apply();
  }
  return print();
}
