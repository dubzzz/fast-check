import * as fc from '../../../../../lib/fast-check';
import { buildCompareFilter } from '../../../../../src/arbitrary/_internals/helpers/BuildCompareFilter';
import { Value } from '../../../../../src/check/arbitrary/definition/Value';

describe('buildCompareFilter', () => {
  it('should filter array from duplicated values', () =>
    fc.assert(
      fc.property(fc.array(fc.nat()), (tab) => {
        // Arrange
        const filter = buildCompareFilter<number>((a, b) => a === b);
        const adaptedTab = tab.map((v) => new Value(v, undefined));

        // Act
        const filteredTab = filter(adaptedTab);
        const filteredTabValues = filteredTab.map((s) => s.value);

        // Assert
        expect(filteredTabValues).toHaveLength(new Set(filteredTabValues).size); // no duplicates
        expect(filteredTabValues.every((e) => typeof e === 'number')).toBe(true);
      })
    ));
});
