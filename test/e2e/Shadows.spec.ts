import * as fc from '../../src/fast-check';

// Code under tests
// Based on the CodinGame https://www.codingame.com/training/medium/shadows-of-the-knight-episode-1

class Space {
  hint: string = '';
  public current_x: number;
  public current_y: number;
  constructor(
    readonly dim_x: number,
    readonly dim_y: number,
    private readonly solution_x: number,
    private readonly solution_y: number,
    private readonly initial_x: number,
    private readonly initial_y: number
  ) {
    this.current_x = initial_x;
    this.current_y = initial_y;
    this.update_hint();
  }
  update_hint() {
    this.hint = '';

    if (this.solution_y < this.current_y) this.hint += 'U';
    else if (this.solution_y > this.current_y) this.hint += 'D';

    if (this.solution_x < this.current_x) this.hint += 'L';
    else if (this.solution_x > this.current_x) this.hint += 'R';
  }
  move(x: number, y: number) {
    this.current_x = x;
    this.current_y = y;
    this.update_hint();
  }
  solved() {
    return this.current_x === this.solution_x && this.current_y === this.solution_y;
  }
  toString() {
    return `Space(grid{x:${this.dim_x},y:${this.dim_y}},solution{x:${this.solution_x},y:${this.solution_y}},initial{x:${
      this.initial_x
    },y:${this.initial_y}})`;
  }
}
class SpaceBuilder {
  dim_x = 0;
  dim_y = 0;
  solution_x = 0;
  solution_y = 0;
  current_x = 0;
  current_y = 0;
  withDimension(x: number, y: number) {
    this.dim_x = x;
    this.dim_y = y;
    return this;
  }
  withSolution(x: number, y: number) {
    this.solution_x = x;
    this.solution_y = y;
    return this;
  }
  withCurrent(x: number, y: number) {
    this.current_x = x;
    this.current_y = y;
    return this;
  }
  build() {
    return new Space(this.dim_x, this.dim_y, this.solution_x, this.solution_y, this.current_x, this.current_y);
  }
}

function locate_in_space_bug(space: Space, rounds: number) {
  let x_min = 0;
  let x_max = space.dim_x;
  let y_min = 0;
  let y_max = space.dim_y;

  for (let n = 0; n !== rounds && !space.solved(); ++n) {
    if (x_min >= x_max || y_min >= y_max) {
      return;
    }

    let x0 = space.current_x;
    let y0 = space.current_y;
    let hint = space.hint;

    if (hint[0] == 'U') {
      y_max = y0 - 1;
      y0 = (y_max + y_min) / 2;
    } else if (hint[0] == 'D') {
      y_min = y0 + 1;
      y0 = (y_max + y_min) / 2;
    }

    if (hint.slice(-1) == 'L') {
      x_max = x0 - 1;
      x0 = (x_max + x_min) / 2;
    } else if (hint.slice(-1) == 'R') {
      x_min = x0 + 1;
      x0 = (x_max + x_min) / 2;
    }
    space.move(Math.floor(x0), Math.floor(y0));
  }
}

function locate_in_space(space: Space, rounds: number) {
  let x_min = 0;
  let x_max = space.dim_x;
  let y_min = 0;
  let y_max = space.dim_y;

  for (let n = 0; n !== rounds && !space.solved(); ++n) {
    if (x_min >= x_max || y_min >= y_max) {
      return;
    }

    let x0 = space.current_x;
    let y0 = space.current_y;
    let hint = space.hint;

    if (hint[0] == 'U') {
      y_max = y0;
      y0 = (y_max + y_min) / 2;
    } else if (hint[0] == 'D') {
      y_min = y0 + 1;
      y0 = (y_max + y_min) / 2;
    }

    if (hint.slice(-1) == 'L') {
      x_max = x0;
      x0 = (x_max + x_min) / 2;
    } else if (hint.slice(-1) == 'R') {
      x_min = x0 + 1;
      x0 = (x_max + x_min) / 2;
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
    sy: fc.integer(1, 1000)
  })
  .filter(({ w, h, cx, cy, sx, sy }) => cx < w && sx < w && cy < h && sy < h)
  .map(({ w, h, cx, cy, sx, sy }) =>
    new SpaceBuilder()
      .withDimension(w, h)
      .withSolution(cx, cy)
      .withCurrent(sx, sy)
      .build()
  )
  .map((space: Space) => [space, Math.ceil(Math.log(Math.max(space.dim_x, space.dim_y)) / Math.log(2))]);

// Test

const seed = Date.now();
describe(`Shadows (seed: ${seed})`, () => {
  it('Should detect an implementation issue', () => {
    let failed = false;
    try {
      fc.assert(
        fc.property(SpaceArbitrary, ([space, max_guesses]: [Space, number]) => {
          locate_in_space_bug(space, max_guesses);
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
      fc.property(SpaceArbitrary, ([space, max_guesses]: [Space, number]) => {
        locate_in_space(space, max_guesses);
        return space.solved();
      }),
      { seed: seed }
    );
  });
});
