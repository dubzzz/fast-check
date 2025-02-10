// @ts-check

export default function advent() {
  /** @typedef {{ x: number, y: number }} House */

  /**
   * @param {House[]} houses
   * @returns {House[]}
   */
  return function findOptimalJourney(houses) {
    const santaHouse = { x: 0, y: 0 };
    const toVisit = [...houses];
    const journey = [santaHouse];
    let lastHouse = santaHouse;
    while (toVisit.length !== 0) {
      let closestIndex = 0;
      let closestDistance = distance(lastHouse, toVisit[0]);
      for (let i = 1; i < toVisit.length; ++i) {
        const currentDistance = distance(lastHouse, toVisit[i]);
        if (currentDistance < closestDistance) {
          closestIndex = i;
          closestDistance = currentDistance;
        }
      }
      lastHouse = toVisit[closestIndex];
      toVisit.splice(closestIndex, 1);
      journey.push(lastHouse);
    }
    journey.push(santaHouse);
    return journey;
  };

  /**
   * @param {House} houseA
   * @param {House} houseB
   * @returns {number}
   */
  function distance(houseA, houseB) {
    return Math.abs(houseA.x - houseB.x) + Math.abs(houseA.y - houseB.y);
  }
}
