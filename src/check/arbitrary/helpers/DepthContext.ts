/** @internal */
export type DepthContext = {
  /** Current depth (starts at 0) */
  depth: number;
};

/**
 * Internal cache for depth contexts
 * @internal
 */
const depthContextCache = new Map<string, DepthContext>();

/**
 * Get back the requested DepthContext
 * @internal
 */
export function getDepthContextFor(contextMeta: DepthContext | string | undefined): DepthContext {
  if (contextMeta === undefined) {
    return { depth: 0 };
  }
  if (typeof contextMeta !== 'string') {
    return contextMeta;
  }
  const cachedContext = depthContextCache.get(contextMeta);
  if (cachedContext !== undefined) {
    return cachedContext;
  }
  const context = { depth: 0 };
  depthContextCache.set(contextMeta, context);
  return context;
}
