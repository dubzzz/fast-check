export const dependencyTree = async (
  initialPackageName: string,
  fetch: (packageName: string) => Promise<PackageDefinition>,
  withBug: boolean = false
) => {
  const cache: AllPackagesDefinition = {};
  const cachePending = new Set<string>();

  const feedCache = async (packageName: string) => {
    if (!withBug) {
      if (cachePending.has(packageName)) return;
      cachePending.add(packageName);
    }
    if (cache[packageName]) return;

    const packageDef = await fetch(packageName); // cache miss
    cache[packageName] = packageDef;

    await Promise.all(
      Object.keys(packageDef.dependencies).map(async (dependencyName) => {
        //if (dependencyName === packageName) return;
        await feedCache(dependencyName);
      })
    );
  };
  await feedCache(initialPackageName);
  return cache;
};

// Helpers

export type PackageDefinition = {
  dependencies: { [packageName: string]: string };
};
export type AllPackagesDefinition = { [packageName: string]: PackageDefinition };
