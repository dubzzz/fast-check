import { PoisoningFreeMap } from '../PoisoningFreeMap.js';

export type GlobalDetails = {
  /**
   * Name associated to the current global,
   * in other words the path leading to it such as `Array.prototype.map` or `Object.entries`
   */
  name: string;
  /**
   * Depth of the global relative to the scanning root
   * Remark: in the current implementation it might not be the shortest one but it will be updated soon
   */
  depth: number;
  /**
   * Map containing all the known properties attached to the current global
   * it contains all the keys and symbols enumarable or not, configurable or not attached to it
   */
  properties: PoisoningFreeMap<string | symbol, PropertyDescriptor>;
};

export type AllGlobals = PoisoningFreeMap<unknown, GlobalDetails>;
