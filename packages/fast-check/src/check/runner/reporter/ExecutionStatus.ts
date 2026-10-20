/**
 * Status of the execution of the property
 * @remarks Since 1.11.0 (previously a TypeScript-only `const enum` in 1.9.0)
 * @public
 */
export enum ExecutionStatus {
  Success = 0,
  Skipped = -1,
  Failure = 1,
}
