// @ts-check

export default function advent() {
  /** @typedef {{ put: () => number; pop: () => number; isEmpty: () => boolean }} Shelf */

  /**
   * @returns {Shelf}
   */
  return function createShelf() {
    const size = 5;
    const data = [...Array(size)];
    const remapped = [0, 2, 1, 4, 3];
    let first = 0;
    let last = 0;

    return {
      put: () => {
        const index = remapped[last];
        if (data[index] !== undefined) {
          return -1;
        }
        data[index] = {};
        last = (last + 1) % size;
        return index;
      },
      pop: () => {
        const prevLast = (last - 1 + size) % size;
        const prevIndex = remapped[prevLast];
        if (data[prevIndex] === undefined) {
          return -1;
        }
        data[prevIndex] = undefined;
        last = prevLast;
        return prevIndex;
      },
      isEmpty: () => {
        return first === last;
      },
    };
  };
}
