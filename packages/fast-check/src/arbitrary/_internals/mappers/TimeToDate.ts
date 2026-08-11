export function timeToDateMapper(time: number): Date {
  return new Date(time);
}

export function timeToDateUnmapper(value: unknown): number {
  if (!(value instanceof Date) || value.constructor !== Date) {
    throw new Error('Not a valid value for date unmapper');
  }
  return value.getTime();
}

export function timeToDateMapperWithNaN(valueForNaN: number): (time: number) => Date {
  return (time) => {
    return time === valueForNaN ? new Date(Number.NaN) : timeToDateMapper(time);
  };
}

export function timeToDateUnmapperWithNaN(valueForNaN: number): (value: unknown) => number {
  return (value) => {
    const time = timeToDateUnmapper(value);
    return Number.isNaN(time) ? valueForNaN : time;
  };
}
