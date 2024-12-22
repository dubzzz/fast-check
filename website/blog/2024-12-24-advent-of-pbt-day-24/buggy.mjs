// @ts-check

export default function advent() {
  /** @typedef {1|2|3|4|5|6|7|8|9|10} Coin */

  /**
   * @param {Coin[]} availableCoins
   * @param {number[]} amountsToBePaid
   * @returns {Coin[][] | null}
   */
  return function distributeCoins(availableCoins, amountsToBePaid) {
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
        const withoutCurrent = helper(target, index + 1);
        return withoutCurrent;
      }
      return helper(amountToBePaid, 0);
    }

    const remainingCoins = [...availableCoins];
    const coinsForPayslips = [];
    const orderedAmountsToBePaid = amountsToBePaid
      .map((amount, index) => ({ amount, index }))
      .sort((a, b) => a.amount - b.amount);
    for (const { index, amount } of orderedAmountsToBePaid) {
      const dedicatedCoins = payslipContentFor(remainingCoins, amount);
      if (dedicatedCoins === null) {
        return null;
      }
      for (const coin of dedicatedCoins) {
        remainingCoins.splice(remainingCoins.indexOf(coin), 1);
      }
      coinsForPayslips[index] = dedicatedCoins;
    }
    return coinsForPayslips;
  };
}
