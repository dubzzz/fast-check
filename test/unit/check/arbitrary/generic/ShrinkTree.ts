import * as fc from '../../../../../lib/fast-check';
import { NextArbitrary } from '../../../../../src/check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../../../../src/check/arbitrary/definition/NextValue';
import { Shrinkable } from '../../../../../src/check/arbitrary/definition/Shrinkable';

export type ShrinkTree<T> = [T, ShrinkTree<T>[]];

export function buildShrinkTree<T>(s: Shrinkable<T>): ShrinkTree<T> {
  return [s.value_, [...s.shrink().map((ss) => buildShrinkTree(ss))]];
}

export function buildNextShrinkTree<T>(arb: NextArbitrary<T>, v: NextValue<T>): ShrinkTree<T> {
  return [v.value_, [...arb.shrink(v.value_, v.context).map((nv) => buildNextShrinkTree(arb, nv))]];
}

export function renderTree<T>(tree: ShrinkTree<T>): string[] {
  const [current, subTrees] = tree;
  const lines = [fc.stringify(current)];
  for (let index = 0; index !== subTrees.length; ++index) {
    const subTree = subTrees[index];
    const isLastSubTree = index === subTrees.length - 1;
    const firstPrefix = isLastSubTree ? '└> ' : '├> ';
    const otherPrefix = isLastSubTree ? '   ' : '|  ';
    const subRender = renderTree(subTree);
    for (let renderedIndex = 0; renderedIndex !== subRender.length; ++renderedIndex) {
      if (renderedIndex === 0) {
        lines.push(`${firstPrefix}${subRender[renderedIndex]}`);
      } else {
        lines.push(`${otherPrefix}${subRender[renderedIndex]}`);
      }
    }
  }
  return lines;
}
