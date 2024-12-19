import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 21,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: canStillWinTheGame,
  parser,
  placeholderForm: '🎄?\n🎄.🎄\n.🎄.\n🎁.🎁',
  functionName: 'canStillWinTheGame',
  signature: "canStillWinTheGame(board: ('🎄' | '🎁' | null)[][], player: '🎄' | '🎁'): boolean;",
  signatureExtras: [],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

const player1 = '\u{1f384}';
const player2 = '\u{1f381}';

type Player = typeof player1 | typeof player2;
type Cell = Player | null;

function hasWon(board: Cell[][], player: Player): boolean {
  const lines = [...Array(3)].map((_, i) => `${board[i][0]}${board[i][1]}${board[i][2]}`);
  const columns = [...Array(3)].map((_, i) => `${board[0][i]}${board[1][i]}${board[2][i]}`);
  const diags = [`${board[0][0]}${board[1][1]}${board[2][2]}`, `${board[2][0]}${board[1][1]}${board[0][2]}`];
  return [...lines, ...columns, ...diags].includes(`${player}${player}${player}`);
}

function countBeforeWin(rawBoard: Cell[][], player: Player): number {
  const board = rawBoard.map((row) => row.map((cell) => cell ?? '?'));
  const lines = [...Array(3)].map((_, i) => `${board[i][0]}${board[i][1]}${board[i][2]}`);
  const columns = [...Array(3)].map((_, i) => `${board[0][i]}${board[1][i]}${board[2][i]}`);
  const diags = [`${board[0][0]}${board[1][1]}${board[2][2]}`, `${board[2][0]}${board[1][1]}${board[0][2]}`];

  let best = -1;
  const winCase = `${player}${player}${player}`;
  for (const conf of [...lines, ...columns, ...diags]) {
    if (conf.replace(/\?/g, player) !== winCase) {
      continue; // cannot win
    }
    const missingCount = [...conf].reduce((acc, cell) => (cell === '?' ? acc + 1 : acc), 0);
    if (best === -1 || best > missingCount) {
      best = missingCount;
    }
  }
  return best;
}

function assertLegalBoard(board: Cell[][]): void {
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

function canStillWinTheGame(board: Cell[][], player: Player): boolean {
  assertLegalBoard(board);
  if (hasWon(board, player)) {
    return true;
  }
  const countRequired = countBeforeWin(board, player);
  const remaining = board.flat().reduce((acc, player) => (player === null ? acc + 1 : acc), 0);
  const remainingForPlayer = player === player1 ? Math.ceil(remaining / 2) : Math.floor(remaining / 2);
  return countRequired !== -1 && countRequired <= remainingForPlayer;
}

// Inputs parser

function parser(answer: string): unknown[] | undefined {
  const lines = answer.split('\n');
  if (lines.length !== 4) {
    throw new Error(`Should provide exactly 4 lines`);
  }
  if (lines[0] !== `${player1}?` && lines[0] !== `${player2}?`) {
    throw new Error(
      `First line must tell which player wants to know if winning is still doable. Expected <player>?. Received: ${lines[0]}.`,
    );
  }
  const player = lines[0] === `${player1}?` ? player1 : player2;
  const board = lines.slice(1).map((row) => [...row].map((cell) => (cell === '.' ? null : cell)));
  return [board, player];
}
