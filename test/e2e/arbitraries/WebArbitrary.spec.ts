import * as fc from '../../../src/fast-check';
import { seed } from '../seed';
import { URL } from 'url';

describe(`WebArbitrary (seed: ${seed})`, () => {
  it('Should produce valid domains', () => {
    fc.assert(
      fc.property(fc.domain(), (domain) => {
        const p = `http://user:pass@${domain}/path/?query#fragment`;
        const u = new URL(p);
        expect(u.hostname).toEqual(domain);
      }),
      { seed: seed }
    );
  });
  it('Should produce valid authorities', () => {
    fc.assert(
      fc.property(
        fc.webAuthority({
          withIPv4: false,
          withIPv6: false,
          withUserInfo: true,
          withPort: true,
        }),
        (authority) => {
          const domain = /(^|@)([-a-z0-9.]+)(:\d+$|$)/.exec(authority)![2];
          const p = `http://${authority}`;
          const u = new URL(p);
          expect(u.hostname).toEqual(domain);
        }
      ),
      { seed: seed }
    );
  });
  it('Should produce valid URL parts', () => {
    fc.assert(
      fc.property(
        fc.webAuthority({
          withIPv4: true,
          withIPv6: true,
          withIPv4Extended: true,
          withUserInfo: true,
          withPort: true,
        }),
        fc.array(fc.webSegment()).map((p) => p.map((v) => `/${v}`).join('')),
        fc.webQueryParameters(),
        fc.webFragments(),
        (authority, path, query, fragment) => {
          const p = `http://${authority}${path}?${query}#${fragment}`;
          const u = new URL(p);
          expect({ search: decodeURIComponent(u.search), hash: u.hash }).toEqual({
            search: query === '' ? '' : decodeURIComponent(`?${query}`),
            hash: fragment === '' ? '' : `#${fragment}`,
          });

          // Transform    /%2e into /.
          // Transform /%2e%2e into /..
          // Transform   /%2e. into /..  - related to #1235
          // Transform   /.%2e into /..  - related to #1235
          const dotSanitizedPath = path
            .replace(/\/(%2e|%2E)($|\/)/g, '/.$2')
            .replace(/\/(%2e|%2E|\.)(%2e|%2E|\.)($|\/)/g, '/..$3');
          if (!dotSanitizedPath.includes('/..')) {
            const sanitizedPath = dotSanitizedPath
              .replace(/\/\.\/(\.\/)*/g, '/') // replace /./, /././, etc.. by /
              .replace(/\/\.$/, '/'); // replace trailing /. by / if any
            expect(u.pathname).toEqual(sanitizedPath === '' ? '/' : sanitizedPath);
          }
        }
      ),
      { seed: seed }
    );
  });
});
