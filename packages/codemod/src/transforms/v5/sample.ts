import type { API, FileInfo } from 'jscodeshift';
import { allowAwait } from '../allowAwait.js';
import { memberName } from '../fastCheck.js';
import { samplingInput, samplingOptions } from '../sampling.js';

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  for (const path of root.find(j.CallExpression).paths().reverse()) {
    const { callee, arguments: args } = path.node;
    if (memberName(j, path, callee) !== 'sample' || !j.MemberExpression.check(callee)) continue;
    const awaited = j.AwaitExpression.check(path.parent.node);
    if (args.length > 2) continue;
    const source = samplingInput(j, path);
    const params = args[1];
    const options = samplingOptions(j, params);
    if (!source || !options) continue;
    const { input, factory, property } = source;
    const { opts, keys } = options;
    if (keys.includes('logger') || (!awaited && !allowAwait(j, path, file.path))) continue;
    if (property) opts.properties.push(j.objectProperty(j.identifier('noPredicateExecution'), j.booleanLiteral(true)));
    if (factory === 'asyncProperty' && j.MemberExpression.check(input.callee))
      input.callee.property = j.identifier('property');
    if (opts.properties.length) args[1] = opts;
    else if (params) args.splice(1, 1);
    if (!awaited) path.replace(j.awaitExpression(path.node));
  }
  return root.toSource({ quote: 'single' });
}
