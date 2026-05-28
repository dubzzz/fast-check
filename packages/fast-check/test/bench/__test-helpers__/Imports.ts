import { xorshift128plus } from 'pure-rand/generator/xorshift128plus';
import type * as fcCurrentFromSrc from '../../../src/fast-check.js';

// oxlint-disable-next-line typescript/ban-ts-comment
// @ts-ignore - May not be available except if built
import * as fcCurrentImport from '../../../lib/fast-check.js';
// oxlint-disable-next-line typescript/ban-ts-comment
// @ts-ignore - May not be available except if explicitely installed
import * as fcMainImport from 'fast-check-main';

export const fcCurrent: typeof fcCurrentFromSrc = fcCurrentImport as unknown as typeof fcCurrentFromSrc;
export const fcMain: typeof fcCurrentFromSrc = fcMainImport as unknown as typeof fcCurrentFromSrc;

const mrng = xorshift128plus(0);
export const mrngCurrent: fcCurrentFromSrc.Random = new fcCurrent.Random(mrng);
export const mrngMain: fcCurrentFromSrc.Random = new fcMain.Random(mrng);
