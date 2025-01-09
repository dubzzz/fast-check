// @ts-check

export default function advent() {
  const player1 = '\u{1f384}';
  const player2 = '\u{1f381}';

  /** @typedef {'\u{1f384}' | '\u{1f381}'} Player */
  /** @typedef {Player | null} Cell */

  /**
   * @param {Cell[][]} board
   * @param {Player} player
   * @returns {boolean}
   */
  return function canStillWinTheGame(board, player) {
    assertLegalBoard(board);
    return (
      hasWon(board, player) ||
      hasWon(
        board.map((row) => row.map((cell) => cell ?? player)),
        player,
      )
    );
  };

  /**
   * @param {Cell[][]} board
   * @param {Player} player
   * @returns {boolean}
   */
  function hasWon(board, player) {
    const lines = [...Array(3)].map((_, i) => `${board[i][0]}${board[i][1]}${board[i][2]}`);
    const columns = [...Array(3)].map((_, i) => `${board[0][i]}${board[1][i]}${board[2][i]}`);
    const diags = [`${board[0][0]}${board[1][1]}${board[2][2]}`, `${board[2][0]}${board[1][1]}${board[0][2]}`];
    return [...lines, ...columns, ...diags].includes(`${player}${player}${player}`);
  }

  /**
   * @param {Cell[][]} board
   * @returns {void}
   */
  function assertLegalBoard(board) {
    if (board.length !== 3) {
      throw new Error('The grid should be 3x3, received too many rows');
    }
    if (board.some((row) => row.length !== 3)) {
      throw new Error('The grid should be 3x3, received too many columns in one of the rows');
    }
    if (!board.every((row) => row.every((cell) => cell === null || cell === player1 || cell === player2))) {
      throw new Error('The grid should only be made of valid symbols or null (for empty)');
    }
    const count1 = board.flat().reduce((acc, player) => (player === player1 ? acc + 1 : acc), 0);
    const count2 = board.flat().reduce((acc, player) => (player === player2 ? acc + 1 : acc), 0);
    if (count1 < count2) {
      throw new Error('Player 1 is supposed to play first, there are less symbols for 1 than for 2');
    }
    if (count1 > count2 + 1) {
      throw new Error('Players are supposed to one after the other, player 1 played a bit too many times');
    }
    if (count1 === count2 && hasWon(board, player1)) {
      throw new Error('Player 2 played while player 1 already won the game');
    }
  }
}
