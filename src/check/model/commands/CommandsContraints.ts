/**
 * Parameters for {@link commands}
 * @public
 */
export interface CommandsContraints {
  /**
   * Maximal number of commands to generate per run
   */
  maxCommands?: number;
  /**
   * Do not show replayPath in the output
   */
  disableReplayLog?: boolean;
  /**
   * Hint for replay purposes only
   *
   * Should be used in conjonction with `{ seed, path }` of {@link assert}
   */
  replayPath?: string;
}
