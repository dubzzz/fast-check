---
title: Advent of PBT 2024 · Day 6
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: the elves have designed an algorithm to compute the next barcode for Santa’s presents—a task that grows harder each year. Santa suspects their implementation might not be reliable. Can you find errors in the algorithm to ensure every present is labeled correctly? 🎄🔧

{/* truncate */}

## The barcode

Centuries ago, when Santa first began his activity, he introduced the world’s very first barcode system—becoming a true pioneer of the industry!

Santa defined his barcode system using a specific sequence of symbols (order matters): ✉️, 🧺, 🎄, 🔔, 🕯️, ⭐, 🦌, ⛄, 🛷, ❄️, 🎿, ✨, 🤩, 🥳, 🎈, 🪀, 🎮, 🎲, ♟️, 💝, 🎀, 🧦, 🎅, 🤶, 🎁.

Since day one, every present Santa delivers is labeled with a barcode following this rule:

- The first present was labeled `['✉️']`.
- The second present was `['🧺']`.
- The one after `['🎁']` was `['🧺', '✉️']`.
- The one after `['🧺', '✉️']` was `['🧺', '🧺']`.
- The one after `['🧺', '🎁']` was `['🎄', '✉️']`.
- ...

Another rule to remember is that, apart from `['✉️']`, no barcode should start with a `✉️` —it’s the equivalent of "zero" in Santa’s numerical system.

Over time, computing the next barcode has become increasingly challenging. To save time, Santa ordered his elves to design an algorithm capable of taking an initial barcode (in the form of an array) and calculating the next one in sequence.

## Hands on

The elves are confident they’ve delivered the most reliable and efficient solution to Santa’s request. But Santa asked you to verify their work. Your mission is to find any barcode that their algorithm mishandles and report it to Santa. As he left the room, Santa paused at the door and mentioned: _"Oh, by the way, this year I’ll probably start using the 17th bar of my barcode system... or maybe the 19th, not sure actually"_.

Time is running out, and presents are already piling up while waiting for your checks! 🎄🔧

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="https://bsky.app/profile/fast-check.dev/post/3lcmsxk3ht223" />
