import { nil } from '../../../utils/iterator.js';
import type { Property } from '../../property/types/Property.js';
import type { QualifiedParameters } from '../configuration/QualifiedParameters.js';
import { RunnerIterator } from '../RunnerIterator.js';
import { lazyToss, toss } from '../Tosser.js';
import { pathWalk } from './PathWalker.js';

export function createRunnerIterator<Ts>(
  property: Property<Ts>,
  generator: Pick<Property<Ts>, 'generate'>,
  qParams: QualifiedParameters<Ts>,
  maxSkips: number,
): RunnerIterator<Ts> {
  const shrink: typeof property.shrink = (...args) => property.shrink(...args);
  const initialValues =
    qParams.path.length === 0
      ? toss(generator, qParams.seed, qParams.randomType, qParams.examples)
      : pathWalk(qParams.path, lazyToss(generator, qParams.seed, qParams.randomType, qParams.examples), shrink);
  const maxInitialIterations = qParams.path.includes(':') ? Number.POSITIVE_INFINITY : qParams.numRuns;
  return new RunnerIterator(
    initialValues,
    !qParams.endOnFailure ? shrink : () => nil,
    qParams.verbose,
    maxSkips,
    maxInitialIterations,
  );
}
