import { PoisoningFreeMap } from '../PoisoningFreeMap.js';

export type GlobalDetails = {
  name: string;
  properties: PoisoningFreeMap<string | symbol, PropertyDescriptor>;
};

export type AllGlobals = PoisoningFreeMap<unknown, GlobalDetails>;
