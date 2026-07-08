---
title: Advent of PBT 2024 · Day 23
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
image: /img/blog/2024-12-23-advent-of-pbt-day-23--social.png
---

import { AdventPlaygroundOfTheDay, FormOfTheDay } from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. This time, it’s not Santa but Emma who needs your help: she suspects her coin-payment algorithm might have bugs. Can you uncover any issues and ensure every elf gets paid on time for years to come? 🎄✨

{/* truncate */}

## Money day

In Santa's world, money works just like in ours. At the end of each month, elves and other inhabitants receive a payslip reflecting their contributions. However, Santa has a habit of delaying payments in December, claiming he needs to withdraw coins since he only pays in cash.

Last year’s drama prompted Emma, one of the elves, to take action. She designed an algorithm to ensure smooth payouts. Her algorithm works like this:

- **Input:** A list of coins Santa has in hand and the exact amount he needs to pay a given elf.
- **Output:** Either an array containing the values of the coins that sum up to the exact amount or `null` if it’s impossible to make the payment.

For example:

- If Santa has coins `[1, 1, 2, 5, 10]` and needs to pay `7`, the algorithm might return `[2, 5]`.
- If Santa has coins `[3, 4, 5]` and needs to pay `2`, it would return `null`.

## Hands on

This time, it’s not Santa calling you — it’s Emma. She’s concerned her algorithm might contain errors. If the payouts are delayed again this year, it could damage elf morale and break their motivation for next year.

Emma shared one important detail before leaving you to test her algorithm: in Santa’s world, the coins available are always `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`.

Your mission: Use property-based testing to check Emma’s algorithm for bugs and ensure it works flawlessly.

You’ve already saved Christmas this year; now it’s time to ensure smooth payouts for years to come! 🎄✨

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="" />
