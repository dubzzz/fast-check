import * as fc from '../../src/fast-check';
import { seed } from './seed';

// Code under tests
// Based on the CodinGame https://www.codingame.com/training/medium/shadows-of-the-knight-episode-1

class Space {
  hint = '';
  public currentX: number;
  public currentY: number;
  constructor(
    readonly dimX: number,
    readonly dimY: number,
    private readonly solutionX: number,
    private readonly solutionY: number,
    private readonly initialX: number,
    private readonly initialY: number
  ) {
    this.currentX = initialX;
    this.currentY = initialY;
    this.updateHint();
  }
  updateHint() {
    this.hint = '';

    if (this.solutionY < this.currentY) this.hint += 'U';
    else if (this.solutionY > this.currentY) this.hint += 'D';

    if (this.solutionX < this.currentX) this.hint += 'L';
    else if (this.solutionX > this.currentX) this.hint += 'R';
  }
  move(x: number, y: number) {
    this.currentX = x;
    this.currentY = y;
    this.updateHint();
  }
  solved() {
    return this.currentX === this.solutionX && this.currentY === this.solutionY;
  }
  toString() {
    return `Space(grid{x:${this.dimX},y:${this.dimY}},solution{x:${this.solutionX},y:${this.solutionY}},initial{x:${this.initialX},y:${this.initialY}})`;
  }
}
class SpaceBuilder {
  dimX = 0;
  dimY = 0;
  solutionX = 0;
  solutionY = 0;
  currentX = 0;
  currentY = 0;
  withDimension(x: number, y: number) {
    this.dimX = x;
    this.dimY = y;
    return this;
  }
  withSolution(x: number, y: number) {
    this.solutionX = x;
    this.solutionY = y;
    return this;
  }
  withCurrent(x: number, y: number) {
    this.currentX = x;
    this.currentY = y;
    return this;
  }
  build() {
    return new Space(this.dimX, this.dimY, this.solutionX, this.solutionY, this.currentX, this.currentY);
  }
}

function locateInSpaceBug(space: Space, rounds: number) {
  let xMin = 0;
  let xMax = space.dimX;
  let yMin = 0;
  let yMax = space.dimY;

  for (let n = 0; n !== rounds && !space.solved(); ++n) {
    if (xMin >= xMax || yMin >= yMax) {
      return;
    }

    let x0 = space.currentX;
    let y0 = space.currentY;
    const hint = space.hint;

    if (hint[0] == 'U') {
      yMax = y0 - 1;
      y0 = (yMax + yMin) / 2;
    } else if (hint[0] == 'D') {
      yMin = y0 + 1;
      y0 = (yMax + yMin) / 2;
    }

    if (hint.slice(-1) == 'L') {
      xMax = x0 - 1;
      x0 = (xMax + xMin) / 2;
    } else if (hint.slice(-1) == 'R') {
      xMin = x0 + 1;
      x0 = (xMax + xMin) / 2;
    }
    space.move(Math.floor(x0), Math.floor(y0));
  }
}

function locateInSpace(space: Space, rounds: number) {
  let xMin = 0;
  let xMax = space.dimX;
  let yMin = 0;
  let yMax = space.dimY;

  for (let n = 0; n !== rounds && !space.solved(); ++n) {
    if (xMin >= xMax || yMin >= yMax) {
      return;
    }

    let x0 = space.currentX;
    let y0 = space.currentY;
    const hint = space.hint;

    if (hint[0] == 'U') {
      yMax = y0;
      y0 = (yMax + yMin) / 2;
    } else if (hint[0] == 'D') {
      yMin = y0 + 1;
      y0 = (yMax + yMin) / 2;
    }

    if (hint.slice(-1) == 'L') {
      xMax = x0;
      x0 = (xMax + xMin) / 2;
    } else if (hint.slice(-1) == 'R') {
      xMin = x0 + 1;
      x0 = (xMax + xMin) / 2;
    }
    space.move(Math.floor(x0), Math.floor(y0));
  }
}

// Custom arbitrary

const SpaceArbitrary = fc
  .record({
    w: fc.integer(1, 1000),
    h: fc.integer(1, 1000),
    cx: fc.integer(1, 1000),
    cy: fc.integer(1, 1000),
    sx: fc.integer(1, 1000),
    sy: fc.integer(1, 1000),
  })
  .filter(({ w, h, cx, cy, sx, sy }) => cx < w && sx < w && cy < h && sy < h)
  .map(({ w, h, cx, cy, sx, sy }) =>
    new SpaceBuilder().withDimension(w, h).withSolution(cx, cy).withCurrent(sx, sy).build()
  )
  .map((space: Space): [Space, number] => [space, Math.ceil(Math.log(Math.max(space.dimX, space.dimY)) / Math.log(2))]);

// Test

describe(`Shadows (seed: ${seed})`, () => {
  it('Should detect an implementation issue', () => {
    let failed = false;
    try {
      fc.assert(
        fc.property(SpaceArbitrary, ([space, maxGuesses]: [Space, number]) => {
          locateInSpaceBug(space, maxGuesses);
          return space.solved();
        }),
        { seed: seed }
      );
    } catch (err) {
      failed = true;
      expect(err.message).toContain(`seed: ${seed | 0}, path:`);
      expect(err.message).toMatch(
        /\[Space\(grid\{x:\d+,y:\d+\},solution\{x:\d+,y:\d+\},initial\{x:\d+,y:\d+\}\),\d+\]/
      );
      expect(err.message).toMatch(/failed after \d+ test/);
    }
    expect(failed).toBe(true);
  });
  it('Should not detect any issue', () => {
    fc.assert(
      fc.property(SpaceArbitrary, ([space, maxGuesses]: [Space, number]) => {
        locateInSpace(space, maxGuesses);
        return space.solved();
      }),
      { seed: seed }
    );
  });
});
