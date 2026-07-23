---
title: What's new in fast-check 4.9.0?
authors: [dubzzz]
tags: [release]
---

Supporting shrink is crucial for the built-in arbitraries in fast-check. For this release, we deeply reworked `entityGraph` to give it built-in shrinking support. But this release is above all about performance. We spent the last few weeks tracking any optimization that we can put into fast-check on its critical and hot code paths.

Continue reading to explore the detailed updates it brings.

{/* truncate */}

## Rebuilding `entityGraph` on core primitives

Our initial implementation of `entityGraph` was pretty ad-hoc. It was mostly a manual implementation of an `Arbitrary` barely re-using any existing primitives from fast-check. It worked but missed key capabilities coming with our core building blocks.

The reason for that choice is twofold:

- The arbitrary was complex, it took us time to get a comprehensive enough picture of how we would implement it. As such going manual helped us sketch how we could generate such values. This first sketch got translated in this release into core building blocks.
- We were missing a key building block: [`chainUntil`](/core-blocks/arbitraries/combiners/any/#chainuntil) (landed in [4.8.0](/blog/2026/06/25/whats-new-in-fast-check-4-8-0/)).

In this minor release, we switched from a manual and tailored implementation of the `Arbitrary` class to an arbitrary composing several building blocks from fast-check. Such switch allowed multiple cool things:

- The arbitrary now benefits from shrinking capabilities. We don't have to do special tricks for it to work.
- The arbitrary also benefits from all performance optimizations made to core building blocks. As such optimizing them benefits other arbitraries even more.

## Performance at heart

Aiming for performance has always been in our DNA. We want the cost of running tests with fast-check to be as little as possible. As such this release focused on finding things we could make faster to benefit as much as possible hot code paths.

### Strategy

We sat down and thought about what should and what should not be optimized. If you think of one of your property based snippet you'll probably quickly reach this conclusion:

- Instantiating an instance of `Arbitrary` is done one per test
- Pulling and generating valuesout of an `Arbitrary` is achieved a hundred times per test (by default)
- Reducing to smaller values is barely never done as it means bugs

Said differently making generate code path faster while making shrink slower is a no problem. Same but with more attention when making generate faster and initialization slower.

### Process

Earlier this year we had the priviledge to be accepted as part of the [Claude for Open Source](https://www.anthropic.com/claude-for-oss-terms) licensing. We wanted to see and try if we could make it capable of helping us tracking down slow code path and proposing optimizations for them.

We decided to tell Claude how performance troubleshooting works, what it can usually look for in terms of optimizations... To achive that we drafted a `CLAUDE.md` summuraizing our mission. The files was cut in sveral sections. Following list gives you a quick highlight of the key pronciples we used for each of them.

1. How to find slow code path?

   > Write down benchmarks, run them and use profiling tools to extract the worst offenders.
   > Better optimizing code snippets accountable for huge parts of the runtime cost.
   > Node comes with extra toolset to find out deoptimizations, use [dexnode](https://npmx.dev/package/dexnode) to record them.

2. What are the most common optimization tricks in JavaScript and also generally?

   > Build a set of common optimization tricks that are worth considering when optimizing code.
   > To construct that set:
   >
   > - Scan all the PR related to performance (⚡️) that we merged over time in both `dubzzz/fast-check` and `dubzzz/pure-rand`
   > - Read through [Marvin Hagemeister's blog posts](https://marvinh.dev/blog/speeding-up-javascript-ecosystem/)
   > - Enrich with your personal knowledge and extra resources that you could find online on that matter

3. How to confirm an optimization works?

   > Run the code, benchmark it, profile it. Make sure that the place you optimized really shrunk in profiling. Beware of micro-benchmarks. When writing benchmarks always consider several possible entry sets and don't just focus on one of them in you run.

4. What is important to optimize in fast-check?

   > Well, this is just more or less about the Strategy section above.

5. How to proceed?

   > Use worktrees. Run one dedicated sub-agent per optimization. Only consider opening a PR if the optimization is really impressive or useful. Share benchmark snippets and benchmark results as part of the PR description. Always re-confirm the benchmark results.

### The results

Claude found out interesting places. Claude proposed some useful tricks.

But everything had to be carefully re-assessed. Some optimizations were incorrect or not saving time on useful parts of the code. Some were making the code hard to read or the bundle 10x larger. Regarding optimization places that it suggested, I think this is were it shined, the proposed places were always interesting to consider. Some were useless but at least they opened me the eyes on parts where we could eventually move faster.

The combination of LLM guided performance review plus human worked proved efficient for the library as a whole.

Running a dummy property such as:

```ts
fc.assert(fc.property(fc.constant(1), (_c) => {}));
```

Will be +50% faster with 4.9.0.

But we not only improved the basic runtime of an empty property not doing anything. We also improved most of our arbitraries. The following table summuraizes the measurments that we made when we compared 4.8.0 against 4.9.0:

| Benchmark                                                                                                                                           | 4.8.0 ops/s | 4.9.0\* ops/s |       Change |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------: | ------------: | -----------: |
| [stringMatching(/^abc$/)](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L101)                |       1,974 |        34,751 |       +1661% |
| [memo(tree)](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L70)                              |         309 |           939 |        +204% |
| [letrec(tree)](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L69)                            |         314 |           785 |        +150% |
| [record({ a: integer() })](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L53)                |       1,031 |         2,406 |        +133% |
| [tuple(integer())](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L52)                        |       3,831 |         5,448 |         +42% |
| [integer()](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L34)                               |       9,104 |        12,498 |         +37% |
| [integer().map(value+1)](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L106)                 |       7,098 |         9,478 |         +34% |
| [stringMatching(/^[a-zA-Z0-9]+$/)](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L102)       |         464 |           619 |         +33% |
| [maxSafeInteger()](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L35)                        |       6,668 |         8,835 |         +33% |
| [integer().filter(true)](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L108)                 |       8,339 |        11,024 |         +32% |
| [oneof(integer(), integer())](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L60)             |       5,196 |         6,469 |         +25% |
| [oneof({ weight, arbitrary }, …)](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L62)         |       5,262 |         6,482 |         +23% |
| [ipV4()](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L98)                                  |       1,123 |         1,377 |         +23% |
| [array(integer())](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L48)                        |       1,463 |         1,780 |         +22% |
| [float()](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L37)                                 |       4,075 |         4,948 |         +21% |
| [option(integer())](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L65)                       |       5,187 |         6,235 |         +20% |
| [date()](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L39)                                  |       3,082 |         3,660 |         +19% |
| [array(integer(), max 100)](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L49)               |         252 |           294 |         +17% |
| [webUrl()](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L97)                                |         133 |           155 |         +17% |
| [ipV6()](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L99)                                  |         189 |           220 |         +16% |
| [emailAddress()](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L96)                          |          71 |            81 |         +15% |
| [uniqueArray(integer())](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L50)                  |       1,043 |         1,191 |         +14% |
| [anything()](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L73)                              |          53 |            60 |         +14% |
| [boolean()](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L33)                               |      11,787 |        13,383 |         +14% |
| [map(string(), integer())](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L55)                |         125 |           139 | +11% _noise_ |
| [integer().chain(integer())](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L107)             |       3,601 |         3,988 |         +11% |
| [json()](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L74)                                  |          50 |            54 |          +9% |
| [set(integer())](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L51)                          |         801 |           873 |          +9% |
| [base64String()](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L45)                          |         890 |           968 |  +9% _noise_ |
| [dictionary(string(), integer())](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L54)         |          71 |            77 |          +8% |
| [string()](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L42)                                |         935 |         1,002 |          +7% |
| [uuid()](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L100)                                 |         552 |           587 |          +6% |
| [mixedCase(string())](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L103)                    |         463 |           489 |  +6% _noise_ |
| [string({ unit: 'grapheme' })](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L44)            |         647 |           682 |  +5% _noise_ |
| [constantFrom(1, 2)](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L59)                      |      23,298 |        23,934 |  +3% _noise_ |
| [constant(1)](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L58)                             |      34,475 |        35,099 |  +2% _noise_ |
| [string(max 100)](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L43)                         |         153 |           154 |  +1% _noise_ |
| [bigInt()](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L36)                                |         969 |           974 |  +1% _noise_ |
| [subarray([1, 2, 3, 4, 5])](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L66)               |       1,881 |         1,888 |  +0% _noise_ |
| [double()](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L38)                                |       1,601 |         1,600 |  −0% _noise_ |
| [entityGraph(employee → manager? + team)](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts#L76) |        11.3 |          10.8 |          −4% |

_Measured on Node v22.22.2 running fast-check's own [`arbitraries.bench.ts`](https://github.com/dubzzz/fast-check/blob/v4.9.0/packages/fast-check/test/bench/arbitraries.bench.ts): **fast-check@4.8.0 with pure-rand@8.4.0** vs **fast-check@4.9.0 with pure-rand@8.4.2**._

## Changelog since 4.8.0

The version 4.9.0 is based on version 4.8.0.

### Features

- ([PR#7008](https://github.com/dubzzz/fast-check/pull/7008)) Towards shrinkable `entityGraph` thanks to `chainUntil`

### Fixes

- ([PR#7010](https://github.com/dubzzz/fast-check/pull/7010)) Bug: Fix latent state-sharing bug in entityGraph
- ([PR#7063](https://github.com/dubzzz/fast-check/pull/7063)) Bug: Equiprobable alternatives in `stringMatching`
- ([PR#6973](https://github.com/dubzzz/fast-check/pull/6973)) CI: Drop caches on push for build package flow
- ([PR#6971](https://github.com/dubzzz/fast-check/pull/6971)) CI: Only mark fast-check's releases as latest
- ([PR#6974](https://github.com/dubzzz/fast-check/pull/6974)) CI: Drop pull_request_target flows
- ([PR#6975](https://github.com/dubzzz/fast-check/pull/6975)) CI: Drop discussion creation on release publish
- ([PR#6976](https://github.com/dubzzz/fast-check/pull/6976)) CI: Drop caches from publication steps
- ([PR#6977](https://github.com/dubzzz/fast-check/pull/6977)) CI: Revert "Drop caches from publication steps"
- ([PR#6978](https://github.com/dubzzz/fast-check/pull/6978)) CI: Make zizmor audit a required status check
- ([PR#6991](https://github.com/dubzzz/fast-check/pull/6991)) CI: Remove Claude Code workflow
- ([PR#6994](https://github.com/dubzzz/fast-check/pull/6994)) CI: Replace `pnpm dlx` with `pnpm exec` for `pkg-pr-new`
- ([PR#6995](https://github.com/dubzzz/fast-check/pull/6995)) CI: Inline zizmor ignores in workflow
- ([PR#6996](https://github.com/dubzzz/fast-check/pull/6996)) CI: Move to `devEngines.packageManager`
- ([PR#7005](https://github.com/dubzzz/fast-check/pull/7005)) CI: Update PULL_REQUEST_TEMPLATE.md
- ([PR#7011](https://github.com/dubzzz/fast-check/pull/7011)) CI: Drop OTP prompt from npm publish
- ([PR#7013](https://github.com/dubzzz/fast-check/pull/7013)) CI: Switch release jobs to npm stage publish
- ([PR#7027](https://github.com/dubzzz/fast-check/pull/7027)) CI: Run benchmarks against `main`
- ([PR#7037](https://github.com/dubzzz/fast-check/pull/7037)) CI: Use comparison mode for `bench`
- ([PR#7069](https://github.com/dubzzz/fast-check/pull/7069)) CI: Run pnpm dedupe to deduplicate lockfile
- ([PR#6959](https://github.com/dubzzz/fast-check/pull/6959)) CI: Announce releases on Bluesky
- ([PR#7105](https://github.com/dubzzz/fast-check/pull/7105)) CI: Switch to actions/attest for attestations
- ([PR#7117](https://github.com/dubzzz/fast-check/pull/7117)) CI: Use pnpm version in changelog script
- ([PR#7120](https://github.com/dubzzz/fast-check/pull/7120)) CI: Allow unclean tree in changelog generation
- ([PR#7125](https://github.com/dubzzz/fast-check/pull/7125)) CI: Stage publish using `pnpm` in publish jobs
- ([PR#7065](https://github.com/dubzzz/fast-check/pull/7065)) Clean: Delete skills directory
- ([PR#6983](https://github.com/dubzzz/fast-check/pull/6983)) Doc: Tweak PR Template to hint AI agents into revealing themselves
- ([PR#7092](https://github.com/dubzzz/fast-check/pull/7092)) Doc: Add back skills directory
- ([PR#7095](https://github.com/dubzzz/fast-check/pull/7095)) Doc: Add release notes for fast-check 4.8.0
- ([PR#7104](https://github.com/dubzzz/fast-check/pull/7104)) Doc: Add makeeno as doc contributor
- ([PR#7103](https://github.com/dubzzz/fast-check/pull/7103)) Doc: Fix info box in docs
- ([PR#7108](https://github.com/dubzzz/fast-check/pull/7108)) Doc: Add jneidel as doc contributor
- ([PR#7035](https://github.com/dubzzz/fast-check/pull/7035)) Performance: Faster `fc.integer` on `generate`
- ([PR#7046](https://github.com/dubzzz/fast-check/pull/7046)) Performance: Faster fc.record on generate
- ([PR#7047](https://github.com/dubzzz/fast-check/pull/7047)) Performance: Faster fc.dictionary on generate
- ([PR#7048](https://github.com/dubzzz/fast-check/pull/7048)) Performance: Faster `fc.webPath`/`fc.webUrl` on `generate`
- ([PR#7050](https://github.com/dubzzz/fast-check/pull/7050)) Performance: Faster `fc.stringMatching` for `\W` `\D` `\S` `.`
- ([PR#7054](https://github.com/dubzzz/fast-check/pull/7054)) Performance: Faster `fc.stringMatching` on `generate`
- ([PR#7049](https://github.com/dubzzz/fast-check/pull/7049)) Performance: Drop nested `tuple` on `generate` for `fc.record`
- ([PR#7045](https://github.com/dubzzz/fast-check/pull/7045)) Performance: Faster `fc.entityGraph` on `generate`
- ([PR#7071](https://github.com/dubzzz/fast-check/pull/7071)) Performance: Early exit on empty tuple in `fc.entityGraph`
- ([PR#7004](https://github.com/dubzzz/fast-check/pull/7004)) Refactor: Extract code from `onTheFlyLinksForEntityGraph`
- ([PR#7006](https://github.com/dubzzz/fast-check/pull/7006)) Refactor: Move `generate` logic to the `Arbitrary` for `entityGraph`
- ([PR#7007](https://github.com/dubzzz/fast-check/pull/7007)) Refactor: Introduce `ProductionState` for `onTheFlyLinks...`
- ([PR#6990](https://github.com/dubzzz/fast-check/pull/6990)) Script: Skip scripts during `pnpm i` in changelog generation
- ([PR#7039](https://github.com/dubzzz/fast-check/pull/7039)) Script: More benchmark commands
- ([PR#6972](https://github.com/dubzzz/fast-check/pull/6972)) Security: Pass `--ignore-scripts` to `pnpm i` calls
- ([PR#7028](https://github.com/dubzzz/fast-check/pull/7028)) Test: Add benchmarks for key arbitraries
- ([PR#7034](https://github.com/dubzzz/fast-check/pull/7034)) Test: Expand benchmark coverage across arbitrary families
- ([PR#7041](https://github.com/dubzzz/fast-check/pull/7041)) Test: Add runners related benchs
- ([PR#7064](https://github.com/dubzzz/fast-check/pull/7064)) Test: Clarify arbitrary benchmark names
- ([PR#7068](https://github.com/dubzzz/fast-check/pull/7068)) Test: More reliable arbitraries.bench.ts
- ([PR#7088](https://github.com/dubzzz/fast-check/pull/7088)) Typo: Typo in type `EntityGraphContraints`
