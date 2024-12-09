// @ts-check

export default function advent() {
  // Implementation copied from https://github.com/trekhleb/javascript-algorithms/pull/110/
  const PRIME = 97;

  /**
   * @param {string} letterContent
   * @param {string} word
   * @return {boolean}
   */
  return function isWordIncludedInLetter(letterContent, word) {
    const wordHash = hashWord(word);
    let prevSegment = null;
    let currentSegmentHash = null;
    for (let charIndex = 0; charIndex <= letterContent.length - word.length; charIndex += 1) {
      const currentSegment = letterContent.substring(charIndex, charIndex + word.length);
      if (currentSegmentHash === null) {
        currentSegmentHash = hashWord(currentSegment);
      } else {
        currentSegmentHash = reHashWord(currentSegmentHash, prevSegment, currentSegment);
      }
      prevSegment = currentSegment;
      if (wordHash === currentSegmentHash) {
        let numberOfMatches = 0;
        for (let deepCharIndex = 0; deepCharIndex < word.length; deepCharIndex += 1) {
          if (word[deepCharIndex] === letterContent[charIndex + deepCharIndex]) {
            numberOfMatches += 1;
          }
        }
        if (numberOfMatches === word.length) {
          return true;
        }
      }
    }
    return false;
  };

  /**
   * @param {string} word
   * @return {number}
   */
  function hashWord(word) {
    let hash = 0;
    for (let charIndex = 0; charIndex < word.length; charIndex += 1) {
      hash += word[charIndex].charCodeAt(0) * PRIME ** charIndex;
    }
    return hash;
  }

  /**
   * @param {number} prevHash
   * @param {string} prevWord
   * @param {string} newWord
   * @return {number}
   */
  function reHashWord(prevHash, prevWord, newWord) {
    const newWordLastIndex = newWord.length - 1;
    let newHash = prevHash - prevWord[0].charCodeAt(0);
    newHash /= PRIME;
    newHash += newWord[newWordLastIndex].charCodeAt(0) * PRIME ** newWordLastIndex;
    return newHash;
  }
}
