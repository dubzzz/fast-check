import type { API, ASTPath, CallExpression, FileInfo, JSCodeshift } from 'jscodeshift';
import { callsInsideOut, isFunctionExpression } from '../ast.js';
import { findBinding, isConstDeclarator } from '../bindings.js';
import { isFastCheckMember } from '../fastCheck.js';
import { applySamplingOptions, prepareSamplingCall, samplingOptions } from '../sampling.js';
import { parseFile, type Report } from '../transformFile.js';

function migrateClassifier(j: JSCodeshift, call: CallExpression, report: Report): void {
  const classifier = call.arguments[1];
  if (j.ArrowFunctionExpression.check(classifier) && classifier.params.length === 1) {
    const [arg] = classifier.params;
    if (j.ArrayPattern.check(arg) && !arg.typeAnnotation && arg.elements.every((e) => j.Identifier.check(e))) {
      classifier.params = arg.elements;
      return;
    }
    if (j.Identifier.check(arg) && !arg.typeAnnotation) {
      classifier.params = [j.restElement(arg)];
      return;
    }
  }
  report(call, 'Adapt the property classifier to receive separate arguments.');
}

export default function transform(file: FileInfo, api: API): string {
  const { j, root, report, print } = parseFile(file, api);
  function readStatisticsOptions(path: ASTPath<CallExpression>, property: boolean | undefined) {
    const options = samplingOptions(j, path.node.arguments[2]);
    const log = options?.logger?.value;
    const binding = j.Identifier.check(log) ? findBinding(j, path, log.name)?.parent : undefined;
    if (
      options &&
      (!log ||
        isFunctionExpression(j, log) ||
        (j.Identifier.check(log) && (j.FunctionDeclaration.check(binding?.node) || isConstDeclarator(j, binding))))
    )
      return { ...options, log };

    report(path.node, 'Review statistics options and pass the result and original logger to logStatistics.');
    if (property) report(path.node, 'Set noPredicateExecution to true in the statistics options.');
  }

  for (const path of callsInsideOut(j, root)) {
    const { callee, arguments: args } = path.node;
    if (!isFastCheckMember(j, path, callee, 'statistics')) continue;
    // An already consumed statistics result can be a v5 call.
    if (!j.ExpressionStatement.check(path.parent.node) || args.length < 2 || args.length > 3) continue;
    const sampling = prepareSamplingCall(j, path, file.path, 'statistics', report);
    if (!sampling) continue;
    const { result, property } = sampling;
    if (property) migrateClassifier(j, path.node, report);
    const options = readStatisticsOptions(path, property);
    if (!options) {
      path.replace(result);
      continue;
    }
    const { object, logger, log } = options;
    if (logger) object.properties.splice(object.properties.indexOf(logger), 1);
    applySamplingOptions(j, path.node, 2, object, property);
    path.replace(
      j.callExpression(
        j.memberExpression(callee.object, j.identifier('logStatistics')),
        log ? [result, log] : [result],
      ),
    );
  }
  return print();
}
