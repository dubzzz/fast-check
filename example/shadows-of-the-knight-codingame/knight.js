// This implementation is supposed to solve the CodinGame:
// https://www.codingame.com/training/medium/shadows-of-the-knight-episode-1
//
// Among the two implementations below, one is bugged the other not

const buggyKnight = function(space, rounds) {
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
    const hint = space.hint;

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
};

const knight = function(space, rounds) {
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
    const hint = space.hint;

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
};

module.exports = { buggyKnight, knight };
