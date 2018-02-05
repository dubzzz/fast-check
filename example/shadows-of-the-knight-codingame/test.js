const assert = require('assert');
const fc = require('fast-check');
const { unit_tests } = require('./units');
const { SpaceBuilder, Space } = require('./space');
const { buggyKnight, knight } = require('./knight');

const SpaceArbitrary = fc.tuple(
    fc.integer(1, 1000), fc.integer(1, 1000),
    fc.integer(1, 1000), fc.integer(1, 1000),
    fc.integer(1, 1000), fc.integer(1, 1000)
).filter(raw => {
    const [w,h,cx,cy,sx,sy] = raw;
    return cx < w && sx < w && cy < h && sy < h
}).map(raw => {
    const [w,h,cx,cy,sx,sy] = raw;
    return new SpaceBuilder()
        .withDimension(w, h)
        .withSolution(cx, cy)
        .withCurrent(sx, sy)
        .build();
}).map(space =>
    [space, Math.ceil(Math.log(Math.max(space.dim_x, space.dim_y))/Math.log(2))]
);

// Properties
describe('buggyKnight', () => {
    unit_tests(buggyKnight);
    it('should always reach its target', () => {
        fc.assert(fc.property(SpaceArbitrary, inputs => {
            const [space, max_guesses] = inputs;
            buggyKnight(space, max_guesses);
            return space.solved();
        }));
    });
});
describe('knight', () => {
    unit_tests(knight);
    it('should always reach its target', () => {
        fc.assert(fc.property(SpaceArbitrary, inputs => {
            const [space, max_guesses] = inputs;
            knight(space, max_guesses);
            return space.solved();
        }));
    });
});
