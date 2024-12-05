---
title: Advent of PBT 2024 · Day 5
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: he’s worried about the security of his high-traffic website. The elves have created a system to validate security keys, but Santa fears it might be flawed. Can you test their implementation and ensure it’s rock solid? 🎄🔧

<!--truncate-->

## SSL/TLS security checks

Santa has been diving deep into the world of computer science. It’s already Day 5, and he’s spent most of his time diving into books about web security. With his website handling massive traffic and being a prime target for hackers, Santa is determined to ensure its security—and that of its users—remains uncompromised.

To that end, he asked his elves to build an algorithm to validate security keys. According to Santa’s definition, a valid key is a number that can be expressed as the product of exactly two distinct prime numbers. For instance:

- `6 = 2 × 3` is valid.
- `30 = 2 × 3 x 5` is not valid (it has more than two primes).
- `5` is also not valid (it’s a prime, but not a product of two primes).

## Hands on

The elves delivered the algorithm! But as always, Santa wants you to double-check their work. Before you dive into the playground to test their implementation, here are some key details Santa wants you to remember: The algorithm only supports keys within the range of 2 to 2,147,483,647 (inclusive).

Your task, using the property-based testing features of fast-check, is to find a key that breaks the elves’ implementation.

You are Santa’s last hope to safeguard the security of his website — don’t let him down! 🎄🔧

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="https://bsky.app/profile/fast-check.dev/post/3lck6yc6c2c2g" />
