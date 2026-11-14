import { describe, expect, it } from 'vitest';
import { stringMatching } from './stringMatching.js';
import { assertProduceCorrectValues } from './__test-helpers__/ArbitraryAssertions.js';

describe('stringMatching with control escapes', () => {
  it.each(['', 'u'])('should decode every ASCII control letter with flags %j', (flags) => {
    for (const letter of 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      for (const source of [`\\c${letter}`, `[\\c${letter}]`]) {
        const arb = stringMatching(new RegExp(`^${source}$`, flags));
        expect(arb.canShrinkWithoutContext(String.fromCharCode(letter.charCodeAt(0) % 32))).toBe(true);
        expect(arb.canShrinkWithoutContext(`c${letter}`)).toBe(false);
      }
    }
  });

  it.each(['\\cJ', '[\\cJ]', '\\cj+', '[\\cA-\\cZ]+', '[^\\cJ]+', '\\\\cJ'])(
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

  it.each(['0', '9', '_'])('should decode the legacy class control escape \\c%s', async (suffix) => {
    const regex = new RegExp(`^[\\c${suffix}]$`);
    await assertProduceCorrectValues(
      () => stringMatching(regex),
      (value) => regex.test(value),
    );
  });
});
