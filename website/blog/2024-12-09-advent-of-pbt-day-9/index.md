---
title: Advent of PBT 2024 · Day 9
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: the elves’ algorithm to verify enchanted words might not handle all cases correctly. Can you find inputs that break it? 🎄🔧

<!--truncate-->

## Santa’s enchanted words

In Santa’s magical realm, certain enchanted words — known as Magic Palindromes — are used to unlock secret functions, such as accessing special gift archives, enabling the sleigh’s high-speed mode, or even activating Christmas spells. These palindromes are unique because their symmetrical structure makes them immune to tampering or corruption during transmission.

However, with the growing number of such magical commands and increasing complexities, Santa realized that manually checking whether a word is a palindrome has become error-prone. To avoid mistakes that could disrupt Christmas preparations, he tasked the elves with creating an algorithm to automatically verify whether a given word is a palindrome.

Here’s how [Wikipedia defines a palindrome](https://en.wikipedia.org/wiki/Palindrome):

> A palindrome is a word [...] that reads the same backwards as forwards

For example, “noon” or “racecar” are palindromes, but “santa” or “christmas” are not.

## Hands on

The stakes are high: if the algorithm fails, Santa might use a corrupted or invalid magic word, causing sleigh malfunctions, misrouted presents, or even delayed deliveries. And here’s a quick note Santa shared before leaving you in front of the playground: words can contain any printable characters, as long as they fit on a single line.

Your mission? Find any edge cases where it might fail and report them to Santa before it’s too late. 🎄🔧

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="https://bsky.app/profile/fast-check.dev/post/3lcucfobtnc24" />
