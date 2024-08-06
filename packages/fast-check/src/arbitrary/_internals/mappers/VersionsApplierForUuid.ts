import { safeNumberToString, Error, safeSubstring } from '../../../utils/globals';

/** @internal */
export function buildVersionsAppliersForUuid(versions: number[]) {
  const mapping: Record<string, string> = {};
  const reversedMapping: Record<string, string> = {};
  for (let index = 0; index !== versions.length; ++index) {
    const from = safeNumberToString(index, 16);
    const to = safeNumberToString(versions[index], 16);
    mapping[from] = to;
    reversedMapping[to] = from;
  }
  function versionsApplierMapper(value: string): string {
    return mapping[value[0]] + safeSubstring(value, 1);
  }
  function versionsApplierUnmapper(value: unknown): string {
    if (typeof value !== 'string') {
      throw new Error('Cannot produce non-string values');
    }
    const rev = reversedMapping[value[0]];
    if (rev === undefined) {
      throw new Error('Cannot produce strings not starting by the version in hexa code');
    }
    return rev + safeSubstring(value, 1);
  }
  return { versionsApplierMapper, versionsApplierUnmapper };
}
