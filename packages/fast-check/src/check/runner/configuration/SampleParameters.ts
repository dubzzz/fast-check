import type { Parameters } from './Parameters.js';

/**
 * Parameters for sampling
 * @remarks Since 5.0.0
 * @public
 */
export type SampleParameters<T, TKind extends 'property' | 'arbitrary'> = TKind extends 'arbitrary'
  ? Parameters<T>
  : Parameters<T> & {
      /**
       * Skip the property's predicate: `false` by default
       * @remarks Since 5.0.0
       */
      noPredicateExecution?: boolean;
    };
