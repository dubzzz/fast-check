import { Stream, stream } from '../../stream/Stream';
import Arbitrary from '../arbitrary/definition/Arbitrary';
import Shrinkable from '../arbitrary/definition/Shrinkable';
import IProperty from '../property/IProperty';
import toss from './Tosser';
import { pathWalk } from './utils/PathWalker';
import { Parameters, QualifiedParameters } from './utils/utils';

function streamSample<Ts>(
  generator: IProperty<Ts> | Arbitrary<Ts>,
  params?: Parameters | number
): IterableIterator<Ts> {
  const qParams: QualifiedParameters = QualifiedParameters.readOrNumRuns(params);
  const tossedValues: Stream<() => Shrinkable<Ts>> = stream(toss(generator, qParams.seed));
  if (qParams.path.length === 0) {
    return tossedValues.take(qParams.num_runs).map(s => s().value);
  }
  return stream(pathWalk(qParams.path, tossedValues.map(s => s())))
    .take(qParams.num_runs)
    .map(s => s.value);
}

function sample<Ts>(generator: IProperty<Ts> | Arbitrary<Ts>, params?: Parameters | number): Ts[] {
  return [...streamSample(generator, params)];
}

interface Dictionary<T> {
  [key: string]: T;
}

function Object_entries<T>(obj: Dictionary<T>): [string, T][] {
  const entries: [string, T][] = [];
  for (const k of Object.keys(obj)) {
    entries.push([k, obj[k]]);
  }
  return entries;
}
function String_padStart(s: string, length: number, padString: string): string {
  let pad = padString;
  if (s.length > length) {
    return String(s);
  }
  const missing = length - s.length;
  if (missing > pad.length) {
    pad += pad.repeat(missing / pad.length);
  }
  return pad.slice(0, missing) + s;
}
function String_padEnd(s: string, length: number, padString: string): string {
  let pad = padString;
  if (s.length > length) {
    return String(s);
  }
  const missing = length - s.length;
  if (missing > pad.length) {
    pad += pad.repeat(missing / pad.length);
  }
  return String(s) + pad.slice(0, missing);
}

function statistics<Ts>(
  generator: IProperty<Ts> | Arbitrary<Ts>,
  classify: (v: Ts) => string | string[],
  params?: Parameters | number
): void {
  const qParams = QualifiedParameters.readOrNumRuns(params);
  const recorded: Dictionary<number> = {};
  for (const g of streamSample(generator, params)) {
    const out = classify(g);
    const categories: string[] = Array.isArray(out) ? out : [out];
    for (const c of categories) {
      recorded[c] = (recorded[c] || 0) + 1;
    }
  }
  const data = Object_entries(recorded)
    .sort((a, b) => b[1] - a[1])
    .map(i => [i[0], `${(i[1] * 100.0 / qParams.num_runs).toFixed(2)}%`]);
  const longestName = data.map(i => i[0].length).reduce((p, c) => Math.max(p, c), 0);
  const longestPercent = data.map(i => i[1].length).reduce((p, c) => Math.max(p, c), 0);
  for (const item of data) {
    qParams.logger(`${String_padEnd(item[0], longestName, '.')}..${String_padStart(item[1], longestPercent, '.')}`);
  }
}

export { sample, statistics };
