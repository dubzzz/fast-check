import type { Plugin } from '../../plugin/Plugin.js';

const globalPlugins: Plugin<any>[] = [];

/**
 * Install a plugin to be used by all the runners
 * Installed plugins come before the ones passed via the `plugins` option of the run.
 *
 * In other words, they are the outermost ones: they are entered first when running the predicate.
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
 * @param plugin - Plugin to be installed globally
 *
 * @remarks Since 4.10.0
 * @public
 */
export function installGlobalPlugin(plugin: Plugin<unknown>): void {
  globalPlugins.push(plugin);
}

export function readInstalledGlobalPlugins(): Plugin<any>[] {
  return globalPlugins;
}
