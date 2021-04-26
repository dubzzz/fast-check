/** @internal */
export function preferPrintableMapper(v: number): number {
  if (v < 95) return v + 0x20; // 0x20-0x7e
  if (v <= 0x7e) return v - 95;
  return v;
}

/** @internal */
export function preferPrintableUnmapper(v: number): number {
  if (v >= 0x20 && v <= 0x7e) return v - 0x20; // v + 0x20
  if (v >= 0 && v <= 0x1f) return v + 95; // v - 95
  return v;
}
