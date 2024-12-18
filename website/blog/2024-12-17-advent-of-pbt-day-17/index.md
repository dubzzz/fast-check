---
title: Advent of PBT 2024 · Day 17
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
image: ./social.png
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';
import BlueskyComments from '../2024-12-01-advent-of-pbt-day-1/BlueskyComments';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: the elves recently implemented a regex to validate email addresses for Santa's newsletter. Santa’s worried that some valid emails might be incorrectly rejected. Can you catch a valid email that’s being rejected? 🎅✨

<!--truncate-->

## Email validator

Santa recently received several hacking attempts. The hackers tried to register for his newsletters by providing invalid email addresses. To prevent this, Santa wants to add an extra layer of security to ensure that only valid email addresses can sign up for his newsletter.

## Hands on

This time, the elves received some help from GitHub Copilot, who provided them with a bulletproof regular expression (regex) to validate email addresses. According to Copilot, when the regex marks an email as invalid, it's definitely unsuitable. However, Santa's biggest concern is ensuring that no valid email addresses are rejected by this system.

Your mission: Can you find an email address that, despite being valid, is incorrectly rejected by the regex? Help Santa ensure no valid email ever gets blocked! 🎄✨

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />

## Comments

<BlueskyComments url="https://bsky.app/profile/fast-check.dev/post/3ldifkvx77k2n" />
