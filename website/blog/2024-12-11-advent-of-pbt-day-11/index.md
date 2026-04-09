---
title: Advent of PBT 2024 · Day 11
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
image: /img/blog/2024-12-11-advent-of-pbt-day-11--social.png
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa’s relying on the elves’ algorithm to find the perfect spot for his sleigh at Christmas markets. Can you ensure it works flawlessly? 🎄🔧

{/_ truncate _/}

## Perfect market spots

Each year, Santa travels the world with his sleigh, visiting children at Christmas markets. And every year, he faces the same question: where can he land and set up his stand? This year, Santa wants to be fully prepared, so he asked the elves to create an algorithm that can quickly tell him the best spots at any Christmas market.

The task is simple: Santa is given a grid of squares, some of which are grayed out as unavailable, while the others are available spots. Santa needs the algorithm to check if there's enough room for his stand, based on a rectangular area of specific dimensions. If the algorithm finds a suitable space, it will return the location of the upper-left corner of the rectangle; if not, it will let Santa know there's no available space.

## Hands on

The elves have done their part! They replaced the grid with a 2D array of boolean values, where `true` indicates an available spot — _`.` in the input field_ — and `false` means it's not — _`x` in the input field_. Santa provides the width and height of the space he needs — both strictly positive integers, and the elves assure him that if there’s enough room, the algorithm will find it.

However, Santa cannot afford any mistakes — there’s too much at stake this Christmas. He cannot risk missing out on a market or being surprised by a lack of space for his stand. Can you help ensure that the elves' algorithm is flawless?

It’s critical for Santa, for the children, and for Christmas. Act quickly! 🎄🔧

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="https://bsky.app/profile/fast-check.dev/post/3lcz2znz7f222" />
