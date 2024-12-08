---
title: Advent of PBT 2024 · Day 8
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: the elves’ algorithm to restore spaces in compressed messages might be flawed. Can you spot problematic inputs? 🎄🔧

<!--truncate-->

## Uncompress old text messages

Do you remember the days when SMS messages were limited in characters? Grammar and spelling had to be creatively adjusted just to make everything fit! Santa had the same problem. To overcome these constraints, he and his elves agreed to exchange messages without using spaces, saving valuable storage and transport capacity.

Now, with improved storage and communication technologies, Santa wants to restore these messages to their original, readable form by reintroducing the spaces. Recognizing the sheer volume of work this would require, he tasked his elves with developing an algorithm to automate the process.

The algorithm takes two inputs:

- A compressed message, which is a single string of concatenated words without spaces.
- An array of valid words (all lowercase letters from `a` to `z`, and each word has at least one letter).

If there’s a valid way to reconstruct the original message using the dictionary, the algorithm should return the decoded message with spaces. However, because the dictionary might be incomplete, if no valid reconstruction exists, the algorithm should simply return the original compressed message.

## Hands on

The elves are confident they’ve built a solid solution. But Santa, as always, has doubts. He wants you to put their implementation to the test.

Your mission? Identify an input combination — a word list and a compressed message — that breaks the algorithm. Prove there’s a bug hiding in their logic.

Christmas depends on restoring these messages correctly — don’t let Santa down! 🎄🔧

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />
