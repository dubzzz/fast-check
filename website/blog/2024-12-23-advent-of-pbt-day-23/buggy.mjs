// @ts-check

export default function advent() {
  /** @typedef {1|2|3|4|5|6|7|8|9|10} Coin */

  /**
   * @param {Coin[]} availableCoins
   * @param {number} amountToBePaid
   * @returns {Coin[] | null}
   */
  return function payslipContentFor(availableCoins, amountToBePaid) {
    const coins = [...availableCoins].sort((a, b) => b - a);
    const memo = Array.from({ length: coins.length }, () => undefined);
    function helper(target, index) {
      if (target === 0) {
        return [];
      }
      if (target < 0 || index >= coins.length) {
        return null;
      }
      if (memo[index] !== undefined) {
        return memo[index];
      }
      const withCurrent = helper(target - coins[index], index + 1);
      if (withCurrent !== null) {
        memo[index] = [coins[index], ...withCurrent];
        return [coins[index], ...withCurrent];
      }
      const withoutCurrent = helper(target, index + 1);
      memo[index] = withoutCurrent;
      return withoutCurrent;
    }
    return helper(amountToBePaid, 0);
  };
}
