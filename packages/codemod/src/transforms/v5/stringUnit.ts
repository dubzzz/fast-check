import type { API, FileInfo } from 'jscodeshift';
import { withComments } from '../ast.js';
import { importedName } from '../fastCheck.js';
import { inspectOptions } from '../options.js';
import { parseFile } from '../transformFile.js';

export default function transform(file: FileInfo, api: API): string {
  const { j, root, report, print } = parseFile(file, api);
  let changed = false;

  root.find(j.CallExpression).forEach((path) => {
    const args = path.node.arguments;
    if (args.length !== 1 || !j.ObjectExpression.check(args[0])) return;

    const name = importedName(j, path, path.node.callee);
    const isJson = name === 'json' || name === 'jsonValue';
    if (!isJson && name !== 'object' && name !== 'anything') return;
    const flag = isJson ? 'noUnicodeString' : 'withUnicodeString';
    const { named, hasUnsupportedProperties } = inspectOptions(j, args[0]);
    const [property, duplicate] = named.get(flag) ?? [];
    if (duplicate) {
      report(duplicate, `Cannot migrate duplicate ${flag} flags; resolve the options manually.`);
      return;
    }
    if (!property) return;
    if (hasUnsupportedProperties) {
      report(property, `Cannot migrate ${flag} in an options object containing spreads or unsupported property keys.`);
      return;
    }
    if (!j.BooleanLiteral.check(property.value)) {
      report(property, `Cannot migrate non-literal ${flag}; replace it with stringUnit manually.`);
      return;
    }

    if (named.has('stringUnit')) {
      args[0].properties = args[0].properties.filter((entry) => entry !== property);
    } else {
      const unicode = isJson ? !property.value.value : property.value.value;
      const value = j.stringLiteral(unicode ? 'binary' : 'grapheme-ascii');
      property.key = withComments(j.identifier('stringUnit'), property.key);
      property.value = withComments(value, property.value);
    }
    changed = true;
  });

  return print(changed);
}
