// @ts-check

export default function advent() {
  /**
   * @param {number[]} weights
   * @returns {number[][]}
   */
  return function findOptimalPacking(weights) {
    const sleights = [];
    const sortedWeights = [...weights].sort((a, b) => b - a);
    while (sortedWeights.length !== 0) {
      let sleighWeight = 0;
      const sleigh = [];
      for (let i = 0; i < sortedWeights.length; ++i) {
        if (sleighWeight + sortedWeights[i] <= 10) {
          sleighWeight += sortedWeights[i];
          sleigh.push(sortedWeights[i]);
          sortedWeights.splice(i, 1);
          i -= 1;
        }
      }
      sleights.push(sleigh);
    }
    return sleights;
  };
}
