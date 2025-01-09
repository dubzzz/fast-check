// @ts-check

export default function advent() {
  /**
   * @param {string} word
   * @returns {boolean}
   */
  return function isProbablyEnchantedWord(word) {
    const lastIndex = word.length - 1;
    const lastScannedIndex = Math.floor(lastIndex / 2);
    for (let i = 0; i < lastScannedIndex; ++i) {
      if (word[i] !== word[lastIndex - i]) {
        return false;
      }
    }
    return true;
  };
}
