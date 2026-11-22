import type { API, ASTPath, CallExpression, SpreadElement, FileInfo, JSCodeshift, ObjectExpression } from 'jscodeshift';
import { reportUnsupported } from './reportUnsupported.js';

export type Expression = Exclude<CallExpression['arguments'][number], SpreadElement>;

type CallPath = ASTPath<CallExpression>;
type Runner = 'assert' | 'check' | 'configureGlobal';

export interface PluginEdit {
  remove: string[];
  shareLocalOptions?: boolean;
  plugins: { value: Expression; when?: Expression }[];
  conflicts?: string[];
  parameters?: Record<string, Expression>;
  property?: Expression;
  insertBefore?: (plugin: Expression) => boolean;
}

export interface PluginCall {
  j: JSCodeshift;
  runner: Runner;
  hasCheck: boolean;
  typescript: boolean;
  call: CallExpression;
  path: CallPath;
  options: ReadonlyMap<string, Expression>;
  member: (name: string) => Expression;
  importedName: (call: CallExpression) => string | undefined;
  report: (message: string) => void;
}

export function declarationOf(path: ASTPath, name: string): ASTPath | undefined {
  const bindings = path.scope.lookup(name)?.getBindings()[name];
  return bindings?.length === 1 ? bindings[0].parent : undefined;
}

function importedBinding(path: CallPath, name: string): string | undefined {
  const declaration = declarationOf(path, name);
  if (!declaration) return undefined;
  const specifier = declaration.node;
  if (specifier.type === 'VariableDeclarator') {
    const init = specifier.init;
    if (
      specifier.id.type === 'Identifier' &&
      declaration.parent.node.kind === 'const' &&
      init?.type === 'CallExpression' &&
      init.callee.type === 'Identifier' &&
      init.callee.name === 'require' &&
      !declaration.scope.lookup('require') &&
      init.arguments.length === 1 &&
      'value' in init.arguments[0] &&
      init.arguments[0].value === 'fast-check'
    )
      return '*';
    return undefined;
  }
  const source = declaration.parent.node;
  if (
    source.type !== 'ImportDeclaration' ||
    source.source.value !== 'fast-check' ||
    source.importKind === 'type' ||
    ('importKind' in specifier && specifier.importKind === 'type')
  )
    return undefined;
  if (specifier.type === 'ImportDefaultSpecifier' || specifier.type === 'ImportNamespaceSpecifier') return '*';
  return specifier.type === 'ImportSpecifier' && typeof specifier.imported.name === 'string'
    ? specifier.imported.name
    : undefined;
}

function importedName(path: CallPath, call: CallExpression): string | undefined {
  const callee = call.callee;
  if (callee.type === 'Identifier') return importedBinding(path, callee.name);
  if (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.type === 'Identifier' &&
    callee.object.type === 'Identifier' &&
    importedBinding(path, callee.object.name) === '*'
  ) {
    return callee.property.name;
  }
  return undefined;
}

function isExpression(j: JSCodeshift, node: unknown): node is Expression {
  return j.Expression.check(node);
}

function readOptions(j: JSCodeshift, properties: ObjectExpression['properties']): Map<string, Expression> | undefined {
  const options = new Map<string, Expression>();
  for (const prop of properties) {
    let value: Expression;
    if (prop.type === 'ObjectMethod' && prop.kind === 'method' && !prop.computed) {
      const fn = j.functionExpression(null, prop.params, prop.body, prop.generator);
      fn.async = prop.async;
      fn.returnType = prop.returnType;
      fn.typeParameters = prop.typeParameters;
      value = fn;
    } else if (
      (prop.type === 'ObjectProperty' || prop.type === 'Property') &&
      !prop.computed &&
      (!('kind' in prop) || prop.kind === 'init') &&
      isExpression(j, prop.value)
    ) {
      value = prop.value;
    } else return undefined;
    const key = prop.key.type === 'Identifier' ? prop.key.name : 'value' in prop.key ? prop.key.value : undefined;
    if (typeof key !== 'string' || options.has(key)) return undefined;
    options.set(key, value);
  }
  return options;
}

function isSimple(j: JSCodeshift, value: Expression): boolean {
  return (
    j.Literal.check(value) ||
    j.Identifier.check(value) ||
    j.FunctionExpression.check(value) ||
    j.ArrowFunctionExpression.check(value) ||
    (j.ArrayExpression.check(value) && value.elements.every((item) => isExpression(j, item) && isSimple(j, item)))
  );
}

