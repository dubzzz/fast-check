import type {
  API,
  ASTPath,
  ArrowFunctionExpression,
  FileInfo,
  FunctionDeclaration,
  FunctionExpression,
} from 'jscodeshift';
import { findBinding, isReference } from '../fastCheck.js';
import { migratePluginCalls, type Expression, type PluginCall, type PluginEdit } from '../pluginMigration.js';

type Callback = ArrowFunctionExpression | FunctionExpression | FunctionDeclaration;
const hookNames = ['beforeEach', 'afterEach', 'asyncBeforeEach', 'asyncAfterEach'];

function callbackFor(site: PluginCall, expr: Expression): Callback | undefined {
  const { j } = site;
  if (j.ArrowFunctionExpression.check(expr) || j.FunctionExpression.check(expr)) return expr;
  if (!j.Identifier.check(expr)) return undefined;
  const declaration = findBinding(j, site.path, expr.name)?.parent;
  if (j.FunctionDeclaration.check(declaration?.node)) return declaration.node;
  if (j.VariableDeclarator.check(declaration?.node) && declaration.parent.node.kind === 'const') {
    const init = declaration.node.init;
    if (j.ArrowFunctionExpression.check(init) || j.FunctionExpression.check(init)) return init;
  }
  return undefined;
}

function hookCallback(site: PluginCall, expr: Expression, asyncProperty: boolean): Expression | undefined {
  const { j } = site;
  const callback = callbackFor(site, expr);
  const global = site.runner === 'configureGlobal';
  if (!callback && (!global || !asyncProperty || !j.Identifier.check(expr))) {
    site.report('Review the hook signature: property plugins do not receive the previous hook.');
    return undefined;
  }
  if (
    callback &&
    (callback.params.length ||
      callback.generator ||
      j(callback.body).find(j.Super).size() ||
      j(callback.body).find(j.Identifier, { name: 'arguments' }).size() ||
      j(callback.body).find(j.ThisExpression).size())
  ) {
    site.report('Review the hook that uses arguments, a receiver or a generator.');
    return undefined;
  }
  let adapted = expr;
  // v4 ignored returned values. A beforeEach plugin treats a returned function as a teardown.
  if (
    !callback ||
    !j.BlockStatement.check(callback.body) ||
    j(callback.body)
      .find(j.ReturnStatement)
      .some((ret) => ret.node.argument != null)
  ) {
    if (global && !asyncProperty && !callback?.async) {
      site.report('Review this global hook return value: it may need awaiting when used with async properties.');
      return undefined;
    }
    const invocation =
      j.ArrowFunctionExpression.check(expr) && !j.BlockStatement.check(expr.body)
        ? expr.body
        : j.callExpression(expr, []);
    const asynchronous = asyncProperty || callback?.async === true;
    const body = j.blockStatement([j.expressionStatement(asynchronous ? j.awaitExpression(invocation) : invocation)]);
    adapted = j.arrowFunctionExpression([], body);
    adapted.async = asynchronous;
  }
  return adapted;
}

function globalHooks(site: PluginCall): PluginEdit | undefined {
  const remove = hookNames.filter((name) => site.options.has(name));
  if (!remove.length) return undefined;
  if (
    (remove.includes('beforeEach') && remove.includes('asyncBeforeEach')) ||
    (remove.includes('afterEach') && remove.includes('asyncAfterEach'))
  ) {
    site.report('Resolve the conflicting synchronous and asynchronous global hooks before migrating.');
    return undefined;
  }
  const localOverride = site
    .j(site.path.scope.path)
    .find(site.j.CallExpression)
    .some(({ node }) => {
      const member = node.callee;
      if (!site.j.MemberExpression.check(member) || member.computed || !site.j.Identifier.check(member.property))
        return false;
      const hook = member.property.name;
      // A matching local hook may override the global one, even on a separately declared property.
      return (
        ['beforeEach', 'afterEach'].includes(hook) &&
        remove.some((name) => name.toLowerCase().endsWith(hook.toLowerCase()))
      );
    });
  if (localOverride) {
    site.report('Review the global hook together with the local hook that overrides it.');
    return undefined;
  }
  const plugins: PluginEdit['plugins'] = [];
  for (const name of remove) {
    const callback = hookCallback(site, site.options.get(name) as Expression, name.startsWith('async'));
    if (!callback) return undefined;
    const plugin = name.toLowerCase().includes('before') ? 'beforeEach' : 'afterEach';
    plugins.push({ value: site.j.callExpression(site.member(plugin), [callback]) });
  }
  return { remove, plugins };
}

