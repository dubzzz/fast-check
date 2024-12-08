---
title: Advent of PBT 2024 · Day 12
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: the elves’ newly released routing system for the sleigh might have issues. Can you uncover potential flaws and ensure Santa reaches his destination in record time? 🎄✨

<!--truncate-->

## Fast Travel Planner

_"Tomorrow is the big day!"_ Santa announces with excitement.

_"What big day?"_ you wonder, slightly puzzled.

It turns out Santa has been eagerly awaiting React Day Berlin! A fan of cutting-edge dev techniques and knowledge sharing, he’s been counting down to this conference since last year. It’s his ideal last-minute break to explore the latest React trends before the Christmas rush.

This morning, Santa’s elves proudly unveiled the latest iteration of the sleigh’s routing system — a sophisticated algorithm designed to calculate the fastest route for delivering gifts to children worldwide. But Santa has another plan: to test the system before Christmas during his trip to the conference.

The algorithm operates on a list of all known routes in Santa’s network, with each route defined as a directed edge::

- `from`: The starting point of the route, represented as a string consisting of a single lowercase letter (`a` to `z`).
- `to`: The destination of the route, represented as a string consisting of a single lowercase letter (`a` to `z`).
- `distance`: The time it takes to travel, expressed as a strictly positive integer being less than `2**31-1`.

Given a starting location and a desired destination, the algorithm either:

- Returns the routes to take for the fastest journey, or
- Indicates that no path exists to the destination.

## Hands on

There’s just one problem. While the algorithm was released this morning, it’s still in its testing phase. Santa, however, insists on using it now and absolutely cannot be late for React Day Berlin.

That’s where you come in!

Your mission: rigorously test the sleigh’s routing algorithm to ensure it finds the most efficient path from start to destination.

Christmas — and Santa’s conference dreams — are counting on you! Don’t let him down. 🎄✨

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />
