import { xorshift128plus } from 'pure-rand/generator/xorshift128plus';
import type * as fcFromSrc from '../../../src/fast-check.js';

// oxlint-disable-next-line typescript/ban-ts-comment
// @ts-ignore - May not be available except if built
import * as fcImport from '../../../lib/fast-check.js';

export const fc: typeof fcFromSrc = fcImport as unknown as typeof fcFromSrc;
export const mrng: fcFromSrc.Random = new fc.Random(xorshift128plus(0));
