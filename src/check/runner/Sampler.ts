import { Stream, stream } from '../../stream/Stream';
import Arbitrary from '../arbitrary/definition/Arbitrary';
import Shrinkable from '../arbitrary/definition/Shrinkable';
import IProperty from '../property/IProperty';
import toss from './Tosser';
import { pathWalk } from './utils/PathWalker';
import { Parameters, QualifiedParameters } from './utils/utils';

/** @hidden */
function streamSample<Ts>(
  generator: IProperty<Ts> | Arbitrary<Ts>,
  params?: Parameters | number
): IterableIterator<Ts> {
  const qParams: QualifiedParameters = QualifiedParameters.readOrNumRuns(params);
  const tossedValues: Stream<() => Shrinkable<Ts>> = stream(toss(generator, qParams.seed));
  if (qParams.path.length === 0) {
    return tossedValues.take(qParams.numRuns).map(s => s().value);
  }
  return stream(pathWalk(qParams.path, tossedValues.map(s => s())))
    .take(qParams.numRuns)
    .map(s => s.value);
}

function sample<Ts>(generator: IProperty<Ts> | Arbitrary<Ts>, params?: Parameters | number): Ts[] {
  return [...streamSample(generator, params)];
}

function statistics<Ts>(
  generator: IProperty<Ts> | Arbitrary<Ts>,
  classify: (v: Ts) => string | string[],
  params?: Parameters | number
): void {
  const qParams = QualifiedParameters.readOrNumRuns(params);
  const recorded: { [key: string]: number } = {};
  for (const g of streamSample(generator, params)) {
    const out = classify(g);
    const categories: string[] = Array.isArray(out) ? out : [out];
    for (const c of categories) {
      recorded[c] = (recorded[c] || 0) + 1;
    }
  }
  const data = Object.entries(recorded)
    .sort((a, b) => b[1] - a[1])
    .map(i => [i[0], `${(i[1] * 100.0 / qParams.numRuns).toFixed(2)}%`]);
  const longestName = data.map(i => i[0].length).reduce((p, c) => Math.max(p, c), 0);
  const longestPercent = data.map(i => i[1].length).reduce((p, c) => Math.max(p, c), 0);
  for (const item of data) {
    qParams.logger(`${item[0].padEnd(longestName, '.')}..${item[1].padStart(longestPercent, '.')}`);
  }
}

export { sample, statistics };
