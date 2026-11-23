import type { API, FileInfo } from 'jscodeshift';
import { reportUnsupported } from '../reportUnsupported.js';
import { allowAwait } from '../allowAwait.js';
import { findBinding, memberName } from '../fastCheck.js';
import { isPropertyInput, samplingOptions } from '../sampling.js';

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  for (const path of root.find(j.CallExpression).paths().reverse()) {
    const { callee, arguments: args } = path.node;
    if (memberName(j, path, callee) !== 'statistics' || !j.MemberExpression.check(callee)) continue;
    // An already consumed statistics result can be a v5 call.
    if (!j.ExpressionStatement.check(path.parent.node) || args.length < 2) continue;
    if (args.length > 3) continue;
    const property = isPropertyInput(j, path);
    const params = args[2];
    const options = samplingOptions(j, params);
    if (property === undefined) {
      reportUnsupported(api, path.node, 'Check whether the statistics input is a property or an arbitrary.');
      continue;
    }
    if (!options) continue;
    const { opts, keys } = options;
    const logger = opts.properties[keys.indexOf('logger')];
    const log = j.ObjectProperty.check(logger) ? logger.value : undefined;
    if (log && !(j.ArrowFunctionExpression.check(log) || j.FunctionExpression.check(log) || j.Identifier.check(log)))
      continue;
    if (j.Identifier.check(log)) {
      const binding = findBinding(j, path, log.name)?.parent;
      if (
        !j.FunctionDeclaration.check(binding?.node) &&
        !(j.VariableDeclarator.check(binding?.node) && binding.parent.node.kind === 'const')
      )
        continue;
    }

    const classifier = args[1];
    let parameters;
    if (property) {
      if (!j.ArrowFunctionExpression.check(classifier) || classifier.params.length !== 1) continue;
      const arg = classifier.params[0];
      if ('typeAnnotation' in arg && arg.typeAnnotation) continue;
      if (j.ArrayPattern.check(arg) && arg.elements.every((e) => j.Identifier.check(e))) {
        parameters = arg.elements.filter((e) => j.Identifier.check(e));
      } else if (j.Identifier.check(arg)) {
        parameters = [j.restElement(arg)];
      } else continue;
    }
    if (!allowAwait(j, path, file.path)) continue;
    if (logger) opts.properties.splice(keys.indexOf('logger'), 1);
    if (property) opts.properties.push(j.objectProperty(j.identifier('noPredicateExecution'), j.booleanLiteral(true)));
    if (parameters && j.ArrowFunctionExpression.check(classifier)) classifier.params = parameters;
    if (opts.properties.length) args[2] = opts;
    else if (params) args.splice(2, 1);
    const result = j.awaitExpression(path.node);
    path.replace(
      j.callExpression(
        j.memberExpression(callee.object, j.identifier('logStatistics')),
        log ? [result, log] : [result],
      ),
    );
  }
  return root.toSource({ quote: 'single' });
}
