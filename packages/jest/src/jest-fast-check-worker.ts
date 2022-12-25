import * as fc from 'fast-check';
import { assert, propertyFor } from '@fast-check/worker';
import { jestExpect } from '@jest/expect';
import { buildTest } from './internals/TestBuilder.js';

import type { FastCheckItBuilder } from './internals/TestBuilder.js';
import type { FcExtra, It, JestExtra } from './internals/types.js';

function typedAssign<TTarget>(fun: (...args: any) => any, others: { [K in keyof TTarget]: TTarget[K] }): TTarget {
  return Object.assign(fun, others);
}
function dummyTest(): It {
  return typedAssign<It>(() => void 0, {
    concurrent: typedAssign<It['concurrent']>(() => void 0, {
      each: () => () => void 0,
      failing: typedAssign<It['concurrent']['failing']>(() => void 0, {
        each: () => () => void 0,
      }),
      only: typedAssign<It['concurrent']['only']>(() => void 0, {
        each: () => () => void 0,
        failing: typedAssign<It['concurrent']['only']['failing']>(() => void 0, {
          each: () => () => void 0,
        }),
      }),
      skip: typedAssign<It['concurrent']['skip']>(() => void 0, {
        each: () => () => void 0,
        failing: typedAssign<It['concurrent']['skip']['failing']>(() => void 0, {
          each: () => () => void 0,
        }),
      }),
    }),
    each: () => () => void 0,
    failing: typedAssign<It['failing']>(() => void 0, {
      each: () => () => void 0,
    }),
    only: typedAssign<It['only']>(() => void 0, {
      each: () => () => void 0,
      failing: typedAssign<It['only']['failing']>(() => void 0, {
        each: () => () => void 0,
      }),
    }),
    skip: typedAssign<It['skip']>(() => void 0, {
      each: () => () => void 0,
      failing: typedAssign<It['skip']['failing']>(() => void 0, {
        each: () => () => void 0,
      }),
    }),
    todo: () => void 0,
  });
}

type InitOutput = { test: FastCheckItBuilder<It>; it: FastCheckItBuilder<It>; expect: typeof jestExpect };

export const init = (url: URL): InitOutput => {
  const fcExtra: FcExtra = {
    asyncProperty: propertyFor(url),
    assert: assert as FcExtra['assert'],
    readConfigureGlobal: fc.readConfigureGlobal,
  };
  if (typeof it !== 'undefined') {
    if (typeof jest !== 'undefined') {
      // Jest is always properly defined when in CommonJS bundles
      return {
        test: buildTest(test as It, jest, fcExtra),
        it: buildTest(it as It, jest, fcExtra),
        expect: jestExpect,
      };
    } else {
      // But in ES Modules mode, it cannot be accessed directly, thus users have to directly import it
      // But root import of it is failing in the context of workers, so only dynamic version is acceptable
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return import('@jest/globals').then(
        ({ jest }): InitOutput => ({
          test: buildTest(test as It, jest, fcExtra),
          it: buildTest(it as It, jest, fcExtra),
          expect: jestExpect,
        })
      ) as any;
    }
  }
  const dummyJest: JestExtra = {};
  return {
    test: buildTest(dummyTest(), dummyJest, fcExtra),
    it: buildTest(dummyTest(), dummyJest, fcExtra),
    expect: jestExpect,
  };
};
export { fc };
