import { ConverterFromNextProperty } from './ConverterFromNextProperty';
import { ConverterToNextProperty } from './ConverterToNextProperty';
import { INextRawProperty } from './INextRawProperty';
import { IRawProperty } from './IRawProperty';

/** @internal */
export function convertFromNextProperty<Ts, IsAsync extends boolean>(
  property: INextRawProperty<Ts, IsAsync>
): IRawProperty<Ts, IsAsync> {
  if (ConverterToNextProperty.isConverterToNext(property)) {
    return property.property;
  }
  return new ConverterFromNextProperty(property);
}

/** @internal */
export function convertToNextProperty<Ts, IsAsync extends boolean>(
  property: IRawProperty<Ts, IsAsync>
): INextRawProperty<Ts, IsAsync> {
  if (ConverterFromNextProperty.isConverterFromNext(property)) {
    return property.property;
  }
  return new ConverterToNextProperty(property);
}
