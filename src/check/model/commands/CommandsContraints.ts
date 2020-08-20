/**
 * Parameters for {@link (commands:1)}
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
   * Should be used in conjonction with `{ seed, path }` of {@link (assert:1)}
   */
  replayPath?: string;
}
