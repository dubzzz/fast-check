export const isStrictlySmallerArray = (arr1: number[], arr2: number[]): boolean => {
  if (arr1.length > arr2.length) return false;
  if (arr1.length === arr2.length) {
    return arr1.every((v, idx) => arr1[idx] <= arr2[idx]) && arr1.find((v, idx) => arr1[idx] < arr2[idx]) != null;
  }
  for (let idx1 = 0, idx2 = 0; idx1 < arr1.length && idx2 < arr2.length; ++idx1, ++idx2) {
    while (idx2 < arr2.length && arr1[idx1] > arr2[idx2]) ++idx2;
    if (idx2 === arr2.length) return false;
  }
  return true;
};
