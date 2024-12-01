// @ts-check

export default function advent() {
  /**
   * @param {string} spacelessMessage
   * @param {string[]} words
   * @returns {string}
   */
  return function respace(spacelessMessage, words) {
    const match = respaceInternal(spacelessMessage, words, 0);
    if (match === undefined) {
      return spacelessMessage;
    }
    return match.join(' ');
  };

  function respaceInternal(spacelessMessage, words, startIndex) {
    if (startIndex === spacelessMessage.length) {
      return [];
    }
    for (const word of words) {
      if (spacelessMessage.startsWith(word, startIndex)) {
        const subMatch = respaceInternal(spacelessMessage, words, startIndex + word.length);
        if (subMatch !== undefined) {
          return [word, ...subMatch];
        } else {
          return undefined;
        }
      }
    }
    return undefined;
  }
}
