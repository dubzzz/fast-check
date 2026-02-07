/**
 * Error type produced whenever a precondition fails
 * @remarks Since 2.2.0
 * @public
 */
export class PreconditionFailure extends Error {
  /** @internal */
  private static readonly SharedFootPrint: symbol = Symbol.for('fast-check/PreconditionFailure');
  /** @internal */
  private readonly footprint: symbol;
  constructor(readonly interruptExecution: boolean = false) {
    super();
    this.footprint = PreconditionFailure.SharedFootPrint;
  }
  static isFailure(err: unknown): err is PreconditionFailure {
    return (
      err !== null &&
      err !== undefined &&
      (err as PreconditionFailure).footprint === PreconditionFailure.SharedFootPrint
    );
  }
}
