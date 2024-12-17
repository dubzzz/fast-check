// @ts-check

export default function advent() {
  /**
   * @param {string} emailAddress
   * @returns {boolean}
   */
  return function isValidEmail(emailAddress) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // GitHub Copilot said it
    return emailRegex.test(emailAddress);
  };
}
