import { PoisoningFreeMap } from '../PoisoningFreeMap.js';

export type GlobalDetails = {
  name: string;
  properties: PoisoningFreeMap<string, PropertyDescriptor>;
};

export type AllGlobals = PoisoningFreeMap<unknown, GlobalDetails>;
