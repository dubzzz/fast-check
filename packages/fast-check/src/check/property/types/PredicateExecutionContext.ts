/**
 * Context passed to the predicate at execution time.
 * May give more details about the context in which it runs.
 *
 * When editing it from plugins, never change it directly but prefer creating a modified copy of it for downstream consumers.
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
