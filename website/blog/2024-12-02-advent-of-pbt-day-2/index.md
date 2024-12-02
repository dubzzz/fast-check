---
title: Advent of PBT 2024 · Day 2
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: he’s worried that some children might be receiving duplicate responses — and possibly double the gifts! Santa suspects something is wrong with the way duplicates are handled by elves. Can you investigate and ensure everyone gets exactly what they deserve? 🎄🔧

<!--truncate-->

## Never answer twice

From the very beginning, Santa has held firm to one golden rule: never answer the same person twice. Every year, he carefully ensures that no one receives more presents than they should by verifying that he doesn’t reply to duplicate letters from the same sender. However, some people still try to cheat by sending multiple letters in hopes of extra gifts.

A few years ago, Santa introduced unique identifiers for each sender to help with this issue. Since then, he manually verifies each year that no sender ID appears more than once in his final list.

But manual checks are time-consuming, and Santa wants a more efficient solution. He tasked the elves with creating a function that takes a set of letters as input and automatically returns only one instance of each letter per sender.

## Hands on

The elves have built the function, but Santa is worried they might have missed something critical.

Using the property-based testing features provided by fast-check, your task is to identify a set of inputs (letters) that breaks the elves’ implementation. Before leaving you with the black-box playground below, Santa gives you two important pieces of advice:

1. Treat each letter as an object with a field `id` that can contain any type of string.
2. You are Santa’s last hope to ensure Christmas happens this year — don’t let him down! 🎄🔧

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />
