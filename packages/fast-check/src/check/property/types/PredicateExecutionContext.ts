/**
 * Context passed to the predicate at execution time.
 * May give more details about the context in which it runs.
 *
 * Use module augmentation to declare optional fields supplied by plugins.
 *
 * @example
 * ```ts
 * import 'fast-check';
 * interface MyPluginContext { requestId?: string | undefined; }
 * declare module 'fast-check' {
 *   export interface PredicateExecutionContext extends MyPluginContext {}
 * }
 * ```
 *
 * @remarks Since 5.0.0
 * @public
 */
export interface PredicateExecutionContext {
  /**
   * Signal supplied by plugins to request a cancellation
   * @remarks Since 5.0.0
   */
  signal?: AbortSignal | undefined;
}
