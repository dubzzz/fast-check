import type { API, ASTPath, FileInfo } from 'jscodeshift';
import { isFunctionExpression, isNamedMember } from '../ast.js';
import { findSingleConstBinding, referencesOf } from '../bindings.js';
import { callbackStatements, resolveCallback, usesReceiver } from '../callbacks.js';
import { isPropertyFactory } from '../fastCheck.js';
import {
  migratePluginCalls,
  runnerPluginNames,
  type Expression,
  type PluginCall,
  type PluginEdit,
} from '../pluginMigration.js';

const hookNames = ['beforeEach', 'afterEach', 'asyncBeforeEach', 'asyncAfterEach'];

function hookCallback(site: PluginCall, expr: Expression, asyncProperty: boolean): Expression | undefined {
  const { j } = site;
  const callback = resolveCallback(j, site.path, expr);
  const global = site.runner === 'configureGlobal';
  if (!callback && (!global || !asyncProperty || !j.Identifier.check(expr))) {
    site.report('Review the hook signature: property plugins do not receive the previous hook.');
    return undefined;
  }
  if (
    callback &&
    (callback.params.length ||
      callback.generator ||
      usesReceiver(j, callback.body) ||
      j(callback.body).find(j.Identifier, { name: 'arguments' }).size())
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
  const { j } = site;
  const remove = hookNames.filter((name) => site.options.has(name));
  if (!remove.length) {
    return undefined;
  }
  if (
    (remove.includes('beforeEach') && remove.includes('asyncBeforeEach')) ||
    (remove.includes('afterEach') && remove.includes('asyncAfterEach'))
  ) {
    site.report('Resolve the conflicting synchronous and asynchronous global hooks before migrating.');
    return undefined;
  }
  const localOverride = j(site.path.scope.path)
    .find(j.CallExpression)
    .some(({ node }) => {
      const member = node.callee;
      if (!isNamedMember(j, member)) {
        return false;
      }
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
    if (!callback) {
      return undefined;
    }
    const plugin = name.toLowerCase().includes('before') ? 'beforeEach' : 'afterEach';
    plugins.push({ value: j.callExpression(site.member(plugin), [callback]) });
  }
  return { remove, plugins };
}

// In v4 each local hook wraps the previous hook of the same kind.
function localHookEdit(
  site: PluginCall,
  name: string,
  callback: Expression,
  asyncProperty: boolean,
): { previous: 'first' | 'last' | 'never'; callback?: Expression } | undefined {
  const { j } = site;
  function unsupported(): undefined {
    site.report(`Review how the ${name} callback uses its previous hook.`);
    return undefined;
  }
  if (!isFunctionExpression(j, callback) || !callback.params.length) {
    return { previous: 'never', callback };
  }
  const [param] = callback.params;
  if (
    callback.params.length !== 1 ||
    !j.Identifier.check(param) ||
    callback.generator ||
    (callback.async && !asyncProperty)
  ) {
    return unsupported();
  }
  if (j(callback).find(j.JSXIdentifier, { name: param.name }).size()) {
    return unsupported();
  }
  // Include the parameter declaration itself. Extra occurrences need review.
  const count = j(callback).find(j.Identifier, { name: param.name }).size();
  if (count === 1) {
    return { previous: 'never', callback: { ...callback, params: [] } };
  }
  if (count !== 2) {
    return unsupported();
  }

  const body = callback.body;
  const statements = callbackStatements(j, body);
  const index = statements.findIndex((statement) => {
    const returns = j.ReturnStatement.check(statement);
    if (!returns && !j.ExpressionStatement.check(statement)) {
      return false;
    }
    const expr = returns ? statement.argument : statement.expression;
    const awaited = j.AwaitExpression.check(expr);
    if (asyncProperty && !returns && !awaited) {
      return false;
    }
    const call = awaited ? expr.argument : expr;
    return (
      j.CallExpression.check(call) &&
      !call.arguments.length &&
      j.Identifier.check(call.callee) &&
      call.callee.name === param.name
    );
  });
  if (index < 0 || (index !== 0 && index !== statements.length - 1)) {
    return unsupported();
  }
  if (statements.length === 1) {
    return { previous: 'first' };
  }
  if (!j.BlockStatement.check(body) || (index === 0 && j.ReturnStatement.check(statements[0]))) {
    return unsupported();
  }
  const rest = statements.filter((_, i) => i !== index);
  // An early return could bypass a trailing previous().
  if (index && rest.some((s) => j.ReturnStatement.check(s) || j(s).find(j.ReturnStatement).size())) {
    return unsupported();
  }
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
    const binding = findSingleConstBinding(j, site.path, argument.name);
    if (!binding || !j.CallExpression.check(binding.parent.node.init)) {
      return undefined;
    }
    const declaration = binding.parent;
    // Moving hooks must preserve evaluation order and every other use of the property.
    const statement = declaration.parent;
    const next = statement.parentPath.get(Number(statement.name) + 1);
    if (
      !next.value ||
      (next.node !== site.path.node &&
        !j(next)
          .find(j.CallExpression)
          .some((p) => p.node === call)) ||
      declaration.scope !== site.path.scope ||
      referencesOf(j, binding).some((ref) => ref.node !== argument)
    ) {
      return undefined;
    }
    declarator = declaration;
    property = declaration.node.init;
  }
  const hooks: { name: string; callback: Expression }[] = [];
  while (
    j.CallExpression.check(property) &&
    isNamedMember(j, property.callee) &&
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
  if (!hooks.length || !j.CallExpression.check(property)) {
    return undefined;
  }
  const factory = site.importedName(property);
  if (!isPropertyFactory(factory)) {
    return undefined;
  }
  const before: Expression[] = [];
  const after: Expression[] = [];
  const conflicts: string[] = [];
  const asyncProperty = factory === 'asyncProperty';
  for (const { name, callback } of hooks.reverse()) {
    conflicts.push(name, name === 'beforeEach' ? 'asyncBeforeEach' : 'asyncAfterEach');
    const edit = localHookEdit(site, name, callback, asyncProperty);
    if (!edit) {
      return undefined;
    }
    const chain = name === 'beforeEach' ? before : after;
    if (edit.previous === 'never') {
      chain.length = 0;
    }
    if (edit.callback) {
      const value = hookCallback(site, edit.callback, asyncProperty);
      if (!value) {
        return undefined;
      }
      if (edit.previous === 'last') {
        chain.unshift(value);
      } else {
        chain.push(value);
      }
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
        ) {
          return fn.body.body;
        }
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
    insertBefore: runnerPluginNames,
  };
}

export default function transform(file: FileInfo, api: API): string {
  return migratePluginCalls(file, api, (site) =>
    site.runner === 'configureGlobal' ? globalHooks(site) : localHooks(site),
  );
}
