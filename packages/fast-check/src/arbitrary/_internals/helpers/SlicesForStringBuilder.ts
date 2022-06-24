import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';

const dangerousStrings = [
  // JavaScript
  '__prototype__',
  '__proto__',
  'proto',
  'constructor',
  'set',
  'get',
  'break',
  'case',
  'class',
  'catch',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'enum',
  'await',
  'implements',
  'let',
  'package',
  'protected',
  'static',
  'interface',
  'private',
  'public',
  'abstract',
  'boolean',
  'byte',
  'char',
  'double',
  'final',
  'float',
  'goto',
  'int',
  'long',
  'native',
  'short',
  // React
  'key',
  'ref',
];

export function createSlicesForStringBuilder(
  charArbitrary: Arbitrary<string>,
  stringSplitter: (value: string) => string[]
): () => string[][] {
  const slicesForString: string[][] = dangerousStrings
    .map((dangerous) => {
      try {
        return stringSplitter(dangerous);
      } catch (err) {
        return [];
      }
    })
    .filter((entry) => entry.length > 0 && entry.every((c) => charArbitrary.canShrinkWithoutContext(c)));
  return function buildSlicesForString(): string[][] {
    return slicesForString;
  };
}
