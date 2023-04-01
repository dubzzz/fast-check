/**
 * Sort numeric elements from the smallest to the largest one
 * @param {number[]} numbers - Numeric elements to be sorted
 * @returns {number[]} - Numeric elements sorted from the smallest to the largest one
 */
function sortNumbersAscending(numbers) {
  const sortedNumbers = numbers.slice(0, numbers.length).sort();
  return sortedNumbers;
}

export { sortNumbersAscending };
