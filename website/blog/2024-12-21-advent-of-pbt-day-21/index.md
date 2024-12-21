---
title: Advent of PBT 2024 · Day 21
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
image: ./social.png
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: the elves’ new feature for his remastered Tic-Tac-Toe game might have flaws. Can you uncover any bugs in the algorithm and ensure every child’s favorite game is perfect? 🎄✨

<!--truncate-->

## Tic-Tac-Toe

This year’s best-selling game is Santa’s remastered version of Tic-Tac-Toe! However, Santa is running behind schedule, and a key feature is still incomplete.

Here are the rules:

- The game is played on a 3x3 grid.
- Exactly two players take turns.
- Each player uses a unique symbol: Player 1 plays 🎄, and Player 2 plays 🎁.
- On each turn, a player places their symbol in one of the empty cells.
- The game ends either when one player forms a line (horizontal, vertical, or diagonal) of three identical symbols or when the grid is completely filled without a winner.

But Santa's version is special. It adds an exciting twist: it can tell each player if they still have a chance to win. To achieve this, Santa asked the elves to create a function:

```ts
canStillWinTheGame(board: ('🎄' | '🎁' | null)[][], player: '🎄' | '🎁'): boolean;
```

This function takes two arguments:

- `board`: A 2D array representing the current game state, such as: `[['🎄', null, '🎄'], [null, '🎄', null], ['🎁', null, '🎁']]`.
- `player`: The symbol (🎄 or 🎁) for the player checking if they can still win.

The function should return true if the player can still achieve a winning line, and false otherwise.

Santa has instructed the elves to assume all boards provided to the function are valid, meaning:

- The number of moves made by each player follows the rules of Tic-Tac-Toe (e.g., 🎄 always plays first, 🎁 follows, and so on).
- Once a player wins, the game ends — there will be no further moves after a winning state.

## Hands on

The elves managed to implement the feature just in time for Christmas, but Santa wants to be absolutely sure it works as intended before releasing the game worldwide. This feature is critical, and any bugs could ruin the children’s excitement!

Your task: Using property-based testing, investigate whether there’s a bug in the algorithm. If you find one, report it to Santa immediately so the issue can be fixed before the big day. 🎄✨

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="" />
