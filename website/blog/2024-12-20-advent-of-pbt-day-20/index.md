---
title: Advent of PBT 2024 · Day 20
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
image: ../../static/img/blog/2024-12-20-advent-of-pbt-day-20--social.png
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: he tackled a tricky coding problem to boost his morale but suspects his solution might have flaws. Can you find a bug in his implementation and restore his confidence? 🎄✨

<!--truncate-->

## Coding day

After a hectic Christmas season, Santa decided to take a short break to unwind. This morning, he stumbled upon a coding challenge online and couldn’t resist giving it a try.

The challenge goes like this:

> Imagine a sorted list of integers, but someone has rotated it by taking a portion from the beginning and moving it to the end. Your task is to find the index of the original first item in the list.

In other words:

> You start with a list: `[i0, i1, ..., in]` where all items are sorted in ascending order (`i{index} <= i{index+1}`).
> Then someone rearranges the list to look like this: `[im+1, im+2, ..., in, i0, i1, ..., im]`.
> Your goal is to determine the index of `i0` in the modified list.

## Hands on

This time, Santa isn’t asking you to save Christmas — he just needs your help to boost his morale. He’s fairly confident about his solution to the coding challenge but has a sneaking suspicion there might be a bug.

To impress himself further, Santa attempted to solve the problem with an optimized approach that avoids scanning through all the items in the list. However, he sheepishly admits that the solution wasn’t entirely his own — it’s based on suggestions from GPT-4o. While he trusts the AI’s results, his inexperience with such tools makes him cautious.

Santa has already tested the solution thoroughly and hasn’t found any issues, but if a bug exists, it’s likely deeply hidden. You’ll need to let fast-check run for more than its default 100 runs to uncover it. Can you identify an input that breaks Santa’s implementation? 🎄✨

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="https://bsky.app/profile/fast-check.dev/post/3ldpumndae22n" />
