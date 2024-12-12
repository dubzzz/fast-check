// @ts-check

export default function advent() {
  /** @typedef {{ from: string; to: string; distance: number }} Track */

  /**
   * @param {string} departure
   * @param {string} destination
   * @param {Track[]} tracks
   * @returns {Track[]|undefined}
   */
  return function planFastTravel(departure, destination, tracks) {
    const distanceToNode = Object.fromEntries(
      [departure, destination, ...tracks.map((t) => t.from), ...tracks.map((t) => t.to)].map((node) => [
        node,
        { distance: Number.POSITIVE_INFINITY, edges: [] },
      ]),
    );
    if (distanceToNode[departure]) {
      distanceToNode[departure] = { distance: 0, edges: [] };
    }
    while (true) {
      const nextNode = findRemainingNodeWithMinimalDistance(distanceToNode);
      if (nextNode === undefined) {
        return undefined; // no path found
      }
      const data = distanceToNode[nextNode];
      if (nextNode === destination) {
        return data.edges;
      }
      delete distanceToNode[nextNode];
      for (const e of tracks) {
        if (e.from === nextNode && distanceToNode[e.to]) {
          distanceToNode[e.to] = { distance: data.distance + e.distance, edges: [...data.edges, e] };
        }
      }
    }
  };

  function findRemainingNodeWithMinimalDistance(distanceToNode) {
    let minNode = undefined;
    let minDistance = Number.POSITIVE_INFINITY;
    for (const [node, { distance }] of Object.entries(distanceToNode)) {
      if (distance < minDistance) {
        minNode = node;
        minDistance = distance;
      }
    }
    return minNode;
  }
}
