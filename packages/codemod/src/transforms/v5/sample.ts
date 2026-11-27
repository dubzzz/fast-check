import type { API, FileInfo } from 'jscodeshift';
import { callsInsideOut } from '../ast.js';
import { importedName } from '../fastCheck.js';
import { applySamplingOptions, prepareSamplingCall, samplingOptions } from '../sampling.js';
import { parseFile } from '../transformFile.js';

export default function transform(file: FileInfo, api: API): string {
  const { j, root, report, print } = parseFile(file, api);
  for (const path of callsInsideOut(j, root)) {
    const call = path.node;
    const { callee, arguments: args } = call;
    if (importedName(j, path, callee) !== 'sample') {
      continue;
    }
    const sampling = prepareSamplingCall(j, path, file.path, 'sample', report);
    if (!sampling) {
      continue;
    }
    const { result, property } = sampling;
    if (result !== path.parent.node) {
      path.replace(result);
    }
    if (args.length > 2) {
      continue;
    }
    const options = samplingOptions(j, args[1]);
    if (options && !options.logger) {
      applySamplingOptions(j, call, 1, options.object, property);
    }
  }
  return print();
}
