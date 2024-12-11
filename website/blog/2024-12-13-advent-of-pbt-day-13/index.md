---
title: Advent of PBT 2024 · Day 13
authors: [dubzzz]
tags: [advent-of-pbt, advent-of-pbt-2024]
---

import {AdventPlaygroundOfTheDay,FormOfTheDay} from './AdventOfTheDay';

Christmas is at risk! In their rush to meet tight deadlines, Santa’s elves accidentally introduced bugs into critical algorithms. If these issues aren’t discovered in time, Christmas could be delayed for everyone worldwide!

Your mission is to troubleshoot these black-box algorithms using the power of fast-check.

The clock is ticking. Santa just pinged you with your next challenge: the elves’ system for generating unique links to children’s letters might be flawed. Can you uncover inputs that reveal potential issues and ensure every child gets their special link? 🎄🔧

<!--truncate-->

## A glimpse into the past

Santa wants children to be able to revisit the letters they’ve sent him over the years. To achieve this, he asked his elves to create a personalized online storage system. Each child would get a unique link where their letter history is stored.

The links are designed to follow this format:
`https://my-history.santa-web/{first_name}-{last_name}-{hard_to_predict_id}`.

While the structure is fixed, the specifics are flexible. The `{first_name}` and `{last_name}` sections might be encoded, abbreviated, or transformed versions of the child's actual name. However, they must still adhere to the overall format of `https://my-history.santa-web/{something}-{something}-{something}`.

The algorithm generating these links requires a very few details:

- First Name: The child’s first name, consisting of any printable characters.
- Last Name: The child’s last name, also consisting of any printable characters.
- Birth Date: The child’s date of birth, provided as a UNIX timestamp in milliseconds.

## Hands on

The system is not new, it has been running since last year, but Santa has been hearing from disappointed children who never received their links. He suspects the elves’ algorithm might have some edge cases causing issues for certain children.

Your mission is to validate Santa’s concerns. Can you find a combination of input values that causes the link generation process to fail or behave unexpectedly? Prove to Santa that something is wrong with the current implementation!

Christmas relies on you uncovering this issue. Don’t let Santa — or the children — down! 🎄🔧

<AdventPlaygroundOfTheDay />

## Your answer

<FormOfTheDay />
