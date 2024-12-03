---
title: Advent of PBT 2024 · Day 3
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: he needs you to investigate whether the fresh new word lookup system is working as expected. Can you ensure it’s accurate, so everyone gets exactly what they deserve? 🎄🔧

<!--truncate-->

## Word Lookup in Santa's Letters

Counting the number of presents of type A, then B, by scanning all letters one after the other is a tremendous amount of work for Santa. This year, everything should be automated. So, he asked his elves to provide a quick algorithm to check if a given string is found within a letter.

The algorithm was required to take two strings:

1. The first string is the content of the letter.
2. The second string is the word Santa is looking for.

Based on these two inputs, the algorithm should return true if and only if the word can be found within the letter. If the word isn’t found, it should return false.

## Hands on

The elves implemented it quickly, but they were in a rush, and the one assigned to this task didn’t have much time. Santa isn’t confident in the result. He needs you to verify if it works, and since he knows it might be buggy, he’s asking you to report any issues.

Using the property-based testing features of fast-check, your task is to find a set of inputs (content and word) that break the elves’ implementation.

You are Santa’s last hope to ensure Christmas happens this year — don’t let him down! 🎄🔧

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="https://bsky.app/profile/fast-check.dev/post/3lcf7uosakk24" />
