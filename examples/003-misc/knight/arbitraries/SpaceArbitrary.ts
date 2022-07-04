import fc from 'fast-check';
import { SpaceBuilder, Space } from '../src/space';

export const SpaceArbitrary = fc
  .record({
    w: fc.integer({ min: 1, max: 1000 }),
    h: fc.integer({ min: 1, max: 1000 }),
    cx: fc.integer({ min: 1, max: 1000 }),
    cy: fc.integer({ min: 1, max: 1000 }),
    sx: fc.integer({ min: 1, max: 1000 }),
    sy: fc.integer({ min: 1, max: 1000 }),
  })
  .filter(({ w, h, cx, cy, sx, sy }) => cx < w && sx < w && cy < h && sy < h)
  .map(({ w, h, cx, cy, sx, sy }) =>
    new SpaceBuilder().withDimension(w, h).withSolution(cx, cy).withCurrent(sx, sy).build()
  )
  .map((space) => [space, Math.ceil(Math.log(Math.max(space.dim_x, space.dim_y)) / Math.log(2))] as [Space, number]);
