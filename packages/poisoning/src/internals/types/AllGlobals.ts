import { PoisoningFreeMap } from '../PoisoningFreeMap';

export type GlobalDetails = {
  name: string;
  properties: PoisoningFreeMap<string, PropertyDescriptor>;
};

export type AllGlobals = PoisoningFreeMap<unknown, GlobalDetails>;
