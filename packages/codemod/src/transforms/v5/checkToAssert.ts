import type { API, ASTPath, FileInfo, JSCodeshift } from 'jscodeshift';
import { findBinding, isReference, memberName } from '../fastCheck.js';
import { reportUnsupported } from '../reportUnsupported.js';

function isPromiseConsumer(j: JSCodeshift, path: ASTPath): boolean {
  const parent = path.parent.node;
  if (j.AwaitExpression.check(parent)) return true;
  const call = path.parent.parent.node;
  return (
    j.MemberExpression.check(parent) &&
    parent.object === path.node &&
    !parent.computed &&
    j.Identifier.check(parent.property) &&
    ['then', 'catch', 'finally'].includes(parent.property.name) &&
    j.CallExpression.check(call) &&
    call.callee === parent
  );
}

export default function transform(file: FileInfo, api: API): string {
  const typed = /\.[cm]?tsx?$/.test(file.path);
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  let helper = 'assertAndGetRunDetails';
  while (root.find(j.Identifier, { name: helper }).size()) helper += 'ForCheck';
  let namespace: string | undefined;

  function isPromiseBinding(path: ASTPath): boolean {
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
      return false;
    const binding = declarator.id;
    const uses = root
      .find(j.Identifier, { name: binding.name })
      .filter(
        (ref) => ref.node !== binding && isReference(j, ref) && findBinding(j, ref, binding.name)?.node === binding,
      )
      .paths();
    return uses.length > 0 && uses.every((ref) => isPromiseConsumer(j, ref));
  }

  root.find(j.CallExpression).forEach((path) => {
    const { callee } = path.node;
    if (
      memberName(j, path, callee) !== 'check' ||
      !j.MemberExpression.check(callee) ||
      !j.Identifier.check(callee.object)
    )
      return;
    if (!isPromiseConsumer(j, path) && !isPromiseBinding(path)) {
      reportUnsupported(
        api,
        path.node,
        'Cannot determine that check() is consumed as a promise; synchronous or uncertain usages require manual migration.',
      );
      return;
    }
    const discarded = j.AwaitExpression.check(path.parent.node) && j.ExpressionStatement.check(path.parent.parent.node);
    const [property, params] = path.node.arguments;
    if (!j.Expression.check(property) || path.node.arguments.length > 2 || j.SpreadElement.check(params)) {
      reportUnsupported(api, path.node, 'Cannot migrate check() with these arguments; migrate the call manually.');
      return;
    }
    if (!discarded && namespace && namespace !== callee.object.name) {
      reportUnsupported(api, path.node, 'Cannot migrate check() using multiple fast-check namespaces in one file.');
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
