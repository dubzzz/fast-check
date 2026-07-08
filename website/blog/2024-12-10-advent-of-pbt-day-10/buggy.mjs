// @ts-check

/**
 * @param {string} word
 * @returns {boolean}
 */
export default function isProbablyEnchantedWordV2(word) {
  return word.split('').reverse().join('') === word;
}