// In v4 each local hook wraps the previous hook of the same kind.
function localHookEdit(
  site: PluginCall,
  callback: Expression,
  asyncProperty: boolean,
): { previous: 'first' | 'last' | 'never'; callback?: Expression } | undefined {
  const { j } = site;
  if ((!j.ArrowFunctionExpression.check(callback) && !j.FunctionExpression.check(callback)) || !callback.params.length)
    return { previous: 'never', callback };
  const [param] = callback.params;
  if (
    callback.params.length !== 1 ||
    !j.Identifier.check(param) ||
    callback.generator ||
    (callback.async && !asyncProperty)
  )
    return undefined;
  if (j(callback).find(j.JSXIdentifier, { name: param.name }).size()) return undefined;
  // Include the parameter declaration itself. Extra occurrences need review.
  const count = j(callback).find(j.Identifier, { name: param.name }).size();
  if (count === 1) return { previous: 'never', callback: { ...callback, params: [] } };
  if (count !== 2) return undefined;

  const body = callback.body;
  const statements = j.BlockStatement.check(body) ? body.body : [j.returnStatement(body)];
  const index = statements.findIndex((statement) => {
    const returns = j.ReturnStatement.check(statement);
    if (!returns && !j.ExpressionStatement.check(statement)) return false;
    const expr = returns ? statement.argument : statement.expression;
    const awaited = j.AwaitExpression.check(expr);
    if (asyncProperty && !returns && !awaited) return false;
    const call = awaited ? expr.argument : expr;
    return (
      j.CallExpression.check(call) &&
      !call.arguments.length &&
      j.Identifier.check(call.callee) &&
      call.callee.name === param.name
    );
  });
  if (index < 0 || (index !== 0 && index !== statements.length - 1)) return undefined;
  if (statements.length === 1) return { previous: 'first' };
  if (!j.BlockStatement.check(body) || (index === 0 && j.ReturnStatement.check(statements[0]))) return undefined;
  const rest = statements.filter((_, i) => i !== index);
  // An early return could bypass a trailing previous().
  if (index && rest.some((s) => j.ReturnStatement.check(s) || j(s).find(j.ReturnStatement).size())) return undefined;
  return {
    previous: index === 0 ? 'first' : 'last',
    callback: { ...callback, params: [], body: { ...body, body: rest } },
  };
}

