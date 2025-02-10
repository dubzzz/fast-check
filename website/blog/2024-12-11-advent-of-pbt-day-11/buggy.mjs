// @ts-check

export default function advent() {
  /**
   * For the Christmas market, Santa is looking for a place.
   *
   * For each market of the world, he has to check if it can land with
   * his 8 reindeers and his sleigh. This algorithm check whether there
   * is an area of consecutive true that can contain requestedArea and return
   * its upper-left corner.
   *
   * @param {boolean[][]} map - Indexed by map[y][x]
   * @param {{ width: number; height: number }} requestedArea
   *
   * map.length corresponds to the height of the map
   * map[0].length corresponds to the width of the map
   *
   * @returns {{ x: number; y: number } | undefined}
   * - the upper-left corner of the area,
   *   whenever there is one place in the map having with
   *   rectangular width x height surface with only true
   * - undefined if no such area exists
   */
  return function findPlaceForSanta(map, requestedArea) {
    for (let y = 0; y !== map.length; ++y) {
      for (let x = 0; x !== map[0].length; ++x) {
        const location = { x, y };
        const placeIsValid = isValidPlace(map, location, requestedArea);
        if (placeIsValid) {
          return location;
        }
      }
    }
    return undefined;
  };

  function isValidPlace(map, start, requestedArea) {
    for (let dy = 0; dy !== requestedArea.height; ++dy) {
      if (!map[start.y + dy]?.[start.x]) {
        return false;
      }
      if (!map[start.y + dy]?.[start.x + requestedArea.width - 1]) {
        return false;
      }
    }
    for (let dx = 0; dx !== requestedArea.width; ++dx) {
      if (!map[start.y]?.[start.x + dx]) {
        return false;
      }
      if (!map[start.y + requestedArea.height - 1]?.[start.x + dx]) {
        return false;
      }
    }
    return true;
  }
}
