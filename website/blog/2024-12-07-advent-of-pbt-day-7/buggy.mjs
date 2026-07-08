// @ts-check

/**
 * @param {string} sourceLocation
 * @returns {string}
 */
export default function simplifyLocation(sourceLocation) {
  const components = sourceLocation.replace(/\/$/, '').split('/');

  let numMovesHigher = 0;
  const stack = [];
  for (const component of components) {
    if (component === '.' || component === '') {
      if (numMovesHigher > stack.length) {
        return sourceLocation;
      }
      for (let i = 0; i !== numMovesHigher; ++i) {
        stack.pop();
      }
    } else if (component === '..') {
      ++numMovesHigher;
    } else {
      if (numMovesHigher > stack.length) {
        return sourceLocation;
      }
      for (let i = 0; i !== numMovesHigher; ++i) {
        stack.pop();
      }
      numMovesHigher = 0;
      stack.push(component);
    }
  }
  if (numMovesHigher >= stack.length) {
    return sourceLocation;
  }
  for (let i = 0; i !== numMovesHigher; ++i) {
    stack.pop();
  }
  return '/' + stack.join('/');
}
