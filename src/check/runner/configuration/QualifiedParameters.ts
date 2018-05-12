import { Parameters } from './Parameters';

/**
 * @hidden
 *
 * Configuration extracted from incoming Parameters
 *
 * It handles and set the default settings that will be used by runners.
 */
export class QualifiedParameters {
  seed: number;
  numRuns: number;
  timeout: number | null;
  path: string;
  logger: (v: string) => void;
  unbiased: boolean;

  private static readSeed = (p?: Parameters): number => (p != null && p.seed != null ? p.seed : Date.now());
  private static readNumRuns = (p?: Parameters): number => {
    const defaultValue = 100;
    if (p == null) return defaultValue;
    if (p.numRuns != null) return p.numRuns;
    if ((p as { num_runs?: number }).num_runs != null) return (p as { num_runs: number }).num_runs;
    return defaultValue;
  };
  private static readTimeout = (p?: Parameters): number | null => (p != null && p.timeout != null ? p.timeout : null);
  private static readPath = (p?: Parameters): string => (p != null && p.path != null ? p.path : '');
  private static readUnbiased = (p?: Parameters): boolean => p != null && p.unbiased === true;
  private static readLogger = (p?: Parameters): ((v: string) => void) => {
    if (p != null && p.logger != null) return p.logger;
    return (v: string) => {
      // tslint:disable-next-line:no-console
      console.log(v);
    };
  };

  /**
   * Extract a runner configuration from Parameters
   * @param p Incoming Parameters
   */
  static read(p?: Parameters): QualifiedParameters {
    return {
      seed: QualifiedParameters.readSeed(p),
      numRuns: QualifiedParameters.readNumRuns(p),
      timeout: QualifiedParameters.readTimeout(p),
      logger: QualifiedParameters.readLogger(p),
      path: QualifiedParameters.readPath(p),
      unbiased: QualifiedParameters.readUnbiased(p)
    };
  }

  /**
   * Extract a runner configuration from Parameters
   * or build one based on a maximal number of runs
   *
   * @param p Incoming Parameters or maximal number of runs
   */
  static readOrNumRuns(p?: Parameters | number): QualifiedParameters {
    if (p == null) return QualifiedParameters.read();
    if (typeof p === 'number') return QualifiedParameters.read({ numRuns: p });
    return QualifiedParameters.read(p);
  }
}