// Only rewrite literal constants whose complete set of uses is known.
function constantOptions(
  j: JSCodeshift,
  path: CallPath,
  name: string,
): { object: ASTPath<ObjectExpression>; sharedUses?: CallExpression[] } | undefined {
  const declaration = declarationOf(path, name);
  if (
    !declaration ||
    !j.VariableDeclarator.check(declaration.node) ||
    declaration.parent.node.kind !== 'const' ||
    declaration.parent.node.declarations.length !== 1 ||
    declaration.parent.node.comments?.length ||
    !['Program', 'BlockStatement'].includes(declaration.parent.parent.node.type)
  )
    return undefined;
  const init = declaration.node.init;
  if (
    !j.ObjectExpression.check(init) ||
    !init.properties.every(
      (p) => (p.type === 'ObjectProperty' || p.type === 'Property') && !p.computed && j.Literal.check(p.value),
    )
  )
    return undefined;
  const object = declaration.get('init');
  const binding = declaration.node.id;
  const references = j(declaration.scope.path)
    .find(j.Identifier, { name })
    .paths()
    .filter((ref) => ref.node !== binding);
  if (references.length === 1) return { object };
  if (declaration.node.id.type !== 'Identifier' || declaration.node.id.typeAnnotation) return undefined;
  const sharedUses: CallExpression[] = [];
  for (const ref of references) {
    const use = ref.parent;
    if (
      !j.CallExpression.check(use.node) ||
      use.node.arguments.length !== 2 ||
      use.node.arguments[1] !== ref.node ||
      declarationOf(ref, name)?.node !== declaration.node
    )
      return undefined;
    const runner = importedName(use, use.node);
    if (runner !== 'assert' && runner !== 'check') return undefined;
    sharedUses.push(use.node);
  }
  return { object, sharedUses };
}

