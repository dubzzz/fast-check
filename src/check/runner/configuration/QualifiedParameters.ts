import { Parameters } from './Parameters';
import { RandomType } from './RandomType';

/**
 * @hidden
 *
 * Configuration extracted from incoming Parameters
 *
 * It handles and set the default settings that will be used by runners.
 */
export class QualifiedParameters<T> {
  seed: number;
  randomType: RandomType;
  numRuns: number;
  maxSkipsPerRun: number;
  timeout: number | null;
  path: string;
  logger: (v: string) => void;
  unbiased: boolean;
  verbose: boolean;
  examples: T[];

  private static readSeed = <T>(p?: Parameters<T>): number => (p != null && p.seed != null ? p.seed : Date.now());
  private static readRandomType = <T>(p?: Parameters<T>): RandomType =>
    p != null && p.randomType != null ? p.randomType : 'mersenne';
  private static readNumRuns = <T>(p?: Parameters<T>): number => {
    const defaultValue = 100;
    if (p == null) return defaultValue;
    if (p.numRuns != null) return p.numRuns;
    if ((p as { num_runs?: number }).num_runs != null) return (p as { num_runs: number }).num_runs;
    return defaultValue;
  };
  private static readMaxSkipsPerRun = <T>(p?: Parameters<T>): number =>
    p != null && p.maxSkipsPerRun != null ? p.maxSkipsPerRun : 100;
  private static readTimeout = <T>(p?: Parameters<T>): number | null =>
    p != null && p.timeout != null ? p.timeout : null;
  private static readPath = <T>(p?: Parameters<T>): string => (p != null && p.path != null ? p.path : '');
  private static readUnbiased = <T>(p?: Parameters<T>): boolean => p != null && p.unbiased === true;
  private static readVerbose = <T>(p?: Parameters<T>): boolean => p != null && p.verbose === true;
  private static readLogger = <T>(p?: Parameters<T>): ((v: string) => void) => {
    if (p != null && p.logger != null) return p.logger;
    return (v: string) => {
      // tslint:disable-next-line:no-console
      console.log(v);
    };
  };
  private static readExamples = <T>(p?: Parameters<T>): T[] => (p != null && p.examples != null ? p.examples : []);

  /**
   * Extract a runner configuration from Parameters
   * @param p Incoming Parameters
   */
  static read<T>(p?: Parameters<T>): QualifiedParameters<T> {
    return {
      seed: QualifiedParameters.readSeed(p),
      randomType: QualifiedParameters.readRandomType(p),
      numRuns: QualifiedParameters.readNumRuns(p),
      maxSkipsPerRun: QualifiedParameters.readMaxSkipsPerRun(p),
      timeout: QualifiedParameters.readTimeout(p),
      logger: QualifiedParameters.readLogger(p),
      path: QualifiedParameters.readPath(p),
      unbiased: QualifiedParameters.readUnbiased(p),
      verbose: QualifiedParameters.readVerbose(p),
      examples: QualifiedParameters.readExamples(p)
    };
  }

  /**
   * Extract a runner configuration from Parameters
   * or build one based on a maximal number of runs
   *
   * @param p Incoming Parameters or maximal number of runs
   */
  static readOrNumRuns<T>(p?: Parameters<T> | number): QualifiedParameters<T> {
    if (p == null) return QualifiedParameters.read();
    if (typeof p === 'number') return QualifiedParameters.read({ numRuns: p });
    return QualifiedParameters.read(p);
  }
}
