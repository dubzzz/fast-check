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
  timeout: number | null;
  path: string;
  logger: (v: string) => void;
  unbiased: boolean;
  verbose: VerbosityLevel;
  examples: T[];
  endOnFailure: boolean;
  skipAllAfterTimeLimit: number | null;
  interruptAfterTimeLimit: number | null;
  markInterruptAsFailure: boolean;
  skipEqualValues: boolean;
  ignoreEqualValues: boolean;
  reporter: ((runDetails: RunDetails<T>) => void) | null;
  asyncReporter: ((runDetails: RunDetails<T>) => Promise<void>) | null;
  includeErrorInReport: boolean;

  constructor(op?: Parameters<T>) {
    const p = op || {};
    this.seed = QualifiedParameters.readSeed(p);
    this.randomType = QualifiedParameters.readRandomType(p);
    this.numRuns = QualifiedParameters.readNumRuns(p);
    this.verbose = QualifiedParameters.readVerbose(p);
    this.maxSkipsPerRun = QualifiedParameters.readOrDefault(p, 'maxSkipsPerRun', 100);
    this.timeout = QualifiedParameters.safeTimeout(QualifiedParameters.readOrDefault(p, 'timeout', null));
    this.skipAllAfterTimeLimit = QualifiedParameters.safeTimeout(
      QualifiedParameters.readOrDefault(p, 'skipAllAfterTimeLimit', null),
    );
    this.interruptAfterTimeLimit = QualifiedParameters.safeTimeout(
      QualifiedParameters.readOrDefault(p, 'interruptAfterTimeLimit', null),
    );
    this.markInterruptAsFailure = QualifiedParameters.readBoolean(p, 'markInterruptAsFailure');
    this.skipEqualValues = QualifiedParameters.readBoolean(p, 'skipEqualValues');
    this.ignoreEqualValues = QualifiedParameters.readBoolean(p, 'ignoreEqualValues');
    this.logger = QualifiedParameters.readOrDefault(p, 'logger', (v: string) => {
      // tslint:disable-next-line:no-console
      console.log(v);
    });
    this.path = QualifiedParameters.readOrDefault(p, 'path', '');
    this.unbiased = QualifiedParameters.readBoolean(p, 'unbiased');
    this.examples = QualifiedParameters.readOrDefault(p, 'examples', []);
    this.endOnFailure = QualifiedParameters.readBoolean(p, 'endOnFailure');
    this.reporter = QualifiedParameters.readOrDefault(p, 'reporter', null);
    this.asyncReporter = QualifiedParameters.readOrDefault(p, 'asyncReporter', null);
    this.includeErrorInReport = QualifiedParameters.readBoolean(p, 'includeErrorInReport');
  }

  toParameters(): Parameters<T> {
    const orUndefined = <V>(value: V | null) => (value !== null ? value : undefined);
    const parameters: { [K in keyof Required<Parameters<T>>]: Parameters<T>[K] } = {
      seed: this.seed,
      randomType: this.randomType,
      numRuns: this.numRuns,
      maxSkipsPerRun: this.maxSkipsPerRun,
      timeout: orUndefined(this.timeout),
      skipAllAfterTimeLimit: orUndefined(this.skipAllAfterTimeLimit),
      interruptAfterTimeLimit: orUndefined(this.interruptAfterTimeLimit),
      markInterruptAsFailure: this.markInterruptAsFailure,
      skipEqualValues: this.skipEqualValues,
      ignoreEqualValues: this.ignoreEqualValues,
      path: this.path,
      logger: this.logger,
      unbiased: this.unbiased,
      verbose: this.verbose,
      examples: this.examples,
      endOnFailure: this.endOnFailure,
      reporter: orUndefined(this.reporter),
      asyncReporter: orUndefined(this.asyncReporter),
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
    if (p.seed == null) return safeDateNow() ^ (safeMathRandom() * 0x100000000);

    // Seed is a 32 bits signed integer
    const seed32 = p.seed | 0;
    if (p.seed === seed32) return seed32;

    // Seed is either a double or an integer outside the authorized 32 bits
    const gap = p.seed - seed32;
    return seed32 ^ (gap * 0x100000000);
  };
  private static readRandomType = <T>(p: Parameters<T>): ((seed: number) => QualifiedRandomGenerator) => {
    if (p.randomType == null) return prand.xorshift128plus as (seed: number) => QualifiedRandomGenerator;
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
    if (p.numRuns != null) return p.numRuns;
    if ((p as { num_runs?: number }).num_runs != null) return (p as { num_runs: number }).num_runs;
    return defaultValue;
  };
  private static readVerbose = <T>(p: Parameters<T>): VerbosityLevel => {
    if (p.verbose == null) return VerbosityLevel.None;
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
  private static readBoolean = <T, K extends keyof Parameters<T>>(p: Parameters<T>, key: K): boolean => p[key] === true;
  private static readOrDefault = <T, K extends keyof Parameters<T>, V>(
    p: Parameters<T>,
    key: K,
    defaultValue: V,
  ): NonNullable<Parameters<T>[K]> | V => {
    const value = p[key];
    // value will be non nullable if value != null (even if TypeScript complains about it)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return value != null ? value! : defaultValue;
  };
  private static safeTimeout = (value: number | null): number | null => {
    if (value === null) {
      return null;
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
