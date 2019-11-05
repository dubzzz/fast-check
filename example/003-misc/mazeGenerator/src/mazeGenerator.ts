// Implementation inspired from https://github.com/dubzzz/various-algorithms/blob/master/algorithms/graph/maze-generator/implem.cpp
import prand from 'pure-rand';
import { Random } from 'fast-check';

export type Dimension = {
  width: number;
  height: number;
};
export type Point = {
  x: number;
  y: number;
};
export enum CellType {
  Wall = 'Wall',
  Path = 'Path',
  Start = 'Start',
  End = 'End'
}

const mazeGeneratorInternal = (mrng: Random, dim: Dimension, startPt: Point, endPt: Point): CellType[][] => {
  // Initialize grid
  const maze: CellType[][] = [...Array(dim.height)].map(_ => [...Array(dim.width)].fill(CellType.Wall));
  maze[startPt.y][startPt.x] = CellType.Start;
  maze[endPt.y][endPt.x] = CellType.End;

  // Utils
  const ptsToScan: Point[] = [];
  const shuffleInPlace = <T>(data: T[]): T[] => {
    for (let i = data.length - 1; i >= 1; --i) {
      const j = mrng.nextInt(0, i);
      const buffer = data[i];
      data[i] = data[j];
      data[j] = buffer;
    }
    return data;
  };
  const cellTypeAt = (pt: Point): CellType | null => {
    return pt.x < 0 || pt.x >= dim.width || pt.y < 0 || pt.y >= dim.height ? null : maze[pt.y][pt.x];
  };
  const addInPtsToScanIfWall = (pt: Point) => {
    if (cellTypeAt(pt) === CellType.Wall) ptsToScan.push(pt);
  };
  const neighboorsFor = (pt: Point) => {
    return [{ x: pt.x - 1, y: pt.y }, { x: pt.x + 1, y: pt.y }, { x: pt.x, y: pt.y - 1 }, { x: pt.x, y: pt.y + 1 }];
  };
  const addNeighboorsInPtsToScan = (pt: Point) => {
    const neighboors = neighboorsFor(pt);
    shuffleInPlace(neighboors).forEach(nPt => addInPtsToScanIfWall(nPt));
  };
  const isNextToEnd = (pt: Point): boolean => {
    return neighboorsFor(pt).find(nPt => cellTypeAt(nPt) === CellType.End) !== undefined;
  };

  // Random journey in the grid
  addNeighboorsInPtsToScan(startPt);
  let alreadyReachedEnd = isNextToEnd(startPt);
  while (ptsToScan.length > 0) {
    const [pt] = ptsToScan.splice(ptsToScan.length - 1);
    if (cellTypeAt(pt) !== CellType.Wall) continue;

    const numRoads = neighboorsFor(pt).reduce((count, nPt) => {
      const cell = cellTypeAt(nPt);
      if (cell !== CellType.Wall && cell !== null) return count + 1;
      else return count;
    }, 0);

    let invalidChoice = numRoads > 2;
    if (numRoads === 2) {
      if (alreadyReachedEnd) invalidChoice = true;
      else {
        alreadyReachedEnd = isNextToEnd(pt);
        invalidChoice = !alreadyReachedEnd;
      }
    }
    if (invalidChoice) {
      // we reach the end of ongoing path -- shuffling of previously possible points
      shuffleInPlace(ptsToScan);
      continue;
    }
    maze[pt.y][pt.x] = CellType.Path;
    addNeighboorsInPtsToScan(pt);
  }

  return maze;
};

const removedEnoughWalls = (maze: CellType[][], dim: Dimension): boolean => {
  const { height, width } = dim;
  const cellTypeAt = (pt: Point): CellType | null => {
    return pt.x < 0 || pt.x >= dim.width || pt.y < 0 || pt.y >= dim.height ? null : maze[pt.y][pt.x];
  };
  for (let j = 0; j !== height; ++j) {
    for (let i = 0; i !== width; ++i) {
      if (maze[j][i] !== CellType.Wall) continue;
      const numWallsInBlock = [
        { x: i - 1, y: j - 1 },
        { x: i - 1, y: j },
        { x: i - 1, y: j + 1 },
        { x: i, y: j - 1 },
        { x: i, y: j + 1 },
        { x: i + 1, y: j - 1 },
        { x: i + 1, y: j },
        { x: i + 1, y: j + 1 }
      ].reduce((count, pt) => {
        if (cellTypeAt(pt) === CellType.Wall) return count + 1;
        else return count;
      }, 0);
      if (numWallsInBlock === 8) {
        return false; // Unreacheable path
      }
    }
  }
  return true;
};

export const mazeGenerator = (seed: number, dim: Dimension, startPt: Point, endPt: Point): CellType[][] => {
  const mrng = new Random(prand.xorshift128plus(seed));

  while (true) {
    const maze = mazeGeneratorInternal(mrng, dim, startPt, endPt);
    if (removedEnoughWalls(maze, dim) || true) return maze;
  }
};
