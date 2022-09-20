/**
 * Internal symbol used to declare an opaque type for DepthIdentifier
 * @public
 */
declare const depthIdentifierSymbol: unique symbol;

/**
 * Type used to strongly type instances of depth identifier while keeping internals
 * what they contain internally
 *
 * @remarks Since 2.25.0
 * @public
 */
export type DepthIdentifier = { [depthIdentifierSymbol]: true };

/**
 * Instance of depth, can be used to alter the depth perceived by an arbitrary
 * or to bias your own arbitraries based on the current depth
 *
 * @remarks Since 2.25.0
 * @public
 */
export type DepthContext = {
  /**
   * Current depth (starts at 0, continues with 1, 2...).
   * Only made of integer values superior or equal to 0.
   *
   * Remark: Whenever altering the `depth` during a `generate`, please make sure to ALWAYS
   * reset it to its original value before you leave the `generate`. Otherwise the execution
   * will imply side-effects that will potentially impact the following runs and make replay
   * of the issue barely impossible.
   */
  depth: number;
};

/**
 * Internal cache for depth contexts
 * @internal
 */
const depthContextCache = new Map<string, DepthContext>();

/**
 * Get back the requested DepthContext
 * @remarks Since 2.25.0
 * @public
 */
export function getDepthContextFor(contextMeta: DepthContext | DepthIdentifier | string | undefined): DepthContext {
  if (contextMeta === undefined) {
    return { depth: 0 };
  }
  if (typeof contextMeta !== 'string') {
    return contextMeta as DepthContext;
  }
  const cachedContext = depthContextCache.get(contextMeta);
  if (cachedContext !== undefined) {
    return cachedContext;
  }
  const context = { depth: 0 };
  depthContextCache.set(contextMeta, context);
  return context;
}

/**
 * Create a new and unique instance of DepthIdentifier
 * that can be shared across multiple arbitraries if needed
 * @public
 */
export function createDepthIdentifier(): DepthIdentifier {
  const identifier: DepthContext = { depth: 0 };
  return identifier as unknown as DepthIdentifier;
}
