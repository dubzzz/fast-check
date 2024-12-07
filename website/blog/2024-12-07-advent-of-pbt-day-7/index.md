---
title: Advent of PBT 2024 · Day 7
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: the elves have developed an algorithm to simplify the paths to items stored in Santa’s massive network of nested boxes. Santa fears the algorithm may have flaws, potentially making critical items impossible to find. Can you uncover any issues to ensure the system works perfectly? 🎄🔧

<!--truncate-->

## Inventory locator

Finding specific items in Santa’s workshop has become like searching for a needle in a haystack. To solve this problem centuries ago, Santa introduced an ingenious system for assigning every item a unique location—a concept so advanced it resembles the modern idea of file paths. Each item's location is a path through a vast network of nested boxes.

For example, the “Sticker of fast-check” might be stored in box 123, which is inside box 58, which itself is inside box 159. Santa’s paths always begin with a slash `/` followed by a sequence of box names—positive integers or zero—separated by slashes. This ensures that every item can be pinpointed quickly, no matter how deeply nested it is.

However, over time, moving items around in the tree of boxes has introduced clutter into these paths making some messy:

- `/123/` could be simplified into `/123`.
- `/123///456` could be simplified into `/123/456`.
- `/123/./././456` could be simplified into `/123/456`.
- `/123/456/../789` could be simplified into `/123/789`.
- ...

To make the system manageable again, Santa asked his elves to clean up the paths using these rules:

- Paths must not end with a slash.
- No two or more consecutive slashes are allowed.
- `.` and `..` boxes must be resolved or removed entirely.
- Corrupted paths must not be modified.

## Hands on

The elves, realizing how critical this task is, prioritized creating an algorithm to simplify paths. However, Santa, busy with his Christmas preparations, is concerned that the implementation might have bugs.

Your mission is to test the algorithm using property based capabilities and uncover any paths that are improperly simplified. Such errors could cause chaos during Christmas, as Santa and his elves won’t be able to find key items in a timely manner.

The stakes are high — can you ensure the system is foolproof? 🎄🔧

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />
