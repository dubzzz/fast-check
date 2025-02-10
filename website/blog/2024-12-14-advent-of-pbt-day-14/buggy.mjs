// @ts-check

export default function advent() {
  /** @typedef {{compress:(text:string)=>string, decompress:(compressed:string)=>string}} Compressor */

  /**
   * @returns {Compressor}
   */
  return function buildCompressor() {
    /**
     * @param {string} text
     * @returns {string}
     */
    function compress(text) {
      const chars = [...text];
      if (chars.length === 0) {
        return '';
      }
      let compressed = '';
      let countOfPrevious = 1;
      let previous = chars[0];
      for (let i = 1; i < chars.length; ++i) {
        if (chars[i] === previous) {
          countOfPrevious += 1;
        } else {
          compressed += `${countOfPrevious}${previous}`;
          previous = chars[i];
          countOfPrevious = 1;
        }
      }
      compressed += `${countOfPrevious}${previous}`;
      return compressed;
    }
    /**
     * @param {string} compressed
     * @returns {string}
     */
    function decompress(compressed) {
      const regex = /(\d+)(.)/gmu;
      let m = null;
      let text = '';
      while ((m = regex.exec(compressed))) {
        const charsInChunk = [...m[0]];
        const count = Number(charsInChunk.slice(0, -1));
        const char = charsInChunk.at(-1);
        text += char.repeat(count);
      }
      return text;
    }
    return { compress, decompress };
  };
}
