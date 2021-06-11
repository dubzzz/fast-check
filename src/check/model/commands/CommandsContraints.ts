/**
 * Parameters for {@link commands}
 * @remarks Since 2.2.0
 * @public
 */
export interface CommandsContraints {
  /**
   * Maximal number of commands to generate per run
   * @remarks Since 1.11.0
   */
  maxCommands?: number;
  /**
   * Do not show replayPath in the output
   * @remarks Since 1.11.0
   */
  disableReplayLog?: boolean;
  /**
   * Hint for replay purposes only
   *
   * Should be used in conjonction with `{ seed, path }` of {@link assert}
   *
   * @remarks Since 1.11.0
   */
  replayPath?: string;
}
