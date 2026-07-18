/** @internal */
export function countToggledBits(n: bigint): number {
  let count = 0;
  while (n > 0n) {
    if (n & 1n) ++count;
    n >>= 1n;
  }
  return count;
}

/** @internal */
export function computeNextFlags(flags: bigint, nextSize: number): bigint {
  // whenever possible we want to preserve the same number of toggled positions
  // whenever possible we want to keep them at the same place
  // flags: 1000101 -> 10011 or 11001 (second choice for the moment)
  const allowedMask = (1n << BigInt(nextSize)) - 1n;
  const preservedFlags = flags & allowedMask;
  let numMissingFlags = countToggledBits(flags - preservedFlags);
  let nFlags = preservedFlags;
  for (let mask = 1n; mask <= allowedMask && numMissingFlags !== 0; mask <<= 1n) {
    if (!(nFlags & mask)) {
      nFlags |= mask;
      --numMissingFlags;
    }
  }
  return nFlags;
}

/** @internal */
export function computeTogglePositions(chars: string[], toggleCase: (rawChar: string) => string): number[] {
  const positions: number[] = [];
  for (let idx = chars.length - 1; idx !== -1; --idx) {
    if (toggleCase(chars[idx]) !== chars[idx]) positions.push(idx);
  }
  return positions;
}

/**
 * Compute the flags required to move from untoggledChars to toggledChars
 *
 * @param untoggledChars - Original string split into characters
 * @param toggledChars - Toggled version of the string
 * @param togglePositions - Array referencing all case sensitive indexes in chars
 *
 * @internal
 */
export function computeFlagsFromChars(
  untoggledChars: string[],
  toggledChars: string[],
  togglePositions: number[],
): bigint {
  let flags = 0n;
  for (let idx = 0, mask = 1n; idx !== togglePositions.length; ++idx, mask <<= 1n) {
    if (untoggledChars[togglePositions[idx]] !== toggledChars[togglePositions[idx]]) {
      flags |= mask;
    }
  }
  return flags;
}

/**
 * Apply flags onto chars
 *
 * @param chars - Original string split into characters (warning perform side-effects on it)
 * @param flags - One flag/bit per entry in togglePositions - 1 means change case of the character
 * @param togglePositions - Array referencing all case sensitive indexes in chars
 * @param toggleCase - Toggle one char
 *
 * @internal
 */
export function applyFlagsOnChars(
  chars: string[],
  flags: bigint,
  togglePositions: number[],
  toggleCase: (rawChar: string) => string,
): void {
  for (let idx = 0, mask = 1n; idx !== togglePositions.length; ++idx, mask <<= 1n) {
    if (flags & mask) chars[togglePositions[idx]] = toggleCase(chars[togglePositions[idx]]);
  }
}
