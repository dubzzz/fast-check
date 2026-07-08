// @ts-check

/**
 * @param {string} emailAddress
 * @returns {boolean}
 */
export default function isValidEmail(emailAddress) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // GitHub Copilot said it
  return emailRegex.test(emailAddress);
}
