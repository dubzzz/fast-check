import {
  AsyncProperty,
  AsyncPropertyHookFunction,
  IAsyncProperty,
  IAsyncPropertyWithHooks,
} from './AsyncProperty.generic';
import { ConverterFromNextProperty } from './ConverterFromNextProperty';
import { ConverterToNextProperty } from './ConverterToNextProperty';
import { INextRawProperty } from './INextRawProperty';
import { IRawProperty } from './IRawProperty';
import { IProperty, IPropertyWithHooks, Property, PropertyHookFunction } from './Property.generic';

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

/** @internal */
export function convertFromNextPropertyWithHooks<Ts>(property: Property<Ts>): IProperty<Ts> & IPropertyWithHooks<Ts> {
  const oldProperty = convertFromNextProperty(property) as IProperty<Ts> & IPropertyWithHooks<Ts>;
  const hooks = {
    beforeEach(hookFunction: PropertyHookFunction): IPropertyWithHooks<Ts> {
      property.beforeEach(hookFunction);
      return oldProperty;
    },
    afterEach(hookFunction: PropertyHookFunction): IPropertyWithHooks<Ts> {
      property.afterEach(hookFunction);
      return oldProperty;
    },
  };
  return Object.assign(oldProperty, hooks);
}

/** @internal */
export function convertFromNextAsyncPropertyWithHooks<Ts>(
  property: AsyncProperty<Ts>
): IAsyncProperty<Ts> & IAsyncPropertyWithHooks<Ts> {
  const oldProperty = convertFromNextProperty(property) as IAsyncProperty<Ts> & IAsyncPropertyWithHooks<Ts>;
  const hooks = {
    beforeEach(hookFunction: AsyncPropertyHookFunction): IAsyncPropertyWithHooks<Ts> {
      property.beforeEach(hookFunction);
      return oldProperty;
    },
    afterEach(hookFunction: AsyncPropertyHookFunction): IAsyncPropertyWithHooks<Ts> {
      property.afterEach(hookFunction);
      return oldProperty;
    },
  };
  return Object.assign(oldProperty, hooks);
}
