---
title: Advent of PBT 2024 · Day 24
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
image: /img/blog/2024-12-24-advent-of-pbt-day-24--social.png
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking! Emma just reached out with a new challenge: Santa’s coin distribution strategy for multiple elves might leave some unpaid. Can you identify any flaws in the algorithm and ensure every elf gets their fair share? 🎄✨

<!--truncate-->

## Money Day: The Revenge

Emma’s algorithm was a big hit! The elves were thrilled to learn about it. But they noticed something troubling: while her algorithm works wonders for a single elf’s payslip, it doesn’t account for the big picture.

Here’s the problem:

> Santa has to pay all the elves at once, and the coins he has available are limited. While there might be multiple ways to pay one elf, some of those choices can make it impossible to pay another elf later.

So elves created a more sophisticated algorithm that handles multiple payslips simultaneously. The algorithm specification is the following:

> **Input:**
>
> - coins: A list of available coins (e.g., `[1, 2, 2, 4, 5, 7, 10]`).
> - payslips: A list of amounts Santa must pay to each elf (e.g., `[7, 5, 8]`).
>
> **Output:**
>
> An array of arrays, where each inner array contains the coins used to fulfill a payslip (e.g., `[[7], [5], [2, 2, 4]]`).
> Return null if it’s impossible to fulfill all payslips with the given coins.
>
> When returned the array should be in the same ordered as the received payslips.

## Hands On

Emma just implemented this new algorithm, but she’s worried it might not work perfectly for all edge cases. She’s asking for your help to test it thoroughly using property-based testing.

Can you uncover any bugs and help Emma ensure that every elf gets paid fairly and efficiently this year?

Remember: Elf morale for next year is on the line. 🎄✨

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="" />
