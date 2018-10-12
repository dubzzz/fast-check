const createArray = function(gen, settings) {
  /**
   * Produces a array filled by calling gen
   * settings can provide additonal parameters:
   * - minimum_size: number
   * - maximum_size: number
   */
  const minSize = settings != null && settings.minimum_size != null ? settings.minimum_size : 0;
  const maxSize = settings != null && settings.minimum_size != null ? settings.maximum_size : minSize + 10;
  return [...Array(minSize + Math.floor((maxSize - minSize + 1) * Math.random()))].map(gen);
};

module.exports = { createArray };
