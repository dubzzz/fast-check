/** @internal */
export function preferPrintableMapper(v: number): number {
  if (v < 95) return v + 0x20; // 0x20-0x7e
  if (v <= 0x7e) return v - 95;
  return v;
}
