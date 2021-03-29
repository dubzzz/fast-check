import * as fc from '../../../../../lib/fast-check';
import { NextValue } from '../../../../../src/check/arbitrary/definition/NextValue';

import { buildCompareFilter } from '../../../../../src/check/arbitrary/helpers/BuildCompareFilter';

const validSet = (s: number[]) => s.length === new Set(s).size && s.every((e) => typeof e === 'number');

describe('buildCompareFilter', () => {
  it('Should filter array from duplicated values', () =>
    fc.assert(
      fc.property(fc.array(fc.nat()), (tab) => {
        const filter = buildCompareFilter<number>((a, b) => a === b);
        const adaptedTab = tab.map((v) => new NextValue(v));
        const filteredTab = filter(adaptedTab);
        expect(validSet(filteredTab.map((s) => s.value))).toBe(true);
      })
    ));
});
