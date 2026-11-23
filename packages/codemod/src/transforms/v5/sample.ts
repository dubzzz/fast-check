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
    if (args.length > 2) continue;
    const property = isPropertyInput(j, path);
    const params = args[1];
    const options = samplingOptions(j, params);
    if (property === undefined) {
      reportUnsupported(api, path.node, 'Check whether the sample input is a property or an arbitrary.');
      continue;
    }
    if (!options) continue;
    const { opts, keys } = options;
    if (keys.includes('logger') || (!awaited && !allowAwait(j, path, file.path))) continue;
    if (property) opts.properties.push(j.objectProperty(j.identifier('noPredicateExecution'), j.booleanLiteral(true)));
    if (opts.properties.length) args[1] = opts;
    else if (params) args.splice(1, 1);
    if (!awaited) path.replace(j.awaitExpression(path.node));
  }
  return root.toSource({ quote: 'single' });
}
