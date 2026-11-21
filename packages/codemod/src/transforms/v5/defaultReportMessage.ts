import type { API, ASTPath, FileInfo, JSCodeshift } from 'jscodeshift';
import { memberName } from '../fastCheck.js';

// Recognize the completion hook emitted by runnerPlugins, whose promise fast-check awaits.
function isCompletionHook(j: JSCodeshift, fn: ASTPath): boolean {
  const field = fn.parent;
  if (
    !j.ObjectProperty.check(field.node) ||
    field.node.computed ||
    !j.Identifier.check(field.node.key) ||
    field.node.key.name !== 'onAllRunsComplete' ||
    field.node.value !== fn.node
  )
    return false;
  const factory = field.parent.parent;
  if (!j.ArrowFunctionExpression.check(factory.node) || factory.node.body !== field.parent.node) return false;
  const owner = factory.parent;
  if (j.CallExpression.check(owner.node))
    return (
      memberName(j, owner, owner.node.callee) === 'installGlobalPlugin' && owner.node.arguments[0] === factory.node
    );
  if (!j.ArrayExpression.check(owner.node)) return false;
  const plugins = owner.parent;
  if (
    !j.ObjectProperty.check(plugins.node) ||
    plugins.node.computed ||
    !j.Identifier.check(plugins.node.key) ||
    plugins.node.key.name !== 'plugins'
  )
    return false;
  const call = plugins.parent.parent;
  return (
    j.CallExpression.check(call.node) &&
    memberName(j, call, call.node.callee) === 'assert' &&
    call.node.arguments[1] === plugins.parent.node
  );
}

function allowAwait(j: JSCodeshift, path: ASTPath, filename: string): boolean {
  let child = path;
  for (let parent = path.parent; parent; child = parent, parent = parent.parent) {
    const node = parent.node;
    if (j.Function.check(node)) {
      if (child.node !== node.body) return false;
      if (node.async) return true;
      if (node.generator || node.returnType || !isCompletionHook(j, parent)) return false;
      node.async = true;
      return true;
    }
    if (j.ClassBody.check(node) || j.TSModuleBlock.check(node)) return false;
    if (j.Program.check(node)) return !/\.c[jt]s$/i.test(filename);
  }
  return false;
}

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  let helper = 'readDefaultReportMessage';
  while (root.find(j.Identifier, { name: helper }).size()) helper += 'ForRun';
  let namespace: string | undefined;
  root.find(j.CallExpression).forEach((path) => {
    const { callee, arguments: args } = path.node;
    if (
      !j.MemberExpression.check(callee) ||
      !j.Identifier.check(callee.object) ||
      args.length !== 1 ||
      !j.Expression.check(args[0])
    )
      return;
    const name = memberName(j, path, callee);
    if (name !== 'defaultReportMessage' && name !== 'asyncDefaultReportMessage') return;
    const needsAwait = name === 'defaultReportMessage' && !j.AwaitExpression.check(path.parent.node);
    if (needsAwait && !allowAwait(j, path, file.path)) return;
    namespace ??= callee.object.name;
    path.node.callee = j.identifier(helper);
    if (needsAwait) path.replace(j.awaitExpression(path.node));
  });
  if (!namespace) return file.source;
  const typed = /\.[cm]?tsx?$/.test(file.path);
  const details = namespace + '.RunDetails<Ts>';
  const signature = 'function ' + helper + (typed ? '<Ts>' : '') + '(details';
  // Keep the v4 overloads for callers that have already narrowed details.failed.
  const overloads = typed
    ? `
${signature}: Extract<${details}, { failed: true }>): Promise<string>;
${signature}: Extract<${details}, { failed: false }>): Promise<undefined>;
${signature}: ${details}): Promise<string | undefined>;
`
    : '';
  const definition = `${overloads}async ${signature}${typed ? ': ' + details : ''})${typed ? ': Promise<string | undefined>' : ''} {
  const reporter = ${namespace}.defaultReporter()${typed ? '<Ts>' : ''}(0, new Map());
  try {
    await reporter.onAllRunsComplete?.(details);
    return undefined;
  } catch (error) {
    if (error instanceof Error) return error.message;
    throw error;
  }
}`;
  root
    .find(j.Program)
    .get()
    .node.body.push(...j(definition).find(j.Program).get().node.body);
  return root.toSource({ quote: 'single' });
}
