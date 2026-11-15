import type { Parameters } from './Parameters.js';

/**
 * Parameters for statistics
 * @remarks Since 5.0.0
 * @public
 */
export type StatisticsParameters<T, TKind extends 'property' | 'arbitrary'> = TKind extends 'arbitrary'
  ? Parameters<T>
  : Parameters<T> & {
      /**
       * Skip the property's predicate: `false` by default
       * @remarks Since 5.0.0
       */
      noPredicateExecution?: boolean;
    };
