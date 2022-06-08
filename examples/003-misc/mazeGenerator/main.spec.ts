import { mazeGenerator, CellType, Point } from './src/mazeGenerator';
import fc from 'fast-check';
import * as _ from 'lodash';

describe('mazeGenerator', () => {
  it('should contain a single start point located at the specified point', () => {
    fc.assert(
      fc.property(seedArb, inputsArb, (seed, ins) => {
        const maze = mazeGenerator(seed, ins.dim, ins.startPt, ins.endPt);
        expect(maze[ins.startPt.y][ins.startPt.x]).toBe(CellType.Start);
        expect(_.flatten(maze).filter((c) => c === CellType.Start)).toHaveLength(1);
      })
    );
  });

  it('should contain a single end point located at the specified point', () => {
    fc.assert(
      fc.property(seedArb, inputsArb, (seed, ins) => {
        const maze = mazeGenerator(seed, ins.dim, ins.startPt, ins.endPt);
        expect(maze[ins.endPt.y][ins.endPt.x]).toBe(CellType.End);
        expect(_.flatten(maze).filter((c) => c === CellType.End)).toHaveLength(1);
      })
    );
  });

  it('should have at least one path from start to end', () => {
    fc.assert(
      fc.property(seedArb, inputsArb, (seed, ins) => {
        const maze = mazeGenerator(seed, ins.dim, ins.startPt, ins.endPt);
        return hasPathFromStartToEnd(maze, ins.startPt);
      })
    );
  });

  it('should not have any path loops', () => {
    fc.assert(
      fc.property(seedArb, inputsArb, (seed, ins) => {
        const maze = mazeGenerator(seed, ins.dim, ins.startPt, ins.endPt);
        const alreadyVisited = new Set<string>();
        const ptsToVisit = [{ pt: ins.startPt, src: ins.startPt }];
        while (ptsToVisit.length > 0) {
          const [{ pt, src }] = ptsToVisit.splice(ptsToVisit.length - 1);
          const ptString = `x:${pt.x},y:${pt.y}`;
          if (alreadyVisited.has(ptString)) {
            // We already got to this cell from another path
            // There is an unexpected loop in the generated maze
            return false;
          }
          alreadyVisited.add(ptString);
          ptsToVisit.push(
            ...neighboorsFor(pt)
              // We do not go back on our tracks
              .filter((nPt) => nPt.x !== src.x || nPt.y !== src.y)
              .filter((nPt) => {
                const cell = cellTypeAt(maze, nPt);
                return cell !== null && cell !== CellType.Wall;
              })
              // Keep the src aka source point in order not to go back on our tracks
              .map((nPt) => ({ pt: nPt, src: pt }))
          );
        }
        return true;
      })
    );
  });

  it('should have exactly one path leaving the end', () => {
    fc.assert(
      fc.property(seedArb, inputsArb, (seed, ins) => {
        const maze = mazeGenerator(seed, ins.dim, ins.startPt, ins.endPt);
        const numPathsLeavingEnd = neighboorsFor(ins.endPt).reduce((count, pt) => {
          const cell = cellTypeAt(maze, pt);
          if (cell === null || cell === CellType.Wall) return count;
          else return count + 1;
        }, 0);
        expect(numPathsLeavingEnd).toBe(1);
      })
    );
  });

  it('should have only non-isolated path, start, end', () => {
    fc.assert(
      fc.property(seedArb, inputsArb, (seed, ins) => {
        const maze: (CellType | 'Visited')[][] = mazeGenerator(seed, ins.dim, ins.startPt, ins.endPt);

        const ptsToVisit = [ins.startPt, ins.endPt];
        while (ptsToVisit.length > 0) {
          const [pt] = ptsToVisit.splice(ptsToVisit.length - 1);
          maze[pt.y][pt.x] = 'Visited';

          ptsToVisit.push(
            ...neighboorsFor(pt).filter((nPt) => {
              const cell = cellTypeAt(maze, nPt);
              return cell !== null && cell !== CellType.Wall && cell !== 'Visited';
            })
          );
        }
        // All cells are either Walls or marked as visited
        expect(_.flatten(maze).filter((c) => c !== CellType.Wall && c !== 'Visited')).toHaveLength(0);
      })
    );
  });
});

// Helpers

const seedArb = fc.integer().noBias().noShrink();

const dimensionArb = fc.record({
  width: fc.integer({ min: 2, max: 20 }),
  height: fc.integer({ min: 2, max: 20 }),
});

const inputsArb = dimensionArb
  .chain((dim) => {
    return fc.record({
      dim: fc.constant(dim),
      startPt: fc.record({ x: fc.nat(dim.width - 1), y: fc.nat(dim.height - 1) }),
      endPt: fc.record({ x: fc.nat(dim.width - 1), y: fc.nat(dim.height - 1) }),
    });
  })
  .filter((ins) => ins.startPt.x !== ins.endPt.x || ins.startPt.y !== ins.endPt.y);

const neighboorsFor = (pt: Point): Point[] => {
  return [
    { x: pt.x - 1, y: pt.y },
    { x: pt.x + 1, y: pt.y },
    { x: pt.x, y: pt.y - 1 },
    { x: pt.x, y: pt.y + 1 },
  ];
};
const nonWallNeighboorsFor = (maze: CellType[][], pt: Point): Point[] => {
  return neighboorsFor(pt).filter((nPt) => {
    const cell = cellTypeAt(maze, nPt);
    return cell !== null && cell !== CellType.Wall;
  });
};
const cellTypeAt = <TCellType>(maze: TCellType[][], pt: Point): TCellType | null => {
  return pt.x < 0 || pt.x >= maze[0].length || pt.y < 0 || pt.y >= maze.length ? null : maze[pt.y][pt.x];
};
const hasPathFromStartToEnd = (maze: CellType[][], startPt: Point): boolean => {
  const alreadySeen = new Set<string>();
  const ptsToVisit: Point[] = [startPt];
  while (ptsToVisit.length > 0) {
    const [pt] = ptsToVisit.splice(ptsToVisit.length - 1);
    if (maze[pt.y][pt.x] === CellType.End) return true;

    const ptString = `x:${pt.x},y:${pt.y}`;
    if (alreadySeen.has(ptString)) continue;
    alreadySeen.add(ptString);

    ptsToVisit.push(...nonWallNeighboorsFor(maze, pt));
  }
  return false;
};
