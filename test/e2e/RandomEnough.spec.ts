import * as fc from '../../src/fast-check';
import { seed } from './seed';

describe(`RandomEnough (seed: ${seed})`, () => {
  it('should not repeat values when noBias enabled', () => {
    const alreadySeenValues = new Set<string>();
    const allEmails = fc.sample(fc.tuple(fc.emailAddress(), fc.emailAddress()).noBias(), { seed });
    for (const [, email] of allEmails) {
      if (alreadySeenValues.has(email)) {
        throw new Error(`email ${email} has already been seen`);
      }
      alreadySeenValues.add(email);
    }
  });
  it('should not repeat values across arbitraries of a tuple when noBias enabled', () => {
    const alreadySeenValues = new Set<string>();
    const allEmails = fc.sample(fc.tuple(fc.emailAddress(), fc.emailAddress()).noBias(), { seed });
    for (const [emailA, emailB] of allEmails) {
      if (alreadySeenValues.has(emailA)) {
        throw new Error(`emailA ${emailA} has already been seen`);
      }
      if (alreadySeenValues.has(emailB)) {
        throw new Error(`emailB ${emailB} has already been seen`);
      }
      alreadySeenValues.add(emailA);
      alreadySeenValues.add(emailB);
    }
  });
  it('should not repeat values between two consecutive sequences', () => {
    const [seqA, seqB] = fc.sample(fc.array(fc.integer(), { minLength: 1000, maxLength: 1000 }).noBias(), {
      seed,
      numRuns: 2,
    });
    const numIdenticalValues = seqA.reduce((acc, item) => {
      return seqB.includes(item) ? acc + 1 : acc;
    }, 0);

    // Given the two generated arrays contain values equiprobably taken from the range -2**31 to 2**31-1
    // The probability to have one value of seqA in seqB is:
    // P(N = 1k) = 1 - ((2**32 - N) / 2**32) * ... * ((2**32 - N) / 2**32)    {N times}
    //           = 0.023280356780186473 %
    //           = 1 over 4300
    // Python code: >>> N = 1000 ; print(1 - (2**32 - N)**N / (2**(32*N)))
    expect(numIdenticalValues).toBeLessThanOrEqual(5);
  });
});
