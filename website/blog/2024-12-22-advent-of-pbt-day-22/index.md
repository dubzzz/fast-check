---
title: Advent of PBT 2024 · Day 22
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
image: ./social.png
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking! Santa just sent you a new challenge: his elves’ algorithm for SantaMind might have bugs. Can you uncover any issues and ensure every guess gets the perfect feedback? 🎄✨

<!--truncate-->

## SantaMind

Santa has reinvented a classic game, filling it with the joy of Christmas! Instead of the usual colors, the game now uses festive icons, bringing holiday cheer to every round. Here's how it works:

> **The Goal**
>
> Guess the secret sequence of icons chosen by your opponent (or the game). With icons from: 🎄, 🦌, ⛄, 🛷, 🎈, 🎀, 🎅, 🎁.
>
> **Gameplay**
>
> Players submit their guesses, attempting to match the secret sequence.
>
> After each guess, the game provides feedback:
>
> - Good Placements: Icons that are in the correct position in the sequence.
> - Misplaced Icons: Icons that are in the secret sequence but not in the correct position.
>   Victory: You win by guessing the exact sequence within the allowed number of attempts.

Santa’s version introduces automated feedback to make the game smoother. Santa instructed his elves to create an algorithm that calculates the number of Good Placements and Misplaced Icons for any guess compared to the secret sequence.

For example:

If the secret sequence is [🎄, 🎁, ⛄, 🎈, 🎅] and the guess is [🎁, 🎄, ⛄, 🎄, 🦌], the feedback would be:

- 1 Good placement (⛄ is in the correct position).
- 2 Misplaced icons (🎄 and 🎁 are correct icons but in the wrong positions).

## Hands on

Santa believes the elves’ algorithm might contain a bug, and he’s counting on you to find it before it’s too late. Using property-based testing, can you identify an input that exposes a flaw in the implementation?

Christmas is at stake—debug fast and save the day! 🎅✨

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="" />
