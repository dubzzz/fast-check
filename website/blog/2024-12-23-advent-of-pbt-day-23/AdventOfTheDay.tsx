import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 23,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: () => true,
  buggyAdventSurcharged: (...args: Parameters<ReturnType<typeof adventBuggy>>) => {
    const expected = payslipContentFor(...args);
    const out = adventBuggy()(...args);
    const [availableCoins, amountToBePaid] = args;
    if (out === null) {
      return expected === null ? true : 'not supposed to find anything';
    }
    if (out.reduce((acc, v) => acc + v, 0) !== amountToBePaid) {
      return 'bad amount';
    }
    const coins = [...availableCoins];
    for (const coinValue of out) {
      const index = coins.indexOf(coinValue);
      if (index === -1) {
        return 'no such coin';
      }
      coins.splice(index, 1);
    }
    return true;
  },
  parser,
  placeholderForm: '7?\n1,1,2,5,10',
  functionName: 'payslipContentFor',
  signature: 'payslipContentFor(availableCoins: Coin[], amountToBePaid: number): Coin[] | null;',
  signatureExtras: ['type Coin = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;'],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

function payslipContentFor(availableCoins, amountToBePaid) {
  const coins = [...availableCoins].sort((a, b) => b - a);
  function helper(target, index) {
    if (target === 0) {
      return [];
    }
    if (target < 0 || index >= coins.length) {
      return null;
    }
    const withCurrent = helper(target - coins[index], index + 1);
    if (withCurrent !== null) {
      return [coins[index], ...withCurrent];
    }
    return helper(target, index + 1);
  }
  return helper(amountToBePaid, 0);
}

// Inputs parser

function parser(answer: string): unknown[] | undefined {
  const lines = answer.split('\n');
  if (lines.length !== 2) {
    throw new Error('Expected to receive two lines one for the amount to be paid, another one for the coins');
  }
  if (lines[0].at(-1) !== '?') {
    throw new Error(`First line must end by ?, got: ${lines[0]}.`);
  }
  const amount = Number(lines[0].slice(0, -1));
  if (!Number.isInteger(amount) || amount < 0 || amount > 2 ** 31 - 1) {
    throw new Error(`Invalid amount received, must be a positive integer value below 2**31-1, got: ${lines[0]}.`);
  }
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
  return [coins, amount];
}
