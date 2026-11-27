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

function directConsumption(j: JSCodeshift, use: ASTPath): Consumption | 'await' | undefined {
  const path = throughTypeWrappers(j, use);
  const parent = path.parent.node;
  if (j.AwaitExpression.check(parent)) return 'await';
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
  let changed = false;
  const names = new Set(
    root
      .find(j.Identifier)
      .nodes()
      .map((node) => node.name),
  );
  function freshName(base: string): string {
    let name = base;
    let suffix = 2;
    while (names.has(name)) name = base + suffix++;
    names.add(name);
    return name;
  }

  function consumptionOf(call: ASTPath): Consumption | undefined {
    const direct = directConsumption(j, call);
    if (direct) return direct === 'await' ? 'async' : direct;
    const path = throughTypeWrappers(j, call);
    const declarator = path.parent.node;
    const declaration = path.parent.parent;
    if (
      !j.VariableDeclarator.check(declarator) ||
      declarator.init !== path.node ||
      !j.Identifier.check(declarator.id) ||
      !j.VariableDeclaration.check(declaration.node) ||
      declaration.node.kind !== 'const'
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
    // Field reads identify RunDetails even if the value is also awaited or passed elsewhere.
    // Promise methods, on the other hand, contradict synchronous consumption.
    if (modes.includes('sync')) return modes.includes('async') ? undefined : 'sync';
    if (j.ExportNamedDeclaration.check(declaration.parent.node)) return undefined;
    return modes.length > 0 && modes.every((mode) => mode !== undefined) ? 'async' : undefined;
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
        'Cannot determine whether check() is consumed synchronously or asynchronously; conflicting or uncertain usages require manual migration.',
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
    const namespace = callee.object.name;
    const wrapped = throughTypeWrappers(j, path);
    const awaited = j.AwaitExpression.check(wrapped.parent.node) ? wrapped.parent : undefined;
    const consumed = throughTypeWrappers(j, awaited ?? wrapped);

    // A discarded awaited result does not need a capture variable.
    if (awaited && j.ExpressionStatement.check(consumed.parent.node)) {
      callee.property = j.identifier('assert');
      callee.computed = false;
      path.node.arguments = [
        property,
        j.objectExpression([
          ...(params ? [j.spreadElement(params)] : []),
          j.objectProperty(j.identifier('noDefaultPlugins'), j.booleanLiteral(true)),
        ]),
      ];
      changed = true;
      return;
    }

    // Only lift statements when the call is evaluated first and unconditionally.
    // Keep nested expressions, loop headers, promise chains and contextually typed property literals in place.
    let value = consumed;
    if (
      consumption === 'sync' &&
      (j.MemberExpression.check(value.parent.node) || j.OptionalMemberExpression.check(value.parent.node)) &&
      value.parent.node.object === value.node
    )
      value = throughTypeWrappers(j, value.parent);
    let statement: ASTPath | undefined;
    if (
      (consumption === 'sync' || awaited) &&
      !j.ObjectExpression.check(property) &&
      j.VariableDeclarator.check(value.parent.node) &&
      value.parent.node.init === value.node &&
      j.VariableDeclaration.check(value.parent.parent.node) &&
      value.parent.parent.node.declarations.length === 1
    ) {
      const declaration = value.parent.parent;
      const candidate = j.ExportNamedDeclaration.check(declaration.parent.node) ? declaration.parent : declaration;
      if (j.Program.check(candidate.parent.node) || j.BlockStatement.check(candidate.parent.node))
        statement = candidate;
    }

    const propertyName = freshName('checkProperty');
    const paramsName = params ? freshName('checkParams') : undefined;
    const detailsName = freshName('checkDetails');
    const executionName = consumption === 'sync' ? freshName('checkExecution') : undefined;
    const type = (annotation: string) => (typed ? annotation : '');
    const genericName = statement ? undefined : freshName('Ts');
    const valuesType = statement ? `ReturnType<typeof ${propertyName}.generate>['value']` : genericName;
    const detailsType = `${namespace}.RunDetails<${valuesType}>`;
    const body = `
  let ${detailsName}${type(consumption === 'async' ? '!: ' + detailsType : ': ' + detailsType + ' | undefined')};
  ${consumption === 'async' ? 'await ' : 'const ' + executionName + ' = '}${namespace}.assert(${propertyName}, {
${paramsName ? '    ...' + paramsName + ',\n' : ''}    noDefaultPlugins: true,
    plugins: [${paramsName ? '...(' + paramsName + '?.plugins ?? []), ' : ''}() => ({ onAllRunsComplete(result) { ${detailsName} = result; } })],
  });${
    consumption === 'async'
      ? ''
      : `
  if (${detailsName} === undefined) {
    void Promise.resolve(${executionName}).catch(() => {});
    throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
  }`
  }`;

    if (statement) {
      const prefix = j(
        `const ${propertyName} = CHECK_PROPERTY_INPUT;${paramsName ? `\nconst ${paramsName}${type(': ' + namespace + '.Parameters<' + valuesType + '> | undefined')} = CHECK_PARAMS_INPUT;` : ''}${body}`,
      );
      prefix.find(j.Identifier, { name: 'CHECK_PROPERTY_INPUT' }).replaceWith(property);
      if (params) prefix.find(j.Identifier, { name: 'CHECK_PARAMS_INPUT' }).replaceWith(params);
      (awaited ?? path).replace(j.identifier(detailsName));
      statement.replace(...prefix.find(j.Program).get().node.body, statement.node);
    } else {
      // The arguments remain outside the inline function, preserving await/yield and their order.
      const inline = j(`(${consumption === 'async' ? 'async ' : ''}function${type('<' + genericName + '>')}(
  ${propertyName}${type(': Parameters<typeof ' + namespace + '.assert<' + genericName + '>>[0]')}${paramsName ? ', ' + paramsName + type('?: ' + namespace + '.Parameters<' + genericName + '>') : ''}
) {${body}
  return ${detailsName};
})`)
        .find(j.FunctionExpression)
        .get().node;
      path.replace(j.callExpression(inline, path.node.arguments));
    }
    changed = true;
  });
  return changed ? root.toSource({ quote: 'single' }) : file.source;
}
