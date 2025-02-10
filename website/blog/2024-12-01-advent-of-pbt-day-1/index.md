---
title: Advent of PBT 2024 · Day 1
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from './BlueskyComments'

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your first challenge: he’s struggling to answer children in the proper and efficient order. Something seems to be going wrong—can you uncover the issue and save Christmas? 🎄🔧

<!--truncate-->

## Letters to Santa

Each year, Santa receives billions of letters from children and adults all over the globe, each with their own unique wish lists and messages. To ensure timely responses before the big day, Santa has spent years refining his process. This year, his carefully designed system is entering its final stage.

Santa has decided to prioritize his answers based on the following criteria:

1. The younger the sender, the faster the answer.
2. If two senders are the same age, sort their letters alphabetically by name using the `<` operator.

To implement this system, Santa asked his elves for help. He instructed them that the input would be an array of letters, each represented as a string in the format `name=age`. The name would consist only of lowercase letters (`a-z`), with at least one character, and the age would be a number between 7 and 77. The elves’ task was to return a sorted version of this array based on the specified criteria.

## Hands on

The elves completed the task, but Santa is worried they may have made mistakes.

Using the property-based testing features provided by fast-check, your mission is to uncover a set of inputs (letters) that break the elves’ implementation.

Santa has entrusted you with the code created by the elves (though you can’t see it directly). You’re his last hope — can you find the flaws and save Christmas? 🎄🔧

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="https://bsky.app/profile/fast-check.dev/post/3lca65jr4vc2n" />
