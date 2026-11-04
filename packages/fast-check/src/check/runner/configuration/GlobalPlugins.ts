import type { Plugin, UniversalPlugin } from '../../plugin/Plugin.js';

const globalPlugins: { pre: UniversalPlugin[]; post: UniversalPlugin[] } = { pre: [], post: [] };

/**
 * Install a plugin to be used by all the runners
 * By default, installed plugins come before the ones passed via the `plugins` option of the run.
 * Pass `'post'` as the second argument to place them after those plugins instead.
 * Both positions come before the default plugins, preserving custom error reporting precedence.
 * Plugins installed at the same position keep their installation order.
 * Set `noGlobalPlugins: true` to skip them for a particular run.
 *
 * Plugins installed at the default `'pre'` position are the outermost ones: they are entered first when running the predicate.
 * Think of: `outer(inner(predicate))`.
 *
 * @example
 * ```typescript
 * fc.installGlobalPlugin(myPlugin());
 * //...
 * fc.assert(myProp, { plugins: [myOtherPlugin()] })
 * // equivalent to { plugins: [myPlugin(), myOtherPlugin()] }
 * // myPlugin will wrap myOtherPlugin, itself wrapping the default behavior
 * ```
 *
 * @example
 * ```typescript
 * fc.installGlobalPlugin(myPlugin(), 'post');
 * //...
 * fc.assert(myProp, { plugins: [myOtherPlugin()] })
 * // equivalent to { plugins: [myOtherPlugin(), myPlugin()] }
 * // myOtherPlugin will wrap myPlugin, itself wrapping the default behavior
 * ```
 *
 * @param plugin - Plugin to be installed globally
 * @param position - Install before (`'pre'`, the default) or after (`'post'`) the plugins passed to the runner
 *
 * @remarks Since 4.10.0
 * @public
 */
export function installGlobalPlugin(plugin: UniversalPlugin | Plugin<unknown>, position: 'pre' | 'post' = 'pre'): void {
  globalPlugins[position].push(plugin as UniversalPlugin);
}

export function readInstalledGlobalPlugins(position: 'pre' | 'post'): UniversalPlugin[] {
  return globalPlugins[position];
}