function localHooks(site: PluginCall): PluginEdit | undefined {
  const { j, call } = site;
  const argument = call.arguments[0];
  let property = argument;
  let declarator: ASTPath | undefined;
  if (j.Identifier.check(argument)) {
    const declaration = findBinding(j, site.path, argument.name)?.parent;
    // Moving the hooks is safe for a single-use const in the same scope, with no intervening statements.
    if (
      !declaration ||
      !j.VariableDeclarator.check(declaration.node) ||
      declaration.parent.node.kind !== 'const' ||
      declaration.parent.node.declarations.length !== 1 ||
      !j.CallExpression.check(declaration.node.init)
    )
      return undefined;
    const statement = declaration.parent;
    const next = statement.parentPath.get(Number(statement.name) + 1);
    if (
      !next.value ||
      (next.node !== site.path.node &&
        !j(next)
          .find(j.CallExpression)
          .some((p) => p.node === call)) ||
      declaration.scope !== site.path.scope ||
      j(declaration.scope.path)
        .find(j.Identifier, { name: argument.name })
        .some(
          (ref) =>
            ref.node !== argument &&
            ref.node !== declaration.node.id &&
            isReference(j, ref) &&
            findBinding(j, ref, ref.node.name)?.parent?.node === declaration.node,
        )
    )
      return undefined;
    declarator = declaration;
    property = declaration.node.init;
  }
  const hooks: { name: string; callback: Expression }[] = [];
  while (
    j.CallExpression.check(property) &&
    j.MemberExpression.check(property.callee) &&
    !property.callee.computed &&
    j.Identifier.check(property.callee.property) &&
    ['beforeEach', 'afterEach'].includes(property.callee.property.name)
  ) {
    const name = property.callee.property.name;
    const callback = property.arguments[0];
    if (
      property.arguments.length !== 1 ||
      !callback ||
      callback.type === 'SpreadElement' ||
      !j.CallExpression.check(property.callee.object)
    ) {
      site.report('Review the indirect property hook.');
      return undefined;
    }
    hooks.push({ name, callback });
    property = property.callee.object;
  }
  if (!hooks.length || !j.CallExpression.check(property)) return undefined;
  const factory = site.importedName(property);
  if (factory !== 'property' && factory !== 'asyncProperty') return undefined;
  const before: Expression[] = [];
  const after: Expression[] = [];
  const conflicts: string[] = [];
  const asyncProperty = factory === 'asyncProperty';
  for (const { name, callback } of hooks.reverse()) {
    conflicts.push(name, name === 'beforeEach' ? 'asyncBeforeEach' : 'asyncAfterEach');
    const edit = localHookEdit(site, callback, asyncProperty);
    if (!edit) {
      site.report(`Review how the ${name} callback uses its previous hook.`);
      return undefined;
    }
    const chain = name === 'beforeEach' ? before : after;
    if (edit.previous === 'never') chain.length = 0;
    if (edit.callback) {
      const value = hookCallback(site, edit.callback, asyncProperty);
      if (!value) return undefined;
      if (edit.previous === 'last') chain.unshift(value);
      else chain.push(value);
    }
  }

  const plugins = before.map((fn) => ({ value: j.callExpression(site.member('beforeEach'), [fn]) }));
  if (after.length) {
    // Separate afterEach plugins continue after a failure. One callback preserves v4 short-circuiting.
    let cleanup = after[0];
    if (after.length > 1) {
      const statements = after.flatMap((fn) => {
        if (
          !asyncProperty &&
          j.ArrowFunctionExpression.check(fn) &&
          !fn.async &&
          j.BlockStatement.check(fn.body) &&
          !fn.body.directives?.length &&
          fn.body.body.every((s) => j.ExpressionStatement.check(s))
        )
          return fn.body.body;
        const call = j.callExpression(fn, []);
        return [j.expressionStatement(asyncProperty ? j.awaitExpression(call) : call)];
      });
      const combined = j.arrowFunctionExpression([], j.blockStatement(statements));
      combined.async = asyncProperty;
      cleanup = combined;
    }
    plugins.push({ value: j.callExpression(site.member('afterEach'), [cleanup]) });
  }
  const base = property;
  return {
    remove: [],
    plugins,
    conflicts,
    property: declarator ? undefined : base,
    apply: declarator
      ? () => {
          declarator.get('init').replace(base);
        }
      : undefined,
    insertBefore: (item) => {
      const plugin =
        j.SpreadElement.check(item) &&
        j.ConditionalExpression.check(item.argument) &&
        j.ArrayExpression.check(item.argument.consequent)
          ? item.argument.consequent.elements[0]
          : item;
      return (
        j.CallExpression.check(plugin) &&
        ['ignoreEqualValues', 'skipEqualValues', 'interruptAfterTimeLimit', 'unbiased', 'timeout'].includes(
          site.importedName(plugin) ?? '',
        )
      );
    },
  };
}

export default function transform(file: FileInfo, api: API): string {
  return migratePluginCalls(file, api, (site) =>
    site.runner === 'configureGlobal' ? globalHooks(site) : localHooks(site),
  );
}
