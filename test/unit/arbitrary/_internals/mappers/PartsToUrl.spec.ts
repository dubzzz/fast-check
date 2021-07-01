import { URL } from 'url';
import fc from '../../../../../lib/fast-check';
import { partsToUrlUnmapper } from '../../../../../src/arbitrary/_internals/mappers/PartsToUrl';

describe('partsToUrlUnmapper', () => {
  it('should properly extract all parts of an url', () =>
    fc.assert(
      fc.property(
        fc.webUrl({
          authoritySettings: {
            withIPv4: true,
            withIPv4Extended: true,
            withIPv6: true,
            withPort: true,
            withUserInfo: true,
          },
          withFragments: true,
          withQueryParameters: true,
        }),
        (url) => {
          // Arrange
          const parsed = new URL(url);

          // Act
          const [scheme, authority, , query, fragments] = partsToUrlUnmapper(url);

          // Assert
          expect(scheme).toBe(url.split('://')[0]);
          expect(decodeURIComponent(authority)).toContain(decodeURIComponent(parsed.username));
          expect(decodeURIComponent(authority)).toContain(decodeURIComponent(parsed.password));
          // Cannot assert on hostname: ips are sanitized
          // Cannot assert on pathname: paths are sanitized (eg.: .., .)
          if (parsed.search.length !== 0) {
            expect(decodeURIComponent(query!)).toBe(decodeURIComponent(parsed.search.substring(1)));
          } else {
            expect([null, '']).toContain(query);
          }
          if (parsed.hash.length !== 0) {
            expect(decodeURIComponent(fragments!)).toBe(decodeURIComponent(parsed.hash.substring(1)));
          } else {
            expect([null, '']).toContain(fragments);
          }
        }
      )
    ));
});
