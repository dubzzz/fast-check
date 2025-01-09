// @ts-check

export default function advent() {
  /** @typedef {{x: number; y: number;}} Position */

  const SizeX = 10000;
  const SizeY = 1000;

  /**
   * @param {Position} initialPosition
   * @param {Position} targetPosition
   * @returns {number} Number of moves to find the targetPosition
   */
  return function fastPostOfficeFinderEmulator(initialPosition, targetPosition) {
    let xMin = 0;
    let xMax = SizeX;
    let yMin = 0;
    let yMax = SizeY;
    let x = initialPosition.x;
    let y = initialPosition.y;
    let numMoves = 0;
    while (x !== targetPosition.x || y !== targetPosition.y) {
      if (xMin >= xMax || yMin >= yMax) {
        return Number.POSITIVE_INFINITY; // error
      }
      const prevX = x;
      const prevY = y;
      if (targetPosition.y < y) {
        yMax = y - 1;
        y = Math.floor((yMax + yMin) / 2);
      } else if (targetPosition.y > y) {
        yMin = y + 1;
        y = Math.floor((yMax + yMin) / 2);
      }
      if (targetPosition.x < x) {
        xMax = x - 1;
        x = Math.floor((xMax + xMin) / 2);
      } else if (targetPosition.x > x) {
        xMin = x + 1;
        x = Math.floor((xMax + xMin) / 2);
      }
      if (prevX !== x || prevY !== y) {
        ++numMoves;
        if (numMoves > 1000) {
          return Number.POSITIVE_INFINITY; // probably an error somewhere
        }
      }
    }
    return numMoves;
  };
}
