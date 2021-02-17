import fc from 'fast-check';

import { dependencyTree, PackageDefinition } from './src/dependencyTree';

if (!fc.readConfigureGlobal()) {
  // Global config of Jest has been ignored, we will have a timeout after 5000ms
  // (CodeSandbox falls in this category)
  fc.configureGlobal({ interruptAfterTimeLimit: 4000 });
}

describe('dependencyTree', () => {
  it('should be able to compute a dependency tree for any package of the registry', () =>
    fc.assert(
      fc.asyncProperty(AllPackagesArbitrary, fc.scheduler(), async (packages, s) => {
        // Arrange
        const selectedPackage = Object.keys(packages)[0];
        const fetch: (name: string) => Promise<PackageDefinition> = s.scheduleFunction(function fetch(packageName) {
          return Promise.resolve(packages[packageName]);
        });

        // Act
        dependencyTree(selectedPackage, fetch); // without bugs
        // dependencyTree(selectedPackage, fetch, true); // or with bugs

        // Assert
        let numQueries = 0;
        while (s.count() !== 0) {
          if (++numQueries > 2 * Object.keys(packages).length) {
            throw new Error(`Too many queries`);
          }
          await s.waitOne();
        }
      })
    ));
});

// Helpers

const AllPackagesArbitrary = fc.integer(1, 5).chain((numPackages) => {
  const packageNames = [...Array(numPackages)].map((_, id) => `package-${String.fromCharCode('a'.charCodeAt(0) + id)}`);
  return fc
    .tuple(
      ...packageNames.map((pname) =>
        fc.tuple(
          fc.constant(pname),
          fc.record({
            dependencies: fc.dictionary(fc.constantFrom(...packageNames), fc.constant('1.0.0')),
          }) as fc.Arbitrary<PackageDefinition>
        )
      )
    )
    .map((entries) => Object.fromEntries(entries));
});
