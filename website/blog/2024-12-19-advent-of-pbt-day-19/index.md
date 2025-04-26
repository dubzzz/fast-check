---
title: Advent of PBT 2024 · Day 19
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
image: '@site/static/img/blog/2024-12-19-advent-of-pbt-day-19--social.png'
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: the elves’ sleigh-packing algorithm might have flaws. Can you uncover any issues and ensure Santa minimizes his trips? 🎄✨

<!--truncate-->

## Sleigh packing

Now that Santa’s route optimization is in place, it’s time to tackle another critical task: packing the sleigh efficiently. Santa cannot afford to make extra trips due to poor packing, so optimizing the sleigh’s contents is essential.

Santa has tasked his elves with creating an algorithm to determine the best way to pack his sleigh for each trip. The sleigh has a maximum capacity of 10 units of weight per trip. Some presents are heavier than others, so while the sleigh might carry one large present on one trip, it could carry multiple smaller ones on another. Santa’s goal is to minimize the total number of trips required to deliver all the presents.

The elves’ algorithm takes a list of strictly positive integer weights for the presents and determines how to group them for each trip. The key is to ensure:

- The weight in each trip does not exceed 10 units.
- The total number of trips is minimized.

For example:

If the requested set of presents was: 1, 2, 3, and 9, the lowest number of trips is 2 trips. It can be achieved by various combinations, and all of them are considered acceptable by Santa, as long as they stick to the constraint: "total number of trips is minimized".

## Hands on

The elves claim they’ve perfected the algorithm, but Santa isn’t convinced. He knows that every extra trip means more risk for Christmas. Your mission: identify a bug in the elves’ algorithm and help save Christmas! 🎄✨

Santa is counting on you to ensure no unnecessary trips delay his gift delivery. Can you find the flaw?

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="https://bsky.app/profile/fast-check.dev/post/3ldnepa4pi22n" />
