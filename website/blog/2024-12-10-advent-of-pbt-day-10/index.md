---
title: Advent of PBT 2024 · Day 10
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: after the issue you uncovered yesterday, the elves rewrote their algorithm to verify enchanted words. But Santa isn’t fully convinced the new version is flawless. Can you find inputs that expose any remaining flaws? 🎄🔧

<!--truncate-->

## Santa’s enchanted words

In Santa’s magical realm, enchanted words unlock special functionalities, like accessing secret archives or enabling high-speed sleigh mode. Thanks to your efforts yesterday, Santa discovered a critical bug in the elves’ first implementation. Alarmed, he immediately demanded a fix.

The elves have since rewritten their algorithm to verify whether a given word is an enchanted word. They admitted that the previous issue stemmed from an overly aggressive optimization aimed at speeding up the algorithm. Learning from their mistake, they’ve reverted to a simpler, more reliable implementation.

## Hands on

The elves are confident their updated solution is foolproof. But Santa isn’t so sure. He needs you to thoroughly test their work to ensure it holds up under scrutiny.

To assist you, Santa shared a few examples of valid enchanted words he use on regular basis:

- “⛄⭐⛄“
- “noon“
- “☀️🌙⭐🌙☀️🌙⭐🌙☀️“

Santa also reminded you that enchanted words can include any printable character as long as they fit on a single line.

Your mission? Identify a word that breaks the algorithm. Prove there’s a bug hiding in their logic. 🎄🔧

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="https://bsky.app/profile/fast-check.dev/post/3lcwssaif5c24" />
