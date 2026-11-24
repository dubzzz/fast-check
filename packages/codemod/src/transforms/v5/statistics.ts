import type {
  API,
  ASTPath,
  ArrowFunctionExpression,
  FileInfo,
  FunctionExpression,
  Identifier,
  JSCodeshift,
} from 'jscodeshift';
import { callsInsideOut, isFunctionExpression } from '../ast.js';
import { findBinding, isConstDeclarator } from '../bindings.js';
import { isFastCheckMember } from '../fastCheck.js';
import { applySamplingOptions, awaitSamplingCall, isPropertyInput, samplingOptions } from '../sampling.js';
import { parseFile } from '../transformFile.js';

function canMoveLogger(
  j: JSCodeshift,
  path: ASTPath,
  log: unknown,
): log is Identifier | FunctionExpression | ArrowFunctionExpression {
  if (isFunctionExpression(j, log)) return true;
  if (!j.Identifier.check(log)) return false;
  const binding = findBinding(j, path, log.name)?.parent;
  return j.FunctionDeclaration.check(binding?.node) || isConstDeclarator(j, binding);
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
  const { j, root, report, print } = parseFile(file, api);
  for (const path of callsInsideOut(j, root)) {
    const { callee, arguments: args } = path.node;
    if (!isFastCheckMember(j, path, callee, 'statistics')) continue;
    // An already consumed statistics result can be a v5 call.
    if (!j.ExpressionStatement.check(path.parent.node) || args.length < 2 || args.length > 3) continue;
    const result = awaitSamplingCall(j, path, file.path, 'statistics', report);
    if (!result) continue;
    const property = isPropertyInput(j, path);
    if (property === undefined) {
      report(
        path.node,
        'If the input is a property, set noPredicateExecution to true and adapt the classifier to receive separate arguments.',
      );
    }
    if (property && !migrateClassifier(j, args[1]))
      report(path.node, 'Adapt the property classifier to receive separate arguments.');
    const params = args[2];
    const options = samplingOptions(j, params);
    const log = options?.logger?.value;
    if (!options || (log && !canMoveLogger(j, path, log))) {
      report(path.node, 'Review statistics options and pass the result and original logger to logStatistics.');
      if (property) report(path.node, 'Set noPredicateExecution to true in the statistics options.');
      path.replace(result);
      continue;
    }
    const { object, logger } = options;
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
