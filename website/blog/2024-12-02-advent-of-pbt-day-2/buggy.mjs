// @ts-check

export default function advent() {
  /** @typedef {{id:string;}} Letter */

  /**
   * @param {Letter[]} letters
   * @returns {Letter[]}
   */
  return function dropLettersFromDuplicatedSenders(letters) {
    const alreadySeenIds = {};
    return letters.filter((letter) => {
      if (alreadySeenIds[letter.id]) {
        return false;
      }
      alreadySeenIds[letter.id] = true;
      return true;
    });
  };
}
