import Arbitrary from '../arbitrary/definition/Arbitrary';
import { stream } from '../../stream/Stream';
import IProperty from '../property/IProperty';
import { Parameters, QualifiedParameters } from './utils/utils';
import toss from './Tosser';

function sample<Ts>(generator: IProperty<Ts> | Arbitrary<Ts>, params?: Parameters | number): Ts[] {
  const qParams = QualifiedParameters.read_or_num_runs(params);
  return [
    ...stream(toss(generator, qParams.seed))
      .take(qParams.num_runs)
      .map(s => s().value)
  ];
}

interface Dictionary<T> {
  [Key: string]: T;
}

function Object_entries<T>(obj: Dictionary<T>): [string, T][] {
  let entries: [string, T][] = [];
  for (const k of Object.keys(obj)) {
    entries.push([k, obj[k]]);
  }
  return entries;
}
function String_padStart(s: string, length: number, pad: string): string {
  if (s.length > length) {
    return String(s);
  }
  const missing = length - s.length;
  if (missing > pad.length) {
    pad += pad.repeat(missing / pad.length);
  }
  return pad.slice(0, missing) + s;
}
function String_padEnd(s: string, length: number, pad: string): string {
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
  const qParams = QualifiedParameters.read_or_num_runs(params);
  let recorded: Dictionary<number> = {};
  for (const g of stream(toss(generator, qParams.seed))
    .take(qParams.num_runs)
    .map(s => s().value)) {
    const out = classify(g);
    const categories: string[] = Array.isArray(out) ? (out as string[]) : [out as string];
    for (const c of categories) {
      recorded[c] = (recorded[c] || 0) + 1;
    }
  }
  const data = Object_entries(recorded)
    .sort((a, b) => b[1] - a[1])
    .map(i => [i[0], `${(100.0 * i[1] / qParams.num_runs).toFixed(2)}%`]);
  const longestName = data.map(i => i[0].length).reduce((p, c) => Math.max(p, c), 0);
  const longestPercent = data.map(i => i[1].length).reduce((p, c) => Math.max(p, c), 0);
  for (const item of data) {
    qParams.logger(`${String_padEnd(item[0], longestName, '.')}..${String_padStart(item[1], longestPercent, '.')}`);
  }
}

export { sample, statistics };
