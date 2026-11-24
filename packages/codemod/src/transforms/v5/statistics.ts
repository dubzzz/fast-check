import type {
  API,
  ASTPath,
  ArrowFunctionExpression,
  FileInfo,
  FunctionExpression,
  Identifier,
  JSCodeshift,
} from 'jscodeshift';
import { reportUnsupported } from '../reportUnsupported.js';
import { allowAwait } from '../allowAwait.js';
import { findBinding, memberName } from '../fastCheck.js';
import { isPropertyInput, samplingOptions } from '../sampling.js';

function canMoveLogger(
  j: JSCodeshift,
  path: ASTPath,
  log: unknown,
): log is Identifier | FunctionExpression | ArrowFunctionExpression {
  if (j.ArrowFunctionExpression.check(log) || j.FunctionExpression.check(log)) return true;
  if (!j.Identifier.check(log)) return false;
  const binding = findBinding(j, path, log.name)?.parent;
  return (
    j.FunctionDeclaration.check(binding?.node) ||
    (j.VariableDeclarator.check(binding?.node) && binding.parent.node.kind === 'const')
  );
}

function migrateClassifier(j: JSCodeshift, classifier: unknown): boolean {
  if (!j.ArrowFunctionExpression.check(classifier) || classifier.params.length !== 1) return false;
  const arg = classifier.params[0];
  if ('typeAnnotation' in arg && arg.typeAnnotation) return false;
  if (j.ArrayPattern.check(arg) && arg.elements.every((e) => j.Identifier.check(e))) {
    classifier.params = arg.elements.filter((e) => j.Identifier.check(e));
  } else if (j.Identifier.check(arg)) {
    classifier.params = [j.restElement(arg)];
  } else return false;
  return true;
}

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  for (const path of root.find(j.CallExpression).paths().reverse()) {
    const { callee, arguments: args } = path.node;
    if (memberName(j, path, callee) !== 'statistics' || !j.MemberExpression.check(callee)) continue;
    // An already consumed statistics result can be a v5 call.
    if (!j.ExpressionStatement.check(path.parent.node) || args.length < 2) continue;
    if (args.length > 3) continue;
    if (!allowAwait(j, path, file.path)) {
      reportUnsupported(api, path.node, 'Cannot await statistics() in this synchronous context.');
      continue;
    }
    const property = isPropertyInput(j, path);
    if (property === undefined) {
      reportUnsupported(
        api,
        path.node,
        'If the input is a property, set noPredicateExecution to true and adapt the classifier to receive separate arguments.',
      );
    }
    if (property && !migrateClassifier(j, args[1]))
      reportUnsupported(api, path.node, 'Adapt the property classifier to receive separate arguments.');
    const params = args[2];
    const options = samplingOptions(j, params);
    const logger = options?.opts.properties[options.keys.indexOf('logger')];
    const log = j.ObjectProperty.check(logger) ? logger.value : undefined;
    const result = j.awaitExpression(path.node);
    if (!options || (log && !canMoveLogger(j, path, log))) {
      reportUnsupported(
        api,
        path.node,
        'Review statistics options and pass the result and original logger to logStatistics.',
      );
      if (property) reportUnsupported(api, path.node, 'Set noPredicateExecution to true in the statistics options.');
      path.replace(result);
      continue;
    }
    const { opts, keys } = options;
    if (logger) opts.properties.splice(keys.indexOf('logger'), 1);
    if (property) opts.properties.push(j.objectProperty(j.identifier('noPredicateExecution'), j.booleanLiteral(true)));
    if (opts.properties.length) args[2] = opts;
    else if (params) args.splice(2, 1);
    path.replace(
      j.callExpression(
        j.memberExpression(callee.object, j.identifier('logStatistics')),
        log ? [result, log] : [result],
      ),
    );
  }
  return root.toSource({ quote: 'single' });
}
