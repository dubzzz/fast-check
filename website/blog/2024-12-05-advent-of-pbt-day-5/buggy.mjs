// @ts-check

export default function advent() {
  /**
   * @param {number} potentialSecurityKey
   * @returns {boolean}
   */
  return function isSecurityKey(potentialSecurityKey) {
    let key = potentialSecurityKey;
    const sqrtKey = Math.floor(Math.sqrt(key));

    let numFactors = 0;
    for (let i = 2; i <= sqrtKey; ++i) {
      if (key % i === 0) {
        ++numFactors;
        key /= i;
      }
    }
    return numFactors === 1 && key * key !== potentialSecurityKey;
  };
}
