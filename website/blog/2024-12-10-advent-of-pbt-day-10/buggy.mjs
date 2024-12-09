// @ts-check

export default function advent() {
  /**
   * @param {string} word
   * @returns {boolean}
   */
  return function isProbablyEnchantedWordV2(word) {
    return word.split('').reverse().join('') === word;
  };
}
