import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 24,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: () => true,
  buggyAdventSurcharged: (...args: Parameters<ReturnType<typeof adventBuggy>>) => {
    const expected = distributeCoins(...args);
    const out = adventBuggy()(...args);
    const [availableCoins, amountsToBePaid] = args;
    if (out === null) {
      return expected === null ? true : 'not supposed to find anything';
    }
    for (let index = 0; index !== amountsToBePaid.length; ++index) {
      if (out[index].reduce((acc, v) => acc + v, 0) !== amountsToBePaid[index]) {
        return 'bad amount';
      }
    }
    const coins = [...availableCoins];
    for (const coinsForPayslip of out) {
      for (const coinValue of coinsForPayslip) {
        const index = coins.indexOf(coinValue);
        if (index === -1) {
          return 'no such coin';
        }
        coins.splice(index, 1);
      }
    }
    return true;
  },
  parser,
  placeholderForm: '7,5,8?\n1,2,2,4,5,7,10',
  functionName: 'distributeCoins',
  signature: 'distributeCoins(availableCoins: Coin[], amountsToBePaid: number[]): Coin[][] | null;',
  signatureExtras: ['type Coin = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;'],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

function distributeCoins(availableCoins, payslips) {
  const coins = [...availableCoins].sort((a, b) => b - a);

  function helper(targets, indexInTarget, nextCoins = coins) {
    if (indexInTarget >= targets.length) {
      return [];
    }
    if (targets[indexInTarget] === 0) {
      const withCurrent = helper(targets, indexInTarget + 1);
      if (withCurrent === null) {
        return null;
      }
      return [[], ...withCurrent];
    }
    if (targets[indexInTarget] < 0 || nextCoins.length === 0) {
      return null;
    }
    const subNextCoins = nextCoins.slice(1);
    const newTargets = targets.slice();
    newTargets[indexInTarget] -= nextCoins[0];
    const withCurrent = helper(newTargets, indexInTarget, subNextCoins);
    if (withCurrent !== null) {
      return [[nextCoins[0], ...withCurrent[0]], ...withCurrent.slice(1)];
    }
    const withoutCurrent = helper(targets, indexInTarget, subNextCoins);
    return withoutCurrent;
  }
  return helper(payslips, 0);
}

// Inputs parser

function parser(answer: string): unknown[] | undefined {
  const lines = answer.split('\n');
  if (lines.length !== 2) {
    throw new Error(
      'Expected to receive two lines one for the amounts (payslips) to be paid, another one for the coins',
    );
  }
  if (lines[0].at(-1) !== '?') {
    throw new Error(`First line must end by ?, got: ${lines[0]}.`);
  }
  const payslips: number[] =
    lines[0] === '?'
      ? []
      : lines[0]
          .slice(0, -1)
          .split(',')
          .map((v) => {
            const amount = Number(v);
            if (!Number.isInteger(amount) || amount < 0 || amount > 2 ** 31 - 1) {
              throw new Error(
                `Invalid payslip value received, must be a positive integer value below 2**31-1, got: ${v}.`,
              );
            }
            return amount;
          });
  const coins: number[] =
    lines[1] === ''
      ? []
      : lines[1].split(',').map((v) => {
          const n = Number(v);
          if (!Number.isInteger(n) || n < 1 || n > 10) {
            throw new Error(`Invalid coin value received, got: ${v}.`);
          }
          return n;
        });
  return [coins, payslips];
}
