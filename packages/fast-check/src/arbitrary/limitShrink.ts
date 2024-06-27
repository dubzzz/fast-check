  /**
   * Create another Arbitrary with limited number of shrink values
   *
   * @example
   * ```typescript
   * const dataGenerator: Arbitrary<string> = ...;
   * const limitedShrinkableDataGenerator: Arbitrary<string> = dataGenerator.limitShrink(2, 10);
   * // up to 2 in depth for the shrink and 10 per level
   * ```
   *
   * @returns Create another arbitrary with limited number of shrink values
   * @remarks Since x.x.x
   */
  limitShrink(numMaxLevels: number, numMaxShrinkPerLevel: number): Arbitrary<T> {
    let rewrapped: Arbitrary<T> = this;
    if (numMaxLevels !== Number.POSITIVE_INFINITY) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      rewrapped = new LimitedShrinkDepthArbitrary(rewrapped, numMaxLevels);
    }
    if (numMaxShrinkPerLevel !== Number.POSITIVE_INFINITY) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      rewrapped = new LimitedShrinkPerLevelArbitrary(rewrapped, numMaxShrinkPerLevel);
    }
    return rewrapped;
  }