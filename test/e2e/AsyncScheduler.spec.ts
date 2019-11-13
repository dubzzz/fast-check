import * as fc from '../../src/fast-check';

const seed = Date.now();
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
        this.props.fetchHeroName().then(heroName => (this.state = { ...this.state, heroName }));
        this.props.fetchHeroes().then(heroes => (this.state = { ...this.state, heroes }));
      }
      render() {
        const { heroName, heroes } = this.state;
        if (!heroes) return null;
        return `got: ${heroes.find(h => h.name === heroName!.toLowerCase())}`;
      }
    }
    const out = await fc.check(
      fc.asyncProperty(fc.scheduler(), async s => {
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
      { seed }
    );
    expect(out.failed).toBe(true);
    expect(out.counterexample![0].toString()).toMatchInlineSnapshot(`
      "-> [function::fetchHeroesById][resolve] [[{\\"name\\":\\"James Bond\\"}]]
      -> [function::fetchHeroName][pending] []"
    `);
    expect(out.error).toContain(`Cannot read property 'toLowerCase' of undefined`);
  });
});
