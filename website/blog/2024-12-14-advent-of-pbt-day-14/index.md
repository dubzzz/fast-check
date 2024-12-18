---
title: Advent of PBT 2024 · Day 14
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking! Santa just reached out with a new challenge: the elves’ compression algorithm for children's letters might have some flaws. Can you identify edge cases that break the system and ensure everything works smoothly? 🎄🔧

<!--truncate-->

## Memory efficient storage

With children’s letters piling up year after year, Santa asked his elves to design a basic compression algorithm to save storage space. The goal? Efficiently reduce the size of repetitive patterns in text while keeping the content readable and reversible.

The elves devised a straightforward yet effective approach and shared the core concept with Santa:

- Identify consecutive characters
- Replace with a count-character pair

For example: `"hello"` becomes `"1h1e2l1o"`. While not particularly efficient for this example, the elves emphasize that this algorithm is just one piece of a larger, more advanced compression system they plan to implement.

## Hands on

The elves completed the task promptly and even provided a matching reverse function. However, Santa has concerns. He suspects there might be edge cases leading the system to fail. Your mission: find a text that causes issues for the system and prove that there’s a bug.

Christmas depends on your testing skills. Don’t let Santa down! 🎅🔧

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="https://bsky.app/profile/fast-check.dev/post/3ldawlb3pe223" />
