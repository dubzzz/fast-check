import { nil } from '../../../utils/iterator.js';
import type { Property } from '../../property/types/Property.js';
import type { QualifiedParameters } from '../configuration/QualifiedParameters.js';
import { RunnerIterator } from '../RunnerIterator.js';
import { SourceValuesIterator } from '../SourceValuesIterator.js';
import { lazyToss, toss } from '../Tosser.js';
import { pathWalk } from './PathWalker.js';

export function createRunnerIterator<Ts>(
  property: Property<Ts>,
  generator: Pick<Property<Ts>, 'generate'>,
  qParams: QualifiedParameters<Ts>,
  maxSkips: number,
): RunnerIterator<Ts> {
  const maxInitialIterations = qParams.path.length === 0 || qParams.path.indexOf(':') === -1 ? qParams.numRuns : -1;
  const shrink: typeof property.shrink = (...args) => property.shrink(...args);
  const initialValues =
    qParams.path.length === 0
      ? toss(generator, qParams.seed, qParams.randomType, qParams.examples)
      : pathWalk(qParams.path, lazyToss(generator, qParams.seed, qParams.randomType, qParams.examples), shrink);
  return new RunnerIterator(
    new SourceValuesIterator(initialValues, maxInitialIterations, maxSkips),
    !qParams.endOnFailure ? shrink : () => nil,
    qParams.verbose,
  );
}
