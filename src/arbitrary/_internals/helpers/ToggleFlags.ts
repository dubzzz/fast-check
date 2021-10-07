/** @internal */
export function countToggledBits(n: bigint): number {
  let count = 0;
  while (n > BigInt(0)) {
    if (n & BigInt(1)) ++count;
    n >>= BigInt(1);
  }
  return count;
}

/** @internal */
export function computeNextFlags(flags: bigint, nextSize: number): bigint {
  // whenever possible we want to preserve the same number of toggled positions
  // whenever possible we want to keep them at the same place
  // flags: 1000101 -> 10011 or 11001 (second choice for the moment)
  const allowedMask = (BigInt(1) << BigInt(nextSize)) - BigInt(1);
  const preservedFlags = flags & allowedMask;
  let numMissingFlags = countToggledBits(flags - preservedFlags);
  let nFlags = preservedFlags;
  for (let mask = BigInt(1); mask <= allowedMask && numMissingFlags !== 0; mask <<= BigInt(1)) {
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
  for (let idx = 0; idx !== chars.length; ++idx) {
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
  togglePositions: number[]
): bigint {
  let flags = BigInt(0);
  for (let idx = 0, mask = BigInt(1); idx !== togglePositions.length; ++idx, mask <<= BigInt(1)) {
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
  toggleCase: (rawChar: string) => string
): void {
  for (let idx = 0, mask = BigInt(1); idx !== togglePositions.length; ++idx, mask <<= BigInt(1)) {
    if (flags & mask) chars[togglePositions[idx]] = toggleCase(chars[togglePositions[idx]]);
  }
}
