import { describe, it } from 'vitest';
import fc from 'fast-check';
import { SpaceArbitrary } from './arbitraries/SpaceArbitrary.js';
import { knight } from './src/knight.js';

describe('knight', () => {
  it('should always reach its target', () => {
    fc.assert(
      fc.property(SpaceArbitrary, (inputs) => {
        const [space, max_guesses] = inputs;
        knight(space, max_guesses);
        return space.solved();
      }),
    );
  });
});
