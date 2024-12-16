// @ts-check

export default function advent() {
  /**
   * @param {number} n
   * @returns {number}
   */
  return function santaCode(n) {
    return ((n * 2) ^ n) >> 1;
  };
}
