import type { API, ASTPath, FileInfo, JSCodeshift } from 'jscodeshift';
import { findBinding, importedName, isReference } from '../fastCheck.js';
import { reportUnsupported } from '../reportUnsupported.js';

type Consumption = 'async' | 'sync';

const runDetailsFields = new Set([
  'failed',
  'interrupted',
  'numRuns',
  'numSkips',
  'numShrinks',
  'seed',
  'counterexample',
  'counterexamplePath',
  'errorInstance',
  'failures',
  'executionSummary',
  'verbose',
  'runConfiguration',
]);

function throughTypeWrappers(j: JSCodeshift, path: ASTPath): ASTPath {
  while (
    (j.TSAsExpression.check(path.parent.node) ||
      j.TSTypeAssertion.check(path.parent.node) ||
      j.TSNonNullExpression.check(path.parent.node) ||
      j.TSSatisfiesExpression.check(path.parent.node)) &&
    path.parent.node.expression === path.node
  )
    path = path.parent;
  return path;
}

function fieldName(j: JSCodeshift, key: unknown, computed: boolean): string | undefined {
  if (!computed && j.Identifier.check(key)) return key.name;
  if ((j.StringLiteral.check(key) || j.Literal.check(key)) && typeof key.value === 'string') return key.value;
}

function readsRunDetails(j: JSCodeshift, pattern: unknown): boolean {
  return (
    j.ObjectPattern.check(pattern) &&
    pattern.properties.length > 0 &&
    pattern.properties.every(
      (entry) =>
        (j.ObjectProperty.check(entry) || j.Property.check(entry)) &&
        runDetailsFields.has(fieldName(j, entry.key, entry.computed ?? false) ?? ''),
    )
  );
}

function directConsumption(j: JSCodeshift, use: ASTPath): Consumption | undefined {
  const path = throughTypeWrappers(j, use);
  const parent = path.parent.node;
  if (j.AwaitExpression.check(parent)) return 'async';
  if ((j.MemberExpression.check(parent) || j.OptionalMemberExpression.check(parent)) && parent.object === path.node) {
    const name = fieldName(j, parent.property, parent.computed ?? false);
    const consumer = path.parent.parent.node;
    if (
      name &&
      ['then', 'catch', 'finally'].includes(name) &&
      j.CallExpression.check(consumer) &&
      consumer.callee === parent &&
      !consumer.optional &&
      !parent.optional
    )
      return 'async';
    if (
      name &&
      runDetailsFields.has(name) &&
      !(j.AssignmentExpression.check(consumer) && consumer.left === parent) &&
      !j.UpdateExpression.check(consumer) &&
      !(j.UnaryExpression.check(consumer) && consumer.operator === 'delete')
    )
      return 'sync';
  }
  if (j.VariableDeclarator.check(parent) && parent.init === path.node && readsRunDetails(j, parent.id)) return 'sync';
  if (j.AssignmentExpression.check(parent) && parent.right === path.node && readsRunDetails(j, parent.left))
    return 'sync';
}

