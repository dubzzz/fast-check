import type { API, FileInfo } from 'jscodeshift';
import { allowAwait } from '../allowAwait.js';
import { memberName } from '../fastCheck.js';

const arbitraries = [
  'integer',
  'nat',
  'string',
  'boolean',
  'double',
  'constant',
  'constantFrom',
  'tuple',
  'array',
  'record',
  'oneof',
];

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  for (const path of root.find(j.CallExpression).paths().reverse()) {
    const { callee, arguments: args } = path.node;
    const runner = memberName(j, path, callee);
    if ((runner !== 'sample' && runner !== 'statistics') || !j.MemberExpression.check(callee)) continue;
    const stats = runner === 'statistics';
    const awaited = j.AwaitExpression.check(path.parent.node);
    // An already consumed statistics result can be a v5 call.
    if (stats && (awaited || !j.ExpressionStatement.check(path.parent.node))) continue;
    let input = args[0];
    let inputScope = path;
    if (j.Identifier.check(input)) {
      const binding = path.scope.lookup(input.name)?.getBindings()[input.name]?.[0]?.parent;
      if (
        !j.VariableDeclarator.check(binding?.node) ||
        binding.parent.node.kind !== 'const' ||
        !j.CallExpression.check(binding.node.init)
      )
        continue;
      input = binding.node.init;
      inputScope = binding;
    }
    if (!j.CallExpression.check(input)) continue;
    const factory = memberName(j, inputScope, input.callee);
    const property = factory === 'property' || factory === 'asyncProperty';
    if (!property && !arbitraries.includes(factory ?? '')) continue;
    const index = stats ? 2 : 1;
    const params = args[index];
    if (args.length > index + 1 || (params && !j.NumericLiteral.check(params) && !j.ObjectExpression.check(params)))
      continue;
    const opts = j.ObjectExpression.check(params)
      ? params
      : j.objectExpression(params ? [j.objectProperty(j.identifier('numRuns'), params)] : []);
    const keys = opts.properties.map((p) =>
      j.ObjectProperty.check(p) && !p.computed && j.Identifier.check(p.key) ? p.key.name : undefined,
    );
    if (keys.includes(undefined) || new Set(keys).size !== keys.length || keys.includes('noPredicateExecution'))
      continue;
    const logger = opts.properties[keys.indexOf('logger')];
    const log = j.ObjectProperty.check(logger) ? logger.value : undefined;
    if (
      log &&
      !(stats && (j.ArrowFunctionExpression.check(log) || j.FunctionExpression.check(log) || j.Identifier.check(log)))
    )
      continue;
    if (j.Identifier.check(log)) {
      const binding = path.scope.lookup(log.name)?.getBindings()[log.name]?.[0]?.parent;
      if (
        !j.FunctionDeclaration.check(binding?.node) &&
        !(j.VariableDeclarator.check(binding?.node) && binding.parent.node.kind === 'const')
      )
        continue;
    }

    const classifier = args[1];
    let parameters;
    if (stats && property) {
      if (!j.ArrowFunctionExpression.check(classifier) || classifier.params.length !== 1) continue;
      const arg = classifier.params[0];
      if ('typeAnnotation' in arg && arg.typeAnnotation) continue;
      if (j.ArrayPattern.check(arg) && arg.elements.every((e) => j.Identifier.check(e))) {
        parameters = arg.elements.filter((e) => j.Identifier.check(e));
      } else if (j.Identifier.check(arg)) {
        parameters = [j.restElement(arg)];
      } else continue;
    }
    if (!awaited && !allowAwait(j, path, file.path)) continue;
    if (logger) opts.properties.splice(keys.indexOf('logger'), 1);
    if (property) opts.properties.push(j.objectProperty(j.identifier('noPredicateExecution'), j.booleanLiteral(true)));
    if (factory === 'asyncProperty' && j.MemberExpression.check(input.callee))
      input.callee.property = j.identifier('property');
    if (parameters && j.ArrowFunctionExpression.check(classifier)) classifier.params = parameters;
    if (opts.properties.length) args[index] = opts;
    else if (params) args.splice(index, 1);
    if (!awaited) {
      const result = j.awaitExpression(path.node);
      path.replace(
        stats
          ? j.callExpression(
              j.memberExpression(callee.object, j.identifier('logStatistics')),
              log ? [result, log] : [result],
            )
          : result,
      );
    }
  }
  return root.toSource({ quote: 'single' });
}
