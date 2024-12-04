---
title: Advent of PBT 2024 · Day 4
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: he’s struggling with a slow system for locating letters on his massive grid of post office boxes. The elves proposed a faster method, but Santa suspects it might not work as intended. Can you make sure their implementation is up to the task? 🎄🔧

<!--truncate-->

## Post Office finder

Each post office has a direct connection to Santa’s land. Whenever someone sends a letter to Santa, the post office forwards it to Santa’s massive wall of boxes. This wall is a 10,000 (width) by 1,000 (height) grid, where each box corresponds to a specific post office. When a letter arrives, the corresponding box starts beeping, and Santa has to locate and open it.

Today, when a box starts beeping, Santa uses an elevator to move one box at a time across the massive grid to locate the source of the sound. Watching how painful and slow this process was, the elves stepped in with a suggestion to make it faster while keeping the elevator in place.

Instead of moving box by box, they proposed that Santa use directional arrows — <kbd>←</kbd>, <kbd>→</kbd>, <kbd>↑</kbd>, <kbd>↓</kbd>, <kbd>↖</kbd>, <kbd>↗</kbd>, <kbd>↘</kbd>, <kbd>↙</kbd> — to tell the elevator where the sound is coming from. Based on this input, the elevator would immediately jump to a new location. If it lands directly on the correct box, the process ends. Otherwise, Santa repeats the process by providing another direction until the target is reached.

## Hands on

The elves claimed that their system can reduce the search from 10,000,000 moves to at most 14 moves (not one more). However, Santa isn’t fully convinced. He asked the elves to create an emulator that simulates the process. This emulator takes:

- An initial position (x, y) where elevator starts.
- The target box position (x, y) where the beep originates.

The emulator outputs the number of moves required for the elevator to reach the beeping box. In simpler terms, the elves provided a function to compute the number of moves needed to navigate Santa’s 10,000 by 1,000 grid from one coordinate `{x, y}` to another. Santa now needs your help to test if this function works correctly—or if the elves made a mistake.

Using the property-based testing features of fast-check, your task is to find a combination of initial position and box position that breaks the elves’ implementation.

You are Santa’s last hope to ensure Christmas happens this year — don’t let him down! 🎄🔧

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="https://bsky.app/profile/fast-check.dev/post/3lchq7y5wps2t" />
