import prand, { RandomGenerator } from 'pure-rand';
import { Parameters } from './Parameters';
import { VerbosityLevel } from './VerbosityLevel';
import { RunDetails } from '../reporter/RunDetails';

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
  endOnFailure: boolean;
  skipAllAfterTimeLimit: number | null;
  interruptAfterTimeLimit: number | null;
  markInterruptAsFailure: boolean;
  reporter: ((runDetails: RunDetails<T>) => void) | null;
  asyncReporter: ((runDetails: RunDetails<T>) => Promise<void>) | null;

  constructor(op?: Parameters<T>) {
    const p = op || {};
    this.seed = QualifiedParameters.readSeed(p);
    this.randomType = QualifiedParameters.readRandomType(p);
    this.numRuns = QualifiedParameters.readNumRuns(p);
    this.verbose = QualifiedParameters.readVerbose(p);
    this.maxSkipsPerRun = QualifiedParameters.readOrDefault(p, 'maxSkipsPerRun', 100);
    this.timeout = QualifiedParameters.readOrDefault(p, 'timeout', null);
    this.skipAllAfterTimeLimit = QualifiedParameters.readOrDefault(p, 'skipAllAfterTimeLimit', null);
    this.interruptAfterTimeLimit = QualifiedParameters.readOrDefault(p, 'interruptAfterTimeLimit', null);
    this.markInterruptAsFailure = QualifiedParameters.readBoolean(p, 'markInterruptAsFailure');
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
  }

  toParameters(): Parameters<T> {
    const orUndefined = <V>(value: V | null) => (value !== null ? value : undefined);
    const parameters = {
      seed: this.seed,
      randomType: this.randomType,
      numRuns: this.numRuns,
      maxSkipsPerRun: this.maxSkipsPerRun,
      timeout: orUndefined(this.timeout),
      skipAllAfterTimeLimit: orUndefined(this.skipAllAfterTimeLimit),
      interruptAfterTimeLimit: orUndefined(this.interruptAfterTimeLimit),
      markInterruptAsFailure: this.markInterruptAsFailure,
      path: this.path,
      logger: this.logger,
      unbiased: this.unbiased,
      verbose: this.verbose,
      examples: this.examples,
      endOnFailure: this.endOnFailure,
      reporter: orUndefined(this.reporter),
      asyncReporter: orUndefined(this.asyncReporter),
    };

    // As we do not want to miss any of the parameters,
    // we want the compilation to fail in case we missed one when building `parameters`
    // in the code above. `failIfMissing` is ensuring that for us.

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _failIfMissing: keyof Parameters<T> extends keyof typeof parameters
      ? true
      : 'Some properties of Parameters<T> have not been specified' = true;

    return parameters;
  }

  private static readSeed = <T>(p: Parameters<T>): number => {
    // No seed specified
    if (p.seed == null) return Date.now() ^ (Math.random() * 0x100000000);

    // Seed is a 32 bits signed integer
    const seed32 = p.seed | 0;
    if (p.seed === seed32) return seed32;

    // Seed is either a double or an integer outside the authorized 32 bits
    const gap = p.seed - seed32;
    return seed32 ^ (gap * 0x100000000);
  };
  private static readRandomType = <T>(p: Parameters<T>): ((seed: number) => RandomGenerator) => {
    if (p.randomType == null) return prand.xorshift128plus;
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
        case 'xoroshiro128plus':
          return prand.xoroshiro128plus;
        default:
          throw new Error(`Invalid random specified: '${p.randomType}'`);
      }
    }
    return p.randomType;
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
    defaultValue: V
  ): NonNullable<Parameters<T>[K]> | V => (p[key] != null ? p[key]! : defaultValue);

  /**
   * Extract a runner configuration from Parameters
   * @param p Incoming Parameters
   */
  static read<T>(op?: Parameters<T>): QualifiedParameters<T> {
    return new QualifiedParameters(op);
  }
}
