import prand, { unsafeSkipN } from 'pure-rand';
import type { Parameters } from './Parameters';
import { VerbosityLevel } from './VerbosityLevel';
import type { RunDetails } from '../reporter/RunDetails';
import type { RandomGenerator } from 'pure-rand';

const safeDateNow = Date.now;
const safeMathMin = Math.min;
const safeMathRandom = Math.random;

/** @internal */
export type QualifiedRandomGenerator = RandomGenerator & Required<Pick<RandomGenerator, 'unsafeJump'>>;

/**
 * Configuration extracted from incoming Parameters
 *
 * It handles and set the default settings that will be used by runners.
 *
 * @internal
 */
export class QualifiedParameters<T> {
  seed: number;
  randomType: (seed: number) => QualifiedRandomGenerator;
  numRuns: number;
  maxSkipsPerRun: number;
  timeout: number | undefined;
  path: string;
  logger: (v: string) => void;
  unbiased: boolean;
  verbose: VerbosityLevel;
  examples: T[];
  endOnFailure: boolean;
  skipAllAfterTimeLimit: number | undefined;
  interruptAfterTimeLimit: number | undefined;
  markInterruptAsFailure: boolean;
  skipEqualValues: boolean;
  ignoreEqualValues: boolean;
  reporter: ((runDetails: RunDetails<T>) => void) | undefined;
  asyncReporter: ((runDetails: RunDetails<T>) => Promise<void>) | undefined;
  includeErrorInReport: boolean;

  constructor(op?: Parameters<T>) {
    const p = op || {};
    this.seed = QualifiedParameters.readSeed(p);
    this.randomType = QualifiedParameters.readRandomType(p);
    this.numRuns = QualifiedParameters.readNumRuns(p);
    this.verbose = QualifiedParameters.readVerbose(p);
    this.maxSkipsPerRun = p.maxSkipsPerRun !== undefined ? p.maxSkipsPerRun : 100;
    this.timeout = QualifiedParameters.safeTimeout(p.timeout);
    this.skipAllAfterTimeLimit = QualifiedParameters.safeTimeout(p.skipAllAfterTimeLimit);
    this.interruptAfterTimeLimit = QualifiedParameters.safeTimeout(p.interruptAfterTimeLimit);
    this.markInterruptAsFailure = p.markInterruptAsFailure === true;
    this.skipEqualValues = p.skipEqualValues === true;
    this.ignoreEqualValues = p.ignoreEqualValues === true;
    this.logger =
      p.logger !== undefined ? p.logger :
      ((v: string) => {
        // tslint:disable-next-line:no-console
        console.log(v);
      });
    this.path = p.path ?? '';
    this.unbiased = p.unbiased === true;
    this.examples = p.examples ?? [];
    this.endOnFailure = p.endOnFailure === true;
    this.reporter = p.reporter;
    this.asyncReporter = p.asyncReporter;
    this.includeErrorInReport = p.includeErrorInReport === true;
  }

  toParameters(): Parameters<T> {
    const parameters: { [K in keyof Required<Parameters<T>>]: Parameters<T>[K] } = {
      seed: this.seed,
      randomType: this.randomType,
      numRuns: this.numRuns,
      maxSkipsPerRun: this.maxSkipsPerRun,
      timeout: this.timeout,
      skipAllAfterTimeLimit: this.skipAllAfterTimeLimit,
      interruptAfterTimeLimit: this.interruptAfterTimeLimit,
      markInterruptAsFailure: this.markInterruptAsFailure,
      skipEqualValues: this.skipEqualValues,
      ignoreEqualValues: this.ignoreEqualValues,
      path: this.path,
      logger: this.logger,
      unbiased: this.unbiased,
      verbose: this.verbose,
      examples: this.examples,
      endOnFailure: this.endOnFailure,
      reporter: this.reporter,
      asyncReporter: this.asyncReporter,
      includeErrorInReport: this.includeErrorInReport,
    };
    return parameters;
  }

  private static createQualifiedRandomGenerator = (
    random: (seed: number) => RandomGenerator,
  ): ((seed: number) => QualifiedRandomGenerator) => {
    return (seed) => {
      const rng = random(seed);
      if (rng.unsafeJump === undefined) {
        rng.unsafeJump = () => unsafeSkipN(rng, 42);
      }
      return rng as QualifiedRandomGenerator;
    };
  };

  private static readSeed = <T>(p: Parameters<T>): number => {
    // No seed specified
    if (p.seed === undefined) return safeDateNow() ^ (safeMathRandom() * 0x100000000);

    // Seed is a 32 bits signed integer
    const seed32 = p.seed | 0;
    if (p.seed === seed32) return seed32;

    // Seed is either a double or an integer outside the authorized 32 bits
    const gap = p.seed - seed32;
    return seed32 ^ (gap * 0x100000000);
  };
  private static readRandomType = <T>(p: Parameters<T>): ((seed: number) => QualifiedRandomGenerator) => {
    if (p.randomType === undefined) return prand.xorshift128plus as (seed: number) => QualifiedRandomGenerator;
    if (typeof p.randomType === 'string') {
      switch (p.randomType) {
        case 'mersenne':
          return QualifiedParameters.createQualifiedRandomGenerator(prand.mersenne);
        case 'congruential':
        case 'congruential32':
          return QualifiedParameters.createQualifiedRandomGenerator(prand.congruential32);
        case 'xorshift128plus':
          return prand.xorshift128plus as (seed: number) => QualifiedRandomGenerator;
        case 'xoroshiro128plus':
          return prand.xoroshiro128plus as (seed: number) => QualifiedRandomGenerator;
        default:
          throw new Error(`Invalid random specified: '${p.randomType}'`);
      }
    }
    const mrng = p.randomType(0);
    if ('min' in mrng && mrng.min !== -0x80000000) {
      throw new Error(`Invalid random number generator: min must equal -0x80000000, got ${String(mrng.min)}`);
    }
    if ('max' in mrng && mrng.max !== 0x7fffffff) {
      throw new Error(`Invalid random number generator: max must equal 0x7fffffff, got ${String(mrng.max)}`);
    }
    if ('unsafeJump' in mrng) {
      return p.randomType as (seed: number) => QualifiedRandomGenerator;
    }
    return QualifiedParameters.createQualifiedRandomGenerator(p.randomType);
  };
  private static readNumRuns = <T>(p: Parameters<T>): number => {
    const defaultValue = 100;
    if (p.numRuns !== undefined) return p.numRuns;
    if ((p as { num_runs?: number }).num_runs !== undefined) return (p as { num_runs: number }).num_runs;
    return defaultValue;
  };
  private static readVerbose = <T>(p: Parameters<T>): VerbosityLevel => {
    if (p.verbose === undefined) return VerbosityLevel.None;
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
  private static safeTimeout = (value: number | undefined): number | undefined => {
    if (value === undefined) {
      return undefined;
    }
    return safeMathMin(value, 0x7fffffff);
  };

  /**
   * Extract a runner configuration from Parameters
   * @param p - Incoming Parameters
   */
  static read<T>(op?: Parameters<T>): QualifiedParameters<T> {
    return new QualifiedParameters(op);
  }
}
