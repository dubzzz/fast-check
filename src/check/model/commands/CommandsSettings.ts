/**
 * Parameters for fc.commands
 */
export interface CommandsSettings {
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
   * Should be used in conjonction with { seed, path } of fc.assert
   */
  replayPath?: string;
}
