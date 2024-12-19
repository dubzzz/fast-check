// @ts-check

export default function advent() {
  /**
   * This solution has been provided to you by GPT-4o
   * @param {number[]} partlyShuffled
   * @returns {number}
   */
  return function findStartIndex(partlyShuffled) {
    let left = 0;
    let right = partlyShuffled.length - 1;

    // Handle the case where the array is not rotated
    if (partlyShuffled[left] <= partlyShuffled[right]) return 0;

    while (left <= right) {
      let mid = Math.floor((left + right) / 2);

      // Check if mid is the rotation point
      if (partlyShuffled[mid] > partlyShuffled[mid + 1]) {
        return mid + 1;
      }
      if (partlyShuffled[mid] < partlyShuffled[mid - 1]) {
        return mid;
      }

      // Decide which half to search next
      if (partlyShuffled[mid] >= partlyShuffled[left]) {
        // Rotation point is in the right half
        left = mid + 1;
      } else {
        // Rotation point is in the left half
        right = mid - 1;
      }
    }

    return -1; // This should never happen in a valid rotated array
  };
}
