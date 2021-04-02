import * as fc from '../../../../../lib/fast-check';

import { arrayInt64 } from '../../../../../src/check/arbitrary/helpers/ArrayInt64Arbitrary';

import { buildShrinkTree, renderTree } from '../generic/ShrinkTree';

const previousGlobal = fc.readConfigureGlobal();
fc.configureGlobal({
  ...previousGlobal,
  beforeEach: () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  },
});

describe('ArrayInt64', () => {
  if (typeof BigInt === 'undefined') {
    it('no test', () => {
      expect(true).toBe(true);
    });
    return;
  }

  describe('arrayInt64', () => {
    describe('contextualShrinkableFor', () => {
      it('Should shrink strictly positive value for positive range including zero', () => {
        // Arrange
        const arb = arrayInt64({ sign: 1, data: [0, 0] }, { sign: 1, data: [0, 10] });

        // Act
        const tree = buildShrinkTree(arb.contextualShrinkableFor({ sign: 1, data: [0, 8] }));
        const renderedTree = renderTree(tree).join('\n');

        // Assert
        //   When there is no more option, the shrinker retry one time with the value
        //   current-1 to check if something that changed outside (another value not itself)
        //   may have changed the situation
        expect(renderedTree).toMatchInlineSnapshot(`
        "{\\"sign\\":1,\\"data\\":[0,8]}
        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        ├> {\\"sign\\":1,\\"data\\":[0,4]}
        |  ├> {\\"sign\\":1,\\"data\\":[0,2]}
        |  |  └> {\\"sign\\":1,\\"data\\":[0,1]}
        |  |     └> {\\"sign\\":1,\\"data\\":[0,0]}
        |  └> {\\"sign\\":1,\\"data\\":[0,3]}
        |     └> {\\"sign\\":1,\\"data\\":[0,2]}
        |        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |        └> {\\"sign\\":1,\\"data\\":[0,1]}
        |           └> {\\"sign\\":1,\\"data\\":[0,0]}
        ├> {\\"sign\\":1,\\"data\\":[0,6]}
        |  └> {\\"sign\\":1,\\"data\\":[0,5]}
        |     └> {\\"sign\\":1,\\"data\\":[0,4]}
        |        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |        ├> {\\"sign\\":1,\\"data\\":[0,2]}
        |        |  └> {\\"sign\\":1,\\"data\\":[0,1]}
        |        |     └> {\\"sign\\":1,\\"data\\":[0,0]}
        |        └> {\\"sign\\":1,\\"data\\":[0,3]}
        |           └> {\\"sign\\":1,\\"data\\":[0,2]}
        |              ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |              └> {\\"sign\\":1,\\"data\\":[0,1]}
        |                 └> {\\"sign\\":1,\\"data\\":[0,0]}
        └> {\\"sign\\":1,\\"data\\":[0,7]}
           └> {\\"sign\\":1,\\"data\\":[0,6]}
              ├> {\\"sign\\":1,\\"data\\":[0,0]}
              ├> {\\"sign\\":1,\\"data\\":[0,3]}
              |  └> {\\"sign\\":1,\\"data\\":[0,2]}
              |     └> {\\"sign\\":1,\\"data\\":[0,1]}
              |        └> {\\"sign\\":1,\\"data\\":[0,0]}
              └> {\\"sign\\":1,\\"data\\":[0,5]}
                 └> {\\"sign\\":1,\\"data\\":[0,4]}
                    └> {\\"sign\\":1,\\"data\\":[0,3]}
                       ├> {\\"sign\\":1,\\"data\\":[0,0]}
                       └> {\\"sign\\":1,\\"data\\":[0,2]}
                          └> {\\"sign\\":1,\\"data\\":[0,1]}
                             └> {\\"sign\\":1,\\"data\\":[0,0]}"
      `);
      });
      it('Should shrink strictly positive value for range not including zero', () => {
        // Arrange
        const arb = arrayInt64({ sign: 1, data: [1, 10] }, { sign: 1, data: [1, 20] });

        // Act
        const tree = buildShrinkTree(arb.contextualShrinkableFor({ sign: 1, data: [1, 18] }));
        const renderedTree = renderTree(tree).join('\n');

        // Assert
        //   As the range [[1,10], [1,20]] and the value [1,18]
        //   are just offset by +[1,10] compared to the first case,
        //   the rendered tree will be offset by [1,10] too
        expect(renderedTree).toMatchInlineSnapshot(`
        "{\\"sign\\":1,\\"data\\":[1,18]}
        ├> {\\"sign\\":1,\\"data\\":[1,10]}
        ├> {\\"sign\\":1,\\"data\\":[1,14]}
        |  ├> {\\"sign\\":1,\\"data\\":[1,12]}
        |  |  └> {\\"sign\\":1,\\"data\\":[1,11]}
        |  |     └> {\\"sign\\":1,\\"data\\":[1,10]}
        |  └> {\\"sign\\":1,\\"data\\":[1,13]}
        |     └> {\\"sign\\":1,\\"data\\":[1,12]}
        |        ├> {\\"sign\\":1,\\"data\\":[1,10]}
        |        └> {\\"sign\\":1,\\"data\\":[1,11]}
        |           └> {\\"sign\\":1,\\"data\\":[1,10]}
        ├> {\\"sign\\":1,\\"data\\":[1,16]}
        |  └> {\\"sign\\":1,\\"data\\":[1,15]}
        |     └> {\\"sign\\":1,\\"data\\":[1,14]}
        |        ├> {\\"sign\\":1,\\"data\\":[1,10]}
        |        ├> {\\"sign\\":1,\\"data\\":[1,12]}
        |        |  └> {\\"sign\\":1,\\"data\\":[1,11]}
        |        |     └> {\\"sign\\":1,\\"data\\":[1,10]}
        |        └> {\\"sign\\":1,\\"data\\":[1,13]}
        |           └> {\\"sign\\":1,\\"data\\":[1,12]}
        |              ├> {\\"sign\\":1,\\"data\\":[1,10]}
        |              └> {\\"sign\\":1,\\"data\\":[1,11]}
        |                 └> {\\"sign\\":1,\\"data\\":[1,10]}
        └> {\\"sign\\":1,\\"data\\":[1,17]}
           └> {\\"sign\\":1,\\"data\\":[1,16]}
              ├> {\\"sign\\":1,\\"data\\":[1,10]}
              ├> {\\"sign\\":1,\\"data\\":[1,13]}
              |  └> {\\"sign\\":1,\\"data\\":[1,12]}
              |     └> {\\"sign\\":1,\\"data\\":[1,11]}
              |        └> {\\"sign\\":1,\\"data\\":[1,10]}
              └> {\\"sign\\":1,\\"data\\":[1,15]}
                 └> {\\"sign\\":1,\\"data\\":[1,14]}
                    └> {\\"sign\\":1,\\"data\\":[1,13]}
                       ├> {\\"sign\\":1,\\"data\\":[1,10]}
                       └> {\\"sign\\":1,\\"data\\":[1,12]}
                          └> {\\"sign\\":1,\\"data\\":[1,11]}
                             └> {\\"sign\\":1,\\"data\\":[1,10]}"
      `);
      });
      it('Should shrink strictly negative value for negative range including zero', () => {
        // Arrange
        const arb = arrayInt64({ sign: -1, data: [0, 10] }, { sign: 1, data: [0, 0] });

        // Act
        const tree = buildShrinkTree(arb.contextualShrinkableFor({ sign: -1, data: [0, 8] }));
        const renderedTree = renderTree(tree).join('\n');

        // Assert
        //   As the range [-10, 0] and the value -8
        //   are the opposite of first case, the rendered tree will be the same except
        //   it contains opposite values
        expect(renderedTree).toMatchInlineSnapshot(`
        "{\\"sign\\":-1,\\"data\\":[0,8]}
        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        ├> {\\"sign\\":-1,\\"data\\":[0,4]}
        |  ├> {\\"sign\\":-1,\\"data\\":[0,2]}
        |  |  └> {\\"sign\\":-1,\\"data\\":[0,1]}
        |  |     └> {\\"sign\\":1,\\"data\\":[0,0]}
        |  └> {\\"sign\\":-1,\\"data\\":[0,3]}
        |     └> {\\"sign\\":-1,\\"data\\":[0,2]}
        |        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |        └> {\\"sign\\":-1,\\"data\\":[0,1]}
        |           └> {\\"sign\\":1,\\"data\\":[0,0]}
        ├> {\\"sign\\":-1,\\"data\\":[0,6]}
        |  └> {\\"sign\\":-1,\\"data\\":[0,5]}
        |     └> {\\"sign\\":-1,\\"data\\":[0,4]}
        |        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |        ├> {\\"sign\\":-1,\\"data\\":[0,2]}
        |        |  └> {\\"sign\\":-1,\\"data\\":[0,1]}
        |        |     └> {\\"sign\\":1,\\"data\\":[0,0]}
        |        └> {\\"sign\\":-1,\\"data\\":[0,3]}
        |           └> {\\"sign\\":-1,\\"data\\":[0,2]}
        |              ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |              └> {\\"sign\\":-1,\\"data\\":[0,1]}
        |                 └> {\\"sign\\":1,\\"data\\":[0,0]}
        └> {\\"sign\\":-1,\\"data\\":[0,7]}
           └> {\\"sign\\":-1,\\"data\\":[0,6]}
              ├> {\\"sign\\":1,\\"data\\":[0,0]}
              ├> {\\"sign\\":-1,\\"data\\":[0,3]}
              |  └> {\\"sign\\":-1,\\"data\\":[0,2]}
              |     └> {\\"sign\\":-1,\\"data\\":[0,1]}
              |        └> {\\"sign\\":1,\\"data\\":[0,0]}
              └> {\\"sign\\":-1,\\"data\\":[0,5]}
                 └> {\\"sign\\":-1,\\"data\\":[0,4]}
                    └> {\\"sign\\":-1,\\"data\\":[0,3]}
                       ├> {\\"sign\\":1,\\"data\\":[0,0]}
                       └> {\\"sign\\":-1,\\"data\\":[0,2]}
                          └> {\\"sign\\":-1,\\"data\\":[0,1]}
                             └> {\\"sign\\":1,\\"data\\":[0,0]}"
      `);
      });
    });
  });
});
