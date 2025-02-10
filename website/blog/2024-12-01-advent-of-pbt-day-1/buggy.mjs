// @ts-check

export default function advent() {
  /** @typedef {{name: string; age: number;}} Letter */

  /**
   * @param {Letter[]} letters
   * @returns {Letter[]}
   */
  return function sortLetters(letters) {
    const clonedLetters = [...letters];
    return clonedLetters.sort((la, lb) => la.age - lb.age || la.name.codePointAt(0) - lb.name.codePointAt(0));
  };
}
