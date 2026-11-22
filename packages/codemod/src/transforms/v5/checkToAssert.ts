import type { API, FileInfo } from 'jscodeshift';
import { allowAwait } from '../allowAwait.js';
import { memberName } from '../fastCheck.js';
import { reportUnsupported } from '../reportUnsupported.js';

export default function transform(file: FileInfo, api: API): string {
  const typed = /\.[cm]?tsx?$/.test(file.path);
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  let helper = 'assertAndGetRunDetails';
  while (root.find(j.Identifier, { name: helper }).size()) helper += 'ForCheck';
  let namespace: string | undefined;

  root.find(j.CallExpression).forEach((path) => {
    const { callee } = path.node;
    if (
      memberName(j, path, callee) !== 'check' ||
      !j.MemberExpression.check(callee) ||
      !j.Identifier.check(callee.object)
    )
      return;
    const awaited = j.AwaitExpression.check(path.parent.node);
    const value = awaited ? path.parent : path;
    const parent = value.parent.node;
    const discarded = j.ExpressionStatement.check(parent);
    if (!discarded && (!j.VariableDeclarator.check(parent) || parent.init !== value.node)) {
      reportUnsupported(api, path.node, 'Cannot migrate check() in this expression; migrate its caller manually.');
      return;
    }
    // Preserve a promise that may be passed around or chained before it settles.
    if (!awaited && j.VariableDeclarator.check(parent) && j.Identifier.check(parent.id)) {
      const input = path.node.arguments[0];
      const syncProperty = j.CallExpression.check(input) && memberName(j, path, input.callee) === 'property';
      if (!syncProperty) {
        const name = parent.id.name;
        const binding = path.scope.lookup(name);
        if (
          !binding ||
          j(binding.path)
            .find(j.Identifier, { name })
            .some(
              (ref) =>
                ref.node !== parent.id &&
                ref.scope.lookup(name) === binding &&
                !(
                  j.MemberExpression.check(ref.parent.node) &&
                  ref.parent.node.object === ref.node &&
                  j.Identifier.check(ref.parent.node.property) &&
                  ['failed', 'counterexample', 'numRuns', 'interrupted', 'seed'].includes(ref.parent.node.property.name)
                ),
            )
        ) {
          reportUnsupported(api, path.node, 'Cannot migrate check() while its promise is passed around or chained.');
          return;
        }
      }
    }
    const [property, params] = path.node.arguments;
    if (!j.Expression.check(property) || path.node.arguments.length > 2 || j.SpreadElement.check(params)) {
      reportUnsupported(api, path.node, 'Cannot migrate check() with these arguments; migrate the call manually.');
      return;
    }
    if (!discarded && namespace && namespace !== callee.object.name) {
      reportUnsupported(api, path.node, 'Cannot migrate check() using multiple fast-check namespaces in one file.');
      return;
    }
    if (!awaited && !allowAwait(j, path, file.path)) {
      reportUnsupported(api, path.node, 'Cannot add await to check() in this context; migrate its caller manually.');
      return;
    }
    if (discarded) {
      const disableDefaults = j.objectProperty(j.identifier('noDefaultPlugins'), j.booleanLiteral(true));
      // Put the override last, including when the supplied options come from another scope.
      const options = j.objectExpression(params ? [j.spreadElement(params), disableDefaults] : [disableDefaults]);
      path.node.arguments = [property, options];
      callee.property = j.identifier('assert');
    } else {
      namespace = callee.object.name;
      path.node.callee = j.identifier(helper);
    }
    if (!awaited) path.replace(j.awaitExpression(path.node));
  });

  if (namespace) {
    const type = (annotation: string) => (typed ? annotation : '');
    const definition = `
async function ${helper}${type('<Ts>')}(property${type(': ' + namespace + '.Property<Ts>')}, params${type('?: ' + namespace + '.Parameters<Ts>')}${typed ? '' : ' = {}'}) {
  let details${type('!: ' + namespace + '.RunDetails<Ts>')};
  await ${namespace}.assert(property, {
    ...params,
    noDefaultPlugins: true,
    plugins: [...(params?.plugins ?? []), () => ({ onAllRunsComplete(result) { details = result; } })],
  });
  return details;
}`;
    root.find(j.Program).get().node.body.push(j(definition).find(j.FunctionDeclaration).get().node);
  }
  return root.toSource({ quote: 'single' });
}
