import prand, { RandomGenerator } from 'pure-rand';
import { Parameters } from './Parameters';
import { VerbosityLevel } from './VerbosityLevel';

/**
 * @hidden
 *
 * Configuration extracted from incoming Parameters
 *
 * It handles and set the default settings that will be used by runners.
 */
export class QualifiedParameters<T> {
  seed: number;
  randomType: (seed: number) => RandomGenerator;
  numRuns: number;
  maxSkipsPerRun: number;
  timeout: number | null;
  path: string;
  logger: (v: string) => void;
  unbiased: boolean;
  verbose: VerbosityLevel;
  examples: T[];

  private static readSeed = <T>(p?: Parameters<T>): number => {
    // No seed specified
    if (p == null || p.seed == null) return Date.now() ^ (Math.random() * 0x100000000);

    // Seed is a 32 bits signed integer
    const seed32 = p.seed | 0;
    if (p.seed === seed32) return seed32;

    // Seed is either a double or an integer outside the authorized 32 bits
    const gap = p.seed - seed32;
    return seed32 ^ (gap * 0x100000000);
  };
  private static readRandomType = <T>(p?: Parameters<T>): ((seed: number) => RandomGenerator) => {
    if (p == null || p.randomType == null) return prand.xorshift128plus;
    if (typeof p.randomType === 'string') {
      switch (p.randomType) {
        case 'mersenne':
          return prand.mersenne;
        case 'congruential':
          return prand.congruential;
        case 'congruential32':
          return prand.congruential32;
        case 'xorshift128plus':
          return prand.xorshift128plus;
        default:
          throw new Error(`Invalid random specified: '${p.randomType}'`);
      }
    }
    return p.randomType;
  };
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
  private static readVerbose = <T>(p?: Parameters<T>): VerbosityLevel => {
    if (p == null || p.verbose == null) return VerbosityLevel.None;
    if (typeof p.verbose === 'boolean') {
      return p.verbose === true ? VerbosityLevel.Verbose : VerbosityLevel.None;
    }
    if (p.verbose <= VerbosityLevel.None) {
      return VerbosityLevel.None;
    }
    if (p.verbose >= VerbosityLevel.VeryVerbose) {
      return VerbosityLevel.VeryVerbose;
    }
    return p.verbose | 0;
  };
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
