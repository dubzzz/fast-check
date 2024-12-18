---
title: Advent of PBT 2024 · Day 16
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: the elves’ algorithm for generating Santa Codes might have some hidden flaws. Can you use your debugging skills to uncover any issues and ensure the system works flawlessly? 🎄✨

<!--truncate-->

## Santa Code

Santa came up with a creative twist on counting. Instead of using the traditional numeric sequence (1, 2, 3, 4, ...), he designed a system where each consecutive number differs from the previous one by exactly one bit.

For example, instead of the sequence 0, 1, 2, 3, the Santa Code sequence looks like this:

- 0 → `00`
- 1 → `01`
- 3 → `11`
- 2 → `10`

This approach ensures each number differs in only a single binary digit.

Santa tasked his elves with implementing an algorithm that takes an index and returns the corresponding Santa Code. The sequence starts like this:

- Index 0 returns 0
- Index 1 returns 1
- Index 2 returns 3
- Index 3 returns 2
- Index 4 returns 6

Of course, the sequence goes well beyond these first few values, as you can imagine.

## Hands on

The elves implemented it in a "flawless way" as they told Santa. But Santa has his doubts. He’s asking for your help to confirm the algorithm works perfectly.

Your mission: Can you identify an integer input (within the range of 0 to 2\*\*31 - 1, likely sufficient) that causes the elves’ implementation to produce an invalid result—something that doesn’t align with Santa's expectations?

Santa is counting on you to validate his system and find any hidden flaws! 🎅✨

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="https://bsky.app/profile/fast-check.dev/post/3ldfusoxn722n" />
