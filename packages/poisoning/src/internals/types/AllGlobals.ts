import { PoisoningFreeMap } from '../PoisoningFreeMap.js';

export type GlobalDetails = {
  name: string;
  properties: PoisoningFreeMap<string | symbol, PropertyDescriptor>;
  depth: number;
  topLevelRoots: PoisoningFreeMap<string, true>;
};

export type AllGlobals = PoisoningFreeMap<unknown, GlobalDetails>;
