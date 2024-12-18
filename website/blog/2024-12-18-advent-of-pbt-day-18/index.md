---
title: Advent of PBT 2024 · Day 18
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
image: ./social.png
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: the elves’ journey-planning algorithm might have hidden flaws. Can you identify any issues and ensure Santa takes the shortest route to deliver gifts on time? 🎄✨

<!--truncate-->

## Journey planner

Every year, Santa embarks on his magical journey, visiting houses around the world. Optimizing his route to minimize the total distance traveled has always been critical—every extra kilometer risks potential delays.

This year, Santa asked the elves to develop an algorithm to plan the optimal journey for his sleigh. The goal: calculate the shortest possible route starting from Santa's house (at (0, 0)), visiting all the houses on his delivery list, and then returning to Santa's house.

Santa’s sleigh system has been designed as follows:

1. Santa enters the list of all houses he needs to visit. Each house is represented by a pair of coordinates (x, y) where x (respectively y) is an integer value between 0 and 1000.
2. The sleigh calculates the shortest route starting at Santa's house, visiting each house and then returning to Santa's house.

The distance between two locations is determined using Santa's unique measurement: `Math.abs(houseA.x - houseB.x) + Math.abs(houseA.y - houseB.y)`.

## Hands on

The elves claim they’ve nailed it this year—Santa should be faster than ever! But Santa is skeptical about their coding skills. He’s counting on you to rigorously test their algorithm and uncover any bugs before Christmas Eve.

Can you find an issue in their implementation and save Christmas? 🎄✨

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="https://bsky.app/profile/fast-check.dev/post/3ldkw4tnh5s2x" />
