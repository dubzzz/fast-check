import type { API, FileInfo } from 'jscodeshift';
import { allowAwait } from '../allowAwait.js';
import { reportUnsupported } from '../reportUnsupported.js';
import { importedName } from '../fastCheck.js';
import { isPropertyInput, samplingOptions } from '../sampling.js';

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  for (const path of root.find(j.CallExpression).paths().reverse()) {
    const { callee, arguments: args } = path.node;
    if (importedName(j, path, callee) !== 'sample') continue;
    const awaited = j.AwaitExpression.check(path.parent.node);
    if (!awaited && !allowAwait(j, path, file.path)) {
      reportUnsupported(api, path.node, 'Cannot await sample() in this synchronous context.');
      continue;
    }
    const property = isPropertyInput(j, path);
    const params = args[1];
    if (property === undefined) {
      reportUnsupported(api, path.node, 'If the sample input is a property, set noPredicateExecution to true.');
    }
    if (!awaited) path.replace(j.awaitExpression(path.node));
    if (args.length > 2) continue;
    const options = samplingOptions(j, params);
    if (!options) continue;
    const { opts, keys } = options;
    if (keys.includes('logger')) continue;
    if (property) opts.properties.push(j.objectProperty(j.identifier('noPredicateExecution'), j.booleanLiteral(true)));
    if (opts.properties.length) args[1] = opts;
    else if (params) args.splice(1, 1);
  }
  return root.toSource({ quote: 'single' });
}
