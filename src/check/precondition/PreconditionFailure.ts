/** @hidden */
export class PreconditionFailure extends Error {
  private static readonly SharedFootPrint: symbol = Symbol.for('fast-check/PreconditionFailure');
  private readonly footprint: symbol;
  constructor() {
    super();
    this.footprint = PreconditionFailure.SharedFootPrint;
  }
  static isFailure(err: any): err is PreconditionFailure {
    return err != null && (err as PreconditionFailure).footprint === PreconditionFailure.SharedFootPrint;
  }
}
