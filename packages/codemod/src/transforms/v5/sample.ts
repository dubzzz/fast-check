import type { API, FileInfo } from 'jscodeshift';
import { callsInsideOut } from '../ast.js';
import { importedName } from '../fastCheck.js';
import { applySamplingOptions, awaitSamplingCall, isPropertyInput, samplingOptions } from '../sampling.js';
import { parseFile } from '../transformFile.js';

export default function transform(file: FileInfo, api: API): string {
  const { j, root, report, print } = parseFile(file, api);
  for (const path of callsInsideOut(j, root)) {
    const call = path.node;
    const { callee, arguments: args } = call;
    if (importedName(j, path, callee) !== 'sample') continue;
    const result = awaitSamplingCall(j, path, file.path, 'sample', report);
    if (!result) continue;
    const property = isPropertyInput(j, path);
    const params = args[1];
    if (property === undefined) {
      report(path.node, 'If the sample input is a property, set noPredicateExecution to true.');
    }
    if (result !== path.parent.node) path.replace(result);
    if (args.length > 2) continue;
    const options = samplingOptions(j, params);
    if (options && !options.logger) applySamplingOptions(j, call, 1, options.object, property);
  }
  return print();
}
