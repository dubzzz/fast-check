import { describe, expect, it } from 'vitest';
import { stringMatching } from './stringMatching.js';
import { assertProduceCorrectValues } from './__test-helpers__/ArbitraryAssertions.js';

describe('stringMatching with empty groups', () => {
  it.each(['(?:)', '()', '(?<empty>)', '(?:(?:))', '(?:)*', '()+', '(?:){2,4}', '(?:a|(?:))', 'x(?:)'])(
    'should generate and shrink matching strings for %s',
    async (source) => {
      for (const flags of ['', 'u']) {
        const regex = new RegExp(`^${source}$`, flags);
        await assertProduceCorrectValues(
          () => stringMatching(regex),
          (value) => regex.test(value),
        );
      }
    },
  );

  it.each(['(?:)', '()', '(?<empty>)'])('should honor maxLength zero for %s', (source) => {
    const arb = stringMatching(new RegExp(`^${source}$`), { maxLength: 0 });
    expect(arb.canShrinkWithoutContext('')).toBe(true);
    expect(arb.canShrinkWithoutContext('a')).toBe(false);
  });

  it('should accept the empty RegExp constructor', async () => {
    const regex = new RegExp('');
    await assertProduceCorrectValues(
      () => stringMatching(regex),
      (value) => regex.test(value),
    );
  });
});
