import type { API, FileInfo } from 'jscodeshift';
import { allowAwait } from '../allowAwait.js';
import { memberName } from '../fastCheck.js';

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
    if (!discarded && (!j.VariableDeclarator.check(parent) || parent.init !== value.node)) return;
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
        )
          return;
      }
    }
    if (!discarded && namespace && namespace !== callee.object.name) return;
    if (!awaited && !allowAwait(j, path, file.path)) return;
    if (discarded) {
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