export function migratePluginCalls(
  file: FileInfo,
  api: API,
  migrate: (site: PluginCall) => PluginEdit | undefined,
): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  const calls = root.find(j.CallExpression).paths();
  const globalCalls = calls.filter((path) => importedName(path, path.node) === 'configureGlobal');
  const hasCheck = calls.some((path) => importedName(path, path.node) === 'check');
  const hasReset = calls.some((path) => importedName(path, path.node) === 'resetConfigureGlobal');
  const sites = [];
  const globalKeys = new Set<string>();
  const localKeys = new Set<string>();
  let needsNamespace = false;
  let namespace = 'fc';
  for (let suffix = 2; root.find(j.Identifier, { name: namespace }).size() !== 0; ++suffix) namespace = 'fc' + suffix;

  for (const path of calls) {
    const runner = importedName(path, path.node);
    if (runner !== 'configureGlobal' && runner !== 'check' && runner !== 'assert') continue;
    const index = runner === 'configureGlobal' ? 0 : 1;
    const args = path.node.arguments;
    if (args.length < 1 || args.length > index + 1) continue;
    const argument = args[index];
    const constant = j.Identifier.check(argument) ? constantOptions(j, path, argument.name) : undefined;
    const object = constant?.object.node ?? argument ?? j.objectExpression([]);
    if (!j.ObjectExpression.check(object)) continue;
    if (constant?.sharedUses && constant.sharedUses[0] !== path.node) continue;
    const first = object.properties[0];
    const keepsGlobal =
      runner === 'configureGlobal' &&
      first?.type === 'SpreadElement' &&
      first.argument.type === 'CallExpression' &&
      first.argument.arguments.length === 0 &&
      importedName(path, first.argument) === 'readConfigureGlobal';
    const options = readOptions(j, keepsGlobal ? object.properties.slice(1) : object.properties);
    if (!options) continue;
    const callee = path.node.callee;
    const receiver = j.MemberExpression.check(callee) ? callee.object : undefined;
    if (constant?.sharedUses && receiver) {
      if (!j.Identifier.check(receiver)) continue;
      // A shared initializer can be outside the caller's scope or before a CommonJS require.
      const binding = declarationOf(path, receiver.name);
      if (
        binding?.parent.node.type !== 'ImportDeclaration' ||
        declarationOf(constant.object, receiver.name)?.node !== binding.node
      )
        continue;
    }
    const member = (name: string) => j.memberExpression(receiver ?? j.identifier(namespace), j.identifier(name));
    const report = (message: string) => reportUnsupported(api, path.node, message);
    const edit = migrate({
      j,
      runner,
      call: path.node,
      hasCheck,
      typescript: /\.[cm]?tsx?$/.test(file.path),
      path,
      options,
      member,
      importedName: (call) => importedName(path, call),
      report,
    });
    const keys = runner === 'configureGlobal' ? globalKeys : localKeys;
    for (const key of options.keys()) keys.add(key);
    for (const key of edit?.conflicts ?? []) keys.add(key);
    if (edit && (!constant?.sharedUses || edit.shareLocalOptions))
      sites.push({ path, runner, index, object, options, receiver, member, edit, report, keepsGlobal, constant });
  }

  let changed = false;
  for (const { path, runner, index, object, options, receiver, member, edit, report, keepsGlobal, constant } of sites) {
    const global = runner === 'configureGlobal';
    const otherKeys = global ? localKeys : globalKeys;
    const otherSetup = [...edit.remove, ...(edit.conflicts ?? [])].some((key) => otherKeys.has(key));
    if (otherSetup) {
      report('Review the local override and global setup together: installed plugins accumulate.');
      continue;
    }
    const statement = path.parent;
    if (
      global &&
      (globalCalls.length !== 1 ||
        hasReset ||
        !j.ExpressionStatement.check(statement.node) ||
        !j.Program.check(statement.parent.node))
    ) {
      report('Review this global configuration: plugins must be installed once.');
      continue;
    }
    const existing = options.get('plugins');
    if (existing && (global || !j.ArrayExpression.check(existing))) {
      report('Review the existing plugin list before merging plugins.');
      continue;
    }
    // Moving an option past a getter or function call can change the value it reads.
    if ([...options].some(([key, value]) => key !== 'plugins' && !isSimple(j, value))) {
      report('Review the evaluation order of this options object.');
      continue;
    }
    if (
      existing &&
      j.ArrayExpression.check(existing) &&
      !isSimple(j, existing) &&
      [...options].some(([key, value]) => edit.remove.includes(key) && j.Identifier.check(value))
    ) {
      report('Review option evaluation alongside the existing plugin factories.');
      continue;
    }
    const keys = [...options.keys()];
    const retained = object.properties.filter((_, i) => {
      if (keepsGlobal && i === 0) return true;
      const key = keys[keepsGlobal ? i - 1 : i];
      return !edit.remove.includes(key) && !(edit.parameters && key in edit.parameters);
    });
    // Avoid deleting comments attached to an option that disappears.
    if (object.properties.some((prop) => !retained.includes(prop) && prop.comments?.length)) {
      report('Review the commented options before migrating.');
      continue;
    }
    if (edit.parameters) {
      for (const [key, value] of Object.entries(edit.parameters))
        retained.push(j.objectProperty(j.identifier(key), value));
    }
    if (constant && !constant.sharedUses) {
      path.node.arguments[index] = object;
      constant.object.parent.parent.prune();
    }
    object.properties = retained;
    if (global) {
      const statements = edit.plugins.map(({ value, when }) => {
        const install = j.expressionStatement(j.callExpression(member('installGlobalPlugin'), [value]));
        return when ? j.ifStatement(when, j.blockStatement([install])) : install;
      });
      const keepSettings = retained.length > (keepsGlobal ? 1 : 0);
      if (keepSettings) statements.unshift(statement.node);
      if (statement.node.comments?.length && statements.length && !keepSettings)
        statements[0].comments = statement.node.comments;
      // configureGlobal({}) also clears previous parameters. Keep it if there is nothing to install.
      if (statements.length) statement.replace(...statements);
      else if (keepsGlobal && !statement.node.comments?.length) statement.prune();
    } else {
      let localOptions: Expression = object;
      if (edit.property) path.node.arguments[0] = edit.property;
      if (edit.plugins.length) {
        const array = j.ArrayExpression.check(existing) ? existing : j.arrayExpression([]);
        const elements = edit.plugins.map(({ value, when }) =>
          when
            ? j.spreadElement(j.conditionalExpression(when, j.arrayExpression([value]), j.arrayExpression([])))
            : value,
        );
        const before = array.elements.findIndex((item) => isExpression(j, item) && edit.insertBefore?.(item));
        array.elements.splice(before === -1 ? array.elements.length : before, 0, ...elements);
        if (!existing) object.properties.push(j.objectProperty(j.identifier('plugins'), array));
        if (!existing && edit.parameters?.noDefaultPlugins && object.properties.length === 2 && !constant?.sharedUses) {
          // Recast inserts a blank line before a multiline property unless the object supplies its layout.
          const template = j.template.statement`const options = {
  noDefaultPlugins: ${edit.parameters.noDefaultPlugins},
  plugins: ${array},
};`;
          localOptions = j(template).find(j.ObjectExpression).nodes()[0];
          localOptions.comments = object.comments;
        }
      }
      if (constant?.sharedUses) {
        if (object.properties.length === 0) {
          for (const use of constant.sharedUses) use.arguments.splice(index, 1);
          constant.object.parent.parent.prune();
        }
      } else if (object.properties.length) path.node.arguments[index] = localOptions;
      else path.node.arguments.splice(index, 1);
    }
    needsNamespace ||= !receiver && edit.plugins.length > 0;
    changed = true;
  }

  if (needsNamespace && root.find(j.Identifier, { name: namespace }).size()) {
    const first = root.find(j.ImportDeclaration, { source: { value: 'fast-check' } }).paths()[0];
    first.insertAfter(
      j.importDeclaration([j.importNamespaceSpecifier(j.identifier(namespace))], j.stringLiteral('fast-check')),
    );
  }
  return changed ? root.toSource({ quote: 'single' }) : file.source;
}
