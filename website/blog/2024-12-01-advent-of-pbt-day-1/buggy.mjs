// @ts-check

/** @typedef {{name: string; age: number;}} Letter */

/**
 * @param {Letter[]} letters
 * @returns {Letter[]}
 */
export default function sortLetters(letters) {
  const clonedLetters = [...letters];
  return clonedLetters.sort(
    (la, lb) => la.age - lb.age || (la.name.codePointAt(0) ?? 0) - (lb.name.codePointAt(0) ?? 0),
  );
}
