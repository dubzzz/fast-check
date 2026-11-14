import { describe, expect, it } from 'vitest';
import { stringMatching } from './stringMatching.js';
import { assertProduceCorrectValues } from './__test-helpers__/ArbitraryAssertions.js';

describe('stringMatching with class escapes beside dashes', () => {
  it.each(['d', 'D', 's', 'S', 'w', 'W'])('should generate and shrink matching strings with \\%s', async (escape) => {
    for (const source of [
      `[\\${escape}-z]`,
      `[a-\\${escape}]`,
      `[\\${escape}-\\d]`,
      `[^\\${escape}-z]`,
      `[^a-\\${escape}]`,
    ]) {
      const regex = new RegExp(`^${source}$`);
      await assertProduceCorrectValues(
        () => stringMatching(regex),
        (value) => regex.test(value),
      );
    }
  });

  it.each(['[\\d-z]', '[\\s-a]', '[a-\\d]', '[a-\\s]', '[\\d-\\s]'])('should keep the literal dash in %s', (source) => {
    const arb = stringMatching(new RegExp(`^${source}$`));
    expect(arb.canShrinkWithoutContext('-')).toBe(true);
  });
});
