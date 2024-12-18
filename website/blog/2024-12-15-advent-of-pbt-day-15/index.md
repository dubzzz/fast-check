---
title: Advent of PBT 2024 · Day 15
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: the elves’ newly designed shelf system might have critical flaws. Can you uncover edge cases in how items are placed and retrieved, ensuring the system can handle the Christmas rush without hiccups? 🎄✨

<!--truncate-->

## Conveyor belt replacement

Santa's toy factories have relied on conveyor belts for years to connect manufacturing and packaging. When a toy is ready, it’s queued on the belt heading to the packaging factory, which picks items one at a time. This setup worked well, acting as a buffer for busy production days.

But Santa decided to innovate! Instead of conveyor belts, he’s introducing a long shelf to hold items. Here’s how it works:

- Toys are placed on the shelf at specific positions, ranging from `0` to `length - 1` (with the `length` being a secret for now).
- A mechanical arm handles toy placement and retrieval.
- When packaging needs an item, it asks for the position of the oldest toy on the shelf.

If the shelf becomes full or empty, operations might fail. When this happens, the position returned is `-1`.

## Hands on

The elves developed an algorithm to control the shelf and its arm, exposing the following API:

- `createShelf()` — Creates a new shelf.
- `shelf.put()` — Adds an item to the shelf. Returns the position to place it, or `-1` if no space is available.
- `shelf.pop()` — Removes the oldest item from the shelf. Returns its position, or `-1` if the shelf is empty.
- `shelf.isEmpty()` — Checks if the shelf is empty, returning `true` or `false`.

Santa is suspicious of the elves’ code. He believes edge cases might cause unexpected behavior. Can you uncover issues by finding a sequence of operations that leads to an invalid or inconsistent state?

By unexpected state, Santa means:

- `put` failed when it should have worked (or the opposite) or returned a position already holding one item.
- `pop` failed when it should have worked (or the opposite) or returned a position without any item.
- `isEmpty` returned an incorrect status.

Your task: Identify a combination of put, pop, and isEmpty calls that leaves the shelf in an unexpected state. Share your findings and save Santa's new system! 🎅✨

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="https://bsky.app/profile/fast-check.dev/post/3ldd3n2viu22f" />