export default function transform(file: FileInfo, api: API): string {
  const typed = /\.[cm]?tsx?$/.test(file.path);
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  const helpers = new Map<Consumption, { name: string; namespace: string }>();

  function consumptionOf(call: ASTPath): Consumption | undefined {
    const direct = directConsumption(j, call);
    if (direct) return direct;
    const path = throughTypeWrappers(j, call);
    const declarator = path.parent.node;
    const declaration = path.parent.parent;
    if (
      !j.VariableDeclarator.check(declarator) ||
      declarator.init !== path.node ||
      !j.Identifier.check(declarator.id) ||
      !j.VariableDeclaration.check(declaration.node) ||
      declaration.node.kind !== 'const' ||
      j.ExportNamedDeclaration.check(declaration.parent.node)
    )
      return undefined;
    const binding = declarator.id;
    const uses = root
      .find(j.Identifier, { name: binding.name })
      .filter(
        (ref) =>
          ref.node !== binding &&
          isReference(j, ref) &&
          !(
            j.OptionalMemberExpression.check(ref.parent.node) &&
            ref.name === 'property' &&
            !ref.parent.node.computed
          ) &&
          findBinding(j, ref, binding.name)?.node === binding,
      )
      .paths();
    const modes = uses.map((ref) => directConsumption(j, ref));
    return modes.length > 0 && modes.every((mode) => mode === modes[0]) ? modes[0] : undefined;
  }

  root.find(j.CallExpression).forEach((path) => {
    const { callee } = path.node;
    if (importedName(j, path, callee) !== 'check') return;
    if (!j.MemberExpression.check(callee) || !j.Identifier.check(callee.object)) {
      reportUnsupported(
        api,
        path.node,
        'Cannot migrate check() without a fast-check namespace; use a namespace import or migrate manually.',
      );
      return;
    }
    const consumption = consumptionOf(path);
    if (!consumption) {
      reportUnsupported(
        api,
        path.node,
        'Cannot determine whether check() is consumed synchronously or asynchronously; mixed, escaping or uncertain usages require manual migration.',
      );
      return;
    }
    const [property, params] = path.node.arguments;
    if (
      path.node.optional ||
      !j.Expression.check(property) ||
      path.node.arguments.length > 2 ||
      j.SpreadElement.check(params)
    ) {
      reportUnsupported(api, path.node, 'Cannot migrate check() with these arguments; migrate the call manually.');
      return;
    }
    if (consumption === 'sync') {
      let input = path.get('arguments', 0);
      if (j.Identifier.check(input.node)) {
        const binding = findBinding(j, input, input.node.name);
        if (j.VariableDeclarator.check(binding?.parent.node)) input = binding.parent.get('init');
      }
      if (j.CallExpression.check(input.node) && importedName(j, input, input.node.callee) === 'asyncProperty') {
        reportUnsupported(
          api,
          path.node,
          'Cannot migrate synchronous consumption of an asyncProperty; review the call manually.',
        );
        return;
      }
    }
    let helper = helpers.get(consumption);
    if (helper && helper.namespace !== callee.object.name) {
      reportUnsupported(api, path.node, 'Cannot migrate check() using multiple fast-check namespaces in one file.');
      return;
    }
    if (!helper) {
      let name = consumption === 'async' ? 'assertAndGetRunDetails' : 'assertAndGetRunDetailsSync';
      while (root.find(j.Identifier, { name }).size()) name += 'ForCheck';
      helper = { name, namespace: callee.object.name };
      helpers.set(consumption, helper);
    }
    path.node.callee = j.identifier(helper.name);
  });

  for (const [consumption, { name, namespace }] of helpers) {
    const type = (annotation: string) => (typed ? annotation : '');
    const asynchronous = consumption === 'async';
    const definition = `
${asynchronous ? 'async ' : ''}function ${name}${type('<Ts>')}(property${type(': Parameters<typeof ' + namespace + '.assert<Ts>>[0]')}, params${type('?: ' + namespace + '.Parameters<Ts>')}${typed ? '' : ' = {}'}) {
  let details${type(asynchronous ? '!: ' + namespace + '.RunDetails<Ts>' : ': ' + namespace + '.RunDetails<Ts> | undefined')};
  ${asynchronous ? 'await ' : 'const execution = '}${namespace}.assert(property, {
    ...params,
    noDefaultPlugins: true,
    plugins: [...(params?.plugins ?? []), () => ({ onAllRunsComplete(result) { details = result; } })],
  });${
    asynchronous
      ? ''
      : `
  if (details === undefined) {
    if (execution !== undefined) void execution.catch(() => {});
    throw new Error('Expected synchronous check execution; use an asynchronous helper and await its result.');
  }`
  }
  return details;
}`;
    root.find(j.Program).get().node.body.push(j(definition).find(j.FunctionDeclaration).get().node);
  }
  return root.toSource({ quote: 'single' });
}
