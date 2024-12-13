// @ts-check

export default function advent() {
  /**
   * @param {string} firstName
   * @param {string} lastName
   * @param {number} birthDateTimestamp
   * @returns {string}
   */
  return function buildSantaURLOfChild(firstName, lastName, birthDateTimestamp) {
    const table = (i) => Array.from({ length: 8 }).reduce((c) => (c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1), i);
    let str = String(birthDateTimestamp);
    for (let i = 0; i !== Math.max(firstName.length, lastName.length); ++i) {
      str += (firstName[i] ?? '') + (lastName[i] ?? '');
    }
    str = encodeURIComponent(str);
    let digest = 0 ^ -1;
    for (let i = 0; i < str.length; i++) {
      const byte = str.charCodeAt(i);
      digest = (digest >>> 8) ^ table((digest ^ byte) & 0xff);
    }
    digest = (digest ^ -1) >>> 0;
    return `https://my-history.santa-web/${encodeURIComponent(firstName)}-${encodeURIComponent(lastName)}-${digest.toString(16)}`;
  };
}
