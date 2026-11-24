import type { API, ASTPath, FileInfo, JSCodeshift } from 'jscodeshift';
import { isNamedMember, isResultDiscarded } from '../ast.js';
import { freshName, identifierNames, localConstBinding, referencesOf } from '../bindings.js';
import { isFastCheckMember } from '../fastCheck.js';
import { parseFile } from '../transformFile.js';

function isPromiseConsumer(j: JSCodeshift, path: ASTPath): boolean {
  const parent = path.parent.node;
  if (j.AwaitExpression.check(parent)) return true;
  const call = path.parent.parent.node;
  return (
    isNamedMember(j, parent) &&
    parent.object === path.node &&
    ['then', 'catch', 'finally'].includes(parent.property.name) &&
    j.CallExpression.check(call) &&
    call.callee === parent
  );
}

export default function transform(file: FileInfo, api: API): string {
  const { j, root, report, typescript: typed, print } = parseFile(file, api);
  const helper = freshName(identifierNames(j, root), 'assertAndGetRunDetails', 'ForCheck');
  let namespace: string | undefined;

  function isPromiseBinding(path: ASTPath): boolean {
    const binding = localConstBinding(j, path);
    if (!binding) return false;
    const uses = referencesOf(j, binding);
    return uses.length > 0 && uses.every((ref) => isPromiseConsumer(j, ref));
  }

  root.find(j.CallExpression).forEach((path) => {
    const { callee } = path.node;
    if (!isFastCheckMember(j, path, callee, 'check')) return;
    if (!isPromiseConsumer(j, path) && !isPromiseBinding(path)) {
      report(
        path.node,
        'Cannot determine that check() is consumed as a promise; synchronous or uncertain usages require manual migration.',
      );
      return;
    }
    const discarded = isResultDiscarded(j, path);
    const [property, params] = path.node.arguments;
    if (!j.Expression.check(property) || path.node.arguments.length > 2 || j.SpreadElement.check(params)) {
      report(path.node, 'Cannot migrate check() with these arguments; migrate the call manually.');
      return;
    }
    if (!discarded && namespace && namespace !== callee.object.name) {
      report(path.node, 'Cannot migrate check() using multiple fast-check namespaces in one file.');
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
  return print();
}
