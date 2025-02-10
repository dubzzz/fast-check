import { describe, it, expect } from 'vitest';
import fc from '../../src/fast-check';
import { seed } from './seed';

describe(`AsyncScheduler (seed: ${seed})`, () => {
  it('should detect trivial race conditions', async () => {
    // The code below relies on the fact/expectation that fetchA takes less time that fetchB
    // The aim of this test is to show that the code is wrong as soon as this assumption breaks
    type CompoProps = { fetchHeroName: () => Promise<string>; fetchHeroes: () => Promise<{ name: string }[]> };
    type CompoState = { heroName: string | undefined; heroes: { name: string }[] | undefined };
    class Compo {
      private props: CompoProps;
      private state: CompoState;
      constructor(props: CompoProps) {
        this.props = props;
        this.state = { heroName: undefined, heroes: undefined };
      }
      componentDidMount() {
        this.props.fetchHeroName().then((heroName) => (this.state = { ...this.state, heroName }));
        this.props.fetchHeroes().then((heroes) => (this.state = { ...this.state, heroes }));
      }
      render() {
        const { heroName, heroes } = this.state;
        if (!heroes) return null;
        return `got: ${heroes.find((h) => h.name === heroName!.toLowerCase())}`;
      }
    }
    const out = await fc.check(
      fc.asyncProperty(fc.scheduler(), async (s) => {
        const fetchHeroName = s.scheduleFunction(function fetchHeroName() {
          return Promise.resolve('James Bond');
        });
        const fetchHeroes = s.scheduleFunction(function fetchHeroesById() {
          return Promise.resolve([{ name: 'James Bond' }]);
        });
        const c = new Compo({ fetchHeroName, fetchHeroes });
        c.componentDidMount();
        c.render();
        while (s.count() !== 0) {
          await s.waitOne();
          c.render();
        }
      }),
      { seed },
    );
    expect(out.failed).toBe(true);
    expect(out.counterexample![0].toString()).toEqual(
      'schedulerFor()`\n' +
        '-> [task${2}] function::fetchHeroesById() resolved with value [{"name":"James Bond"}]\n' +
        '-> [task${1}] function::fetchHeroName2() pending`',
    );
    // Node  <16: Cannot read property 'toLowerCase' of undefined
    // Node >=16: TypeError: Cannot read properties of undefined (reading 'toLowerCase')
    expect((out.errorInstance as Error).message).toContain(`'toLowerCase'`);
  });

  it('should detect race conditions leading to infinite loops', async () => {
    // Following case is an example of code trying to scan all the dependencies of a given package
    // In order to build a nice graph
    type PackageDefinition = {
      dependencies: { [packageName: string]: string };
    };
    type AllPackagesDefinition = { [packageName: string]: PackageDefinition };
    const allPackages: AllPackagesDefinition = {
      toto: {
        dependencies: {
          titi: '^1.0.0',
          tata: '^2.0.0',
          tutu: '^3.0.0',
        },
      },
      titi: {
        dependencies: {
          noop: '^1.0.0',
          tutu: '^3.0.0',
        },
      },
      tata: {
        dependencies: {
          noop: '^1.0.0',
        },
      },
      noop: {
        dependencies: {},
      },
      tutu: {
        dependencies: {
          titi: '^1.0.0',
        },
      },
    };
    const buildGraph = async (
      initialPackageName: string,
      fetch: (packageName: string) => Promise<PackageDefinition>,
    ) => {
      const cache: AllPackagesDefinition = {};
      // // Uncomment to remove the bug
      //const cachePending = new Set<string>();
      const feedCache = async (packageName: string) => {
        // // Uncomment to remove the bug
        // if (cachePending.has(packageName)) return;
        // cachePending.add(packageName);
        if (cache[packageName]) return;

        const packageDef = await fetch(packageName); // cache miss
        // eslint-disable-next-line require-atomic-updates
        cache[packageName] = packageDef;

        await Promise.all(Object.keys(packageDef.dependencies).map((dependencyName) => feedCache(dependencyName)));
      };
      await feedCache(initialPackageName);
      return cache; // we just return the cache instead of the garph for simplicity
    };
    const out = await fc.check(
      fc.asyncProperty(fc.constantFrom(...Object.keys(allPackages)), fc.scheduler(), async (initialPackageName, s) => {
        let numFetches = 0;
        const originalFetch = (packageName: string) => {
          ++numFetches;
          return Promise.resolve(allPackages[packageName]);
        };
        const fetch = s.scheduleFunction(originalFetch);
        const handle = buildGraph(initialPackageName, fetch);
        // Or: await s.waitAll();
        while (s.count() !== 0) {
          expect(numFetches).toBeLessThanOrEqual(Object.keys(allPackages).length);
          await s.waitOne();
        }
        await handle; // nothing should block now
      }),
      { seed },
    );
    expect(out.failed).toBe(true);
  });

  it('should be able to replay failures using examples and the value of schedulerFor extracted from error logs', async () => {
    const inc = async (db: { read: () => Promise<number>; write: (n: number) => Promise<void> }) => {
      const v = await db.read();
      await db.write(v + 1);
    };
    const propertyValidator = async (s: fc.Scheduler) => {
      let value = 0;
      const db = {
        read: s.scheduleFunction(async function read() {
          return value;
        }),
        write: s.scheduleFunction(async function write(n: number) {
          value = n;
        }),
      };
      s.schedule(Promise.resolve('A')).then(() => inc(db));
      s.schedule(Promise.resolve('B')).then(() => inc(db));
      s.schedule(Promise.resolve('C')).then(() => inc(db));
      await s.waitAll();

      expect(value).toBe(3);
    };

    const out = await fc.check(fc.asyncProperty(fc.scheduler(), propertyValidator));
    expect(out.failed).toBe(true);

    const schedulerTemplatedString = String(out.counterexample![0]);
    const argsForSchedulerFor: any[] = eval(`(() => {
      // Extract template string parameters
      function schedulerFor() {
        return function(strs, ...ordering) {
          return [strs, ...ordering];
        }
      }
      return ${schedulerTemplatedString};
    })()`);

    const outRetry = await fc.check(fc.asyncProperty(fc.scheduler(), propertyValidator), {
      examples: [[(fc.schedulerFor() as any)(...argsForSchedulerFor)]],
    });
    expect(outRetry.failed).toBe(true);
    expect(outRetry.numRuns).toBe(1);

    expect(outRetry.errorInstance).toStrictEqual(out.errorInstance);
    expect(String(outRetry.counterexample![0])).toBe(String(out.counterexample![0]));
  });
});
