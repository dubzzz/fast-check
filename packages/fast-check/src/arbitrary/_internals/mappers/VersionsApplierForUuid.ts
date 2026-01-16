import { Error, safeSubstring } from '../../../utils/globals.js';

/** @internal */
const quickNumberToHexaString = '0123456789abcdef';

/** @internal */
export function buildVersionsAppliersForUuid(versions: number[]): {
  versionsApplierMapper: (value: string) => string;
  versionsApplierUnmapper: (value: unknown) => string;
} {
  const mapping: Record<string, string> = {};
  const reversedMapping: Record<string, string> = {};
  for (let index = 0; index !== versions.length; ++index) {
    const from = quickNumberToHexaString[index];
    const to = quickNumberToHexaString[versions[index]];
    mapping[from] = to;
    reversedMapping[to] = from;
  }
  function versionsApplierMapper(value: string): string {
    return mapping[value[0]] + safeSubstring(value, 1);
  }
  function versionsApplierUnmapper(value: unknown): string {
    const v = value as string;
    const rev = reversedMapping[v[0]];
    if (rev === undefined) {
      throw new Error('Cannot produce strings not starting by the version in hexa code');
    }
    return rev + safeSubstring(v, 1);
  }
  return { versionsApplierMapper, versionsApplierUnmapper };
}
