# 2.19.0

_Move to next generation of properties and unlock shrink on user definable examples_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.19.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.18.0...v2.19.0)]

## Features

- ([PR#2391](https://github.com/dubzzz/fast-check/pull/2391)) Automatically shrink user defined examples
- ([PR#2393](https://github.com/dubzzz/fast-check/pull/2393)) Support shrink on examples with unshrinkable parts
- ([PR#2395](https://github.com/dubzzz/fast-check/pull/2395)) Better shrinker for arrays requested minLength
- ([PR#2423](https://github.com/dubzzz/fast-check/pull/2423)) Make fixed sized arrays as biased as tuples

## Fixes

- ([PR#2371](https://github.com/dubzzz/fast-check/pull/2371)) Refactor: Declare API and converters for the next gen property
- ([PR#2372](https://github.com/dubzzz/fast-check/pull/2372)) Refactor: Migrate runners to rely on next gen properties
- ([PR#2373](https://github.com/dubzzz/fast-check/pull/2373)) Refactor: Migrate UnbiasedProperty to next gen property
- ([PR#2374](https://github.com/dubzzz/fast-check/pull/2374)) Refactor: Migrate IgnoreEqualValuesProperty to next gen property
- ([PR#2375](https://github.com/dubzzz/fast-check/pull/2375)) Refactor: Migrate TimeoutProperty to next gen property
- ([PR#2376](https://github.com/dubzzz/fast-check/pull/2376)) Refactor: Migrate SkipAfterProperty to next gen property
- ([PR#2387](https://github.com/dubzzz/fast-check/pull/2387)) Refactor: Produce next gen properties via decorateProperty
- ([PR#2388](https://github.com/dubzzz/fast-check/pull/2388)) Refactor: Migrate property builders to produce next gen
- ([PR#2377](https://github.com/dubzzz/fast-check/pull/2377)) Typo: Typo in error thrown when invalid arguments passed to frequency
- ([PR#2394](https://github.com/dubzzz/fast-check/pull/2394)) Bug: Properly re-wrap values on shrink in properties
- ([PR#2399](https://github.com/dubzzz/fast-check/pull/2399)) Test: Ensure correct min/max for float32/64Arrays in tests
- ([PR#2402](https://github.com/dubzzz/fast-check/pull/2402)) Test: Reduce the maximal minLength requested in tests
- ([PR#2415](https://github.com/dubzzz/fast-check/pull/2415)) Refactor: Update the way we use flags for mixedCase
- ([PR#2416](https://github.com/dubzzz/fast-check/pull/2416)) Refactor: Do not favor numeric values over others in json arbitraries
- ([PR#2403](https://github.com/dubzzz/fast-check/pull/2403)) Test: Better asserts of shrinks by going deeper in path
- ([PR#2417](https://github.com/dubzzz/fast-check/pull/2417)) Bug: Unmapper function of hexa was not unmapping properly
- ([PR#2421](https://github.com/dubzzz/fast-check/pull/2421)) Bug: Accept already cloneable values as output of .map
- ([PR#2424](https://github.com/dubzzz/fast-check/pull/2424)) CI: Run tests with verbose flag enabled
- ([PR#2426](https://github.com/dubzzz/fast-check/pull/2426)) Doc: Document shrink of user definable values
- ([PR#2427](https://github.com/dubzzz/fast-check/pull/2427)) Test: Stop flakiness on legacy tests of float/double

---

# 2.18.1

_Fix regression when mapper returns an already cloneable value_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.18.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.18.0...v2.18.1)]

## Fixes

- ([PR#2421](https://github.com/dubzzz/fast-check/pull/2421)) Bug: Accept already cloneable values as output of `.map`

# 2.18.0

_All built-ins arbitraries rely on the new API and most of them can now shrink user-definable values_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.18.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.17.0...v2.18.0)]

## Features

- ([PR#2031](https://github.com/dubzzz/fast-check/pull/2031)) Add built-in unmapper support onto uuid and uuidV
- ([PR#2035](https://github.com/dubzzz/fast-check/pull/2035)) Add built-in unmapper support onto domain
- ([PR#2036](https://github.com/dubzzz/fast-check/pull/2036)) Add built-in unmapper support onto emailAddress
- ([PR#2037](https://github.com/dubzzz/fast-check/pull/2037)) Add built-in unmapper support onto webAuthority
- ([PR#2056](https://github.com/dubzzz/fast-check/pull/2056)) Add built-in unmapper support onto webUrl
- ([PR#2089](https://github.com/dubzzz/fast-check/pull/2089)) Add built-in unmapper support onto object arbitraries
- ([PR#2199](https://github.com/dubzzz/fast-check/pull/2199)) Add built-in unmapper support onto float
- ([PR#2200](https://github.com/dubzzz/fast-check/pull/2200)) Add built-in unmapper support onto double
- ([PR#2204](https://github.com/dubzzz/fast-check/pull/2204)) Add built-in unmapper support onto typed-arrays
- ([PR#2309](https://github.com/dubzzz/fast-check/pull/2309)) Lighter implementation for anything arbitrary
- ([PR#2318](https://github.com/dubzzz/fast-check/pull/2318)) Implement unmapping for sparseArray
- ([PR#2361](https://github.com/dubzzz/fast-check/pull/2361)) Add umapping capabilities on mixedCase

## Fixes

- ([PR#2262](https://github.com/dubzzz/fast-check/pull/2262)) Bug: Cap auto-maxLength of array to 2\*\*31-1
- ([PR#2359](https://github.com/dubzzz/fast-check/pull/2359)) Bug: Too many keys in the sparse arrays of anything
- ([PR#2256](https://github.com/dubzzz/fast-check/pull/2256)) CI: Check typings against RC releases of TypeScript
- ([PR#2087](https://github.com/dubzzz/fast-check/pull/2087)) Doc: Clarify the case of -0 on jsonObject and unicodeJsonObject
- ([PR#2237](https://github.com/dubzzz/fast-check/pull/2237)) Doc: stringify then parse in code example
- ([PR#2308](https://github.com/dubzzz/fast-check/pull/2308)) Doc: Use predicate instead of property to define a property
- ([PR#2368](https://github.com/dubzzz/fast-check/pull/2368)) Doc: Update contributing guide
- ([PR#2032](https://github.com/dubzzz/fast-check/pull/2032)) Move: Move web arbitraries into /arbitrary
- ([PR#2033](https://github.com/dubzzz/fast-check/pull/2033)) Move: Move text escapers into internals of /arbitrary
- ([PR#2034](https://github.com/dubzzz/fast-check/pull/2034)) Move: Move sparseArray arbitrary into /arbitrary
- ([PR#2085](https://github.com/dubzzz/fast-check/pull/2085)) Move: Move object arbitraries into /arbitrary
- ([PR#2090](https://github.com/dubzzz/fast-check/pull/2090)) Move: Move floating point arbitraries into /arbitrary
- ([PR#2154](https://github.com/dubzzz/fast-check/pull/2154)) Move: Move commands arbitrary into /arbitrary
- ([PR#2366](https://github.com/dubzzz/fast-check/pull/2366)) Move: Move and clean tests helpers
- ([PR#2153](https://github.com/dubzzz/fast-check/pull/2153)) Refactor: Migrate commands to NextArbitrary
- ([PR#2150](https://github.com/dubzzz/fast-check/pull/2150)) Refactor: Migrate \*subarray to NextArbitrary
- ([PR#2339](https://github.com/dubzzz/fast-check/pull/2339)) Refactor: Simplify conversion to qualified object's constraints
- ([PR#2177](https://github.com/dubzzz/fast-check/pull/2177)) Script: Add test:debug script for easier debugging
- ([PR#2091](https://github.com/dubzzz/fast-check/pull/2091)) Test: Rewrite tests on next generation of floating point arbitraries
- ([PR#2146](https://github.com/dubzzz/fast-check/pull/2146)) Test: Fix tests on legacy versions of integer
- ([PR#2151](https://github.com/dubzzz/fast-check/pull/2151)) Test: Rework no regressions tests for subarrays
- ([PR#2178](https://github.com/dubzzz/fast-check/pull/2178)) Test: Rewrite tests on subarray
- ([PR#2198](https://github.com/dubzzz/fast-check/pull/2198)) Test: Rewrite tests dealing with typed arrays
- ([PR#2205](https://github.com/dubzzz/fast-check/pull/2205)) Test: Rewrite tests on legacy float/double
- ([PR#2209](https://github.com/dubzzz/fast-check/pull/2209)) Test: Rewrite tests dealing with sparseArray
- ([PR#2210](https://github.com/dubzzz/fast-check/pull/2210)) Test: Rewrite func-related tests
- ([PR#2263](https://github.com/dubzzz/fast-check/pull/2263)) Test: Add some basic tests for array and set
- ([PR#2291](https://github.com/dubzzz/fast-check/pull/2291)) Test: Adapt e2e on scheduler for node 16
- ([PR#2274](https://github.com/dubzzz/fast-check/pull/2274)) Test: Make sure --exactOptionalPropertyTypes is properly handled
- ([PR#2315](https://github.com/dubzzz/fast-check/pull/2315)) Test: Migrate tests of arrayInt64 to new format
- ([PR#2338](https://github.com/dubzzz/fast-check/pull/2338)) Test: Add tests for JSON arbitraries
- ([PR#2360](https://github.com/dubzzz/fast-check/pull/2360)) Test: Move tests on object to new approach
- ([PR#2365](https://github.com/dubzzz/fast-check/pull/2365)) Test: Move tests on mixedCase to new approach
- ([PR#2059](https://github.com/dubzzz/fast-check/pull/2059)) Typo: Invalid HTML element in PureRand.ts
- ([PR#2149](https://github.com/dubzzz/fast-check/pull/2149)) Typo: Remove unused arbitraries from properties in unit-tests
- ([PR#2147](https://github.com/dubzzz/fast-check/pull/2147)) Typo: Clean badly renamed import in integer

---

# 2.17.1

_Fix regression when mapper returns an already cloneable value_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.17.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.17.0...v2.17.1)]

## Fixes

- ([PR#2421](https://github.com/dubzzz/fast-check/pull/2421)) Bug: Accept already cloneable values as output of `.map`

# 2.17.0

_Better typings for `constantFrom` and better support for Promises in `stringify`_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.17.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.16.0...v2.17.0)]

## Features

- ([PR#1969](https://github.com/dubzzz/fast-check/pull/1969)) Enhance typings of constantFrom
- ([PR#1953](https://github.com/dubzzz/fast-check/pull/1953)) Speed-up random by using unsafe methods of pure-rand
- ([PR#1996](https://github.com/dubzzz/fast-check/pull/1996)) Fork paths of array/set in ArrayArbitrary::generate
- ([PR#1984](https://github.com/dubzzz/fast-check/pull/1984)) Async reporters can enrich the output with async data
- ([PR#1972](https://github.com/dubzzz/fast-check/pull/1972)) Enhance stringify on Promise
- ([PR#2006](https://github.com/dubzzz/fast-check/pull/2006)) Support custom\* async serializer in stringify (\*via internal symbol)
- ([PR#2015](https://github.com/dubzzz/fast-check/pull/2015)) Forward the custom toString methods of the underlying commands
- ([PR#2014](https://github.com/dubzzz/fast-check/pull/2014)) Better stringified value for func producing async values
- ([PR#2018](https://github.com/dubzzz/fast-check/pull/2018)) Better stringified value for infiniteStream producing async values
- ([PR#2019](https://github.com/dubzzz/fast-check/pull/2019)) Expose custom to string methods

## Fixes

- ([PR#1997](https://github.com/dubzzz/fast-check/pull/1997)) Bug: Default reporter performed side-effects on the output
- ([PR#2017](https://github.com/dubzzz/fast-check/pull/2017)) Bug: Better detection for objects that could define cloneMethod in `map`
- ([PR#2016](https://github.com/dubzzz/fast-check/pull/2016)) Bug: Safer check for cloneMethod to also support prototype-less objects
- ([PR#1954](https://github.com/dubzzz/fast-check/pull/1954)) CI: Rewrite reaction to comment action using github-script
- ([PR#1981](https://github.com/dubzzz/fast-check/pull/1981)) CI: Drop Node 10 from CI tool-chain
- ([PR#1982](https://github.com/dubzzz/fast-check/pull/1982)) CI: Drop Node 10 from CI tool-chain
- ([PR#1983](https://github.com/dubzzz/fast-check/pull/1983)) CI: Override default version of node in codesandbox with node 14
- ([PR#1951](https://github.com/dubzzz/fast-check/pull/1951)) Doc: Add "Performance" category into the PR template
- ([PR#1970](https://github.com/dubzzz/fast-check/pull/1970)) Doc: Fix wrong format command and add lint fixing command
- ([PR#2005](https://github.com/dubzzz/fast-check/pull/2005)) Doc: Fix typo barely -> nearly
- ([PR#2007](https://github.com/dubzzz/fast-check/pull/2007)) Doc: Prefer more explicit async/await properties in examples/
- ([PR#2001](https://github.com/dubzzz/fast-check/pull/2001)) Refactor: No more use of window for global configuration
- ([PR#2002](https://github.com/dubzzz/fast-check/pull/2002)) Refactor: Build context when building the item itself in ArrayArbitrary

---

# 2.16.1

_Fix regression when mapper returns an already cloneable value_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.16.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.16.0...v2.16.1)]

## Fixes

- ([PR#2421](https://github.com/dubzzz/fast-check/pull/2421)) Bug: Accept already cloneable values as output of `.map`

# 2.16.0

_Performance improvements (+50% in avg compared to 2.14.0, +150% in avg compared to 2.15.0)_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.16.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.15.0...v2.16.0)]

## Features

- ([PR#1943](https://github.com/dubzzz/fast-check/pull/1943)) Try to optimize conversions from/to NextValue
- ([PR#1944](https://github.com/dubzzz/fast-check/pull/1944)) Call generate on the NextArbitrary from Property
- ([PR#1945](https://github.com/dubzzz/fast-check/pull/1945)) Faster generate for constant and constantFrom
- ([PR#1946](https://github.com/dubzzz/fast-check/pull/1946)) Speed-up conversions from/to NextValue
- ([PR#1948](https://github.com/dubzzz/fast-check/pull/1948)) More performant non-cloneable values in NextValue

## Fixes

- ([PR#1947](https://github.com/dubzzz/fast-check/pull/1947)) Test: Escape strings passed to userEvent.type in examples

---

# 2.15.1

_Fix regression when mapper returns an already cloneable value_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.15.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.15.0...v2.15.1)]

## Fixes

- ([PR#2421](https://github.com/dubzzz/fast-check/pull/2421)) Bug: Accept already cloneable values as output of `.map`

# 2.15.0

_New logo, new way to define fully custom arbitraries using `NextArbitrary`_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.15.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.14.0...v2.15.0)]

## Features

- ([PR#1678](https://github.com/dubzzz/fast-check/pull/1678)) Introduce NextArbitrary, new way to define arbitraries
- ([PR#1690](https://github.com/dubzzz/fast-check/pull/1690)) Document and expose clone related methods
- ([PR#1730](https://github.com/dubzzz/fast-check/pull/1730)) Ensure bigint are always instanciated with valid ranges
- ([PR#1750](https://github.com/dubzzz/fast-check/pull/1750)) Add support for cloneable instances in fc.constant and fc.constantFrom
- ([PR#1756](https://github.com/dubzzz/fast-check/pull/1756)) Add support for bias in clone (and dedup)
- ([PR#1758](https://github.com/dubzzz/fast-check/pull/1758)) Add support for bias in mixedCase
- ([PR#1794](https://github.com/dubzzz/fast-check/pull/1794)) Support canGenerate and shrink of user-defined values on map
- ([PR#1799](https://github.com/dubzzz/fast-check/pull/1799)) Implement unmappers for char arbitraries
- ([PR#1632](https://github.com/dubzzz/fast-check/pull/1632)) New logo supports dark mode and fits better within README
- ([PR#1812](https://github.com/dubzzz/fast-check/pull/1812)) Add unmappers for built-in arbitraries on strings
- ([PR#1836](https://github.com/dubzzz/fast-check/pull/1836)) Add built-in unmapper support onto mapToConstant
- ([PR#1838](https://github.com/dubzzz/fast-check/pull/1838)) Add built-in unmapper support onto lorem
- ([PR#1857](https://github.com/dubzzz/fast-check/pull/1857)) Add built-in unmapper support onto dictionary
- ([PR#1866](https://github.com/dubzzz/fast-check/pull/1866)) Add built-in unmapper support onto date
- ([PR#1888](https://github.com/dubzzz/fast-check/pull/1888)) Add built-in unmapper support onto ip
- ([PR#1912](https://github.com/dubzzz/fast-check/pull/1912)) Add built-in unmapper support onto record

## Fixes

- ([PR#1693](https://github.com/dubzzz/fast-check/pull/1693)) Bug: Apply cloneMethod on map/filter instances of Shrinkable
- ([PR#1712](https://github.com/dubzzz/fast-check/pull/1712)) Bug: Shrinker on integers was possibly generating out-of-range values
- ([PR#1713](https://github.com/dubzzz/fast-check/pull/1713)) Bug: canGenerate method on integer should reject -0
- ([PR#1736](https://github.com/dubzzz/fast-check/pull/1736)) Bug: canGenerate of FrequencyArbitrary was not using depth properly
- ([PR#1737](https://github.com/dubzzz/fast-check/pull/1737)) Bug: freq of 0 not considered the same way in constraints-based and simple arg
- ([PR#1755](https://github.com/dubzzz/fast-check/pull/1755)) Bug: infiniteStream was not properly cloning cloneable instances
- ([PR#1759](https://github.com/dubzzz/fast-check/pull/1759)) Bug: Not properly biased mixedCase
- ([PR#1776](https://github.com/dubzzz/fast-check/pull/1776)) Bug: ConstantArbitrary must not shrink towards the first if it is already the first
- ([PR#1780](https://github.com/dubzzz/fast-check/pull/1780)) Bug: clone must use Object.is and check values on canGenerate
- ([PR#1783](https://github.com/dubzzz/fast-check/pull/1783)) Bug: StreamArbitrary should print any value that have been pulled
- ([PR#1784](https://github.com/dubzzz/fast-check/pull/1784)) Bug: Stream.take pull one unneeded value from the source
- ([PR#1787](https://github.com/dubzzz/fast-check/pull/1787)) Bug: SchedulerArbitrary is wrongly cloning the passed Random
- ([PR#1822](https://github.com/dubzzz/fast-check/pull/1822)) Bug: .map should check canGenerate on source before calling shrink
- ([PR#1821](https://github.com/dubzzz/fast-check/pull/1821)) Bug: mixedCase should only call context-based shrinkers for the string
- ([PR#1837](https://github.com/dubzzz/fast-check/pull/1837)) Bug: maxCount of 0 was overriden to 5 in lorem instead of being rejected
- ([PR#1856](https://github.com/dubzzz/fast-check/pull/1856)) Bug: Build reverse-mapping built by mapToConstant for node 10
- ([PR#1910](https://github.com/dubzzz/fast-check/pull/1910)) Bug: Stricter unmapper for dictionary to prevent unmapping unrelated values
- ([PR#1914](https://github.com/dubzzz/fast-check/pull/1914)) Bug: option can now properly shrink without any context (incl. to nil)
- ([PR#1647](https://github.com/dubzzz/fast-check/pull/1647)) CI: Stricter conditions to trigger workflow on push
- ([PR#1663](https://github.com/dubzzz/fast-check/pull/1663)) CI: Stricter conditions to trigger workflow on push
- ([PR#1830](https://github.com/dubzzz/fast-check/pull/1830)) CI: Build against Node 16.x
- ([PR#1760](https://github.com/dubzzz/fast-check/pull/1760)) Clean: Remove duplicated tests for letrec
- ([PR#1892](https://github.com/dubzzz/fast-check/pull/1892)) Clean: Remove unneeded map in record for required keys
- ([PR#1917](https://github.com/dubzzz/fast-check/pull/1917)) Clean: Remove unneeded checks in map for context-less shrink
- ([PR#1664](https://github.com/dubzzz/fast-check/pull/1664)) Doc: Only mark relevant titles as H* in the Readme
- ([PR#1665](https://github.com/dubzzz/fast-check/pull/1665)) Doc: Move back to H2 for titles in the Readme
- ([PR#1697](https://github.com/dubzzz/fast-check/pull/1697)) Doc: Fic grammar
- ([PR#1883](https://github.com/dubzzz/fast-check/pull/1883)) Doc: Rework PR template
- ([PR#1907](https://github.com/dubzzz/fast-check/pull/1907)) Doc: Fix typos in naming for describe on nat
- ([PR#1906](https://github.com/dubzzz/fast-check/pull/1906)) Doc: Update mug.svg to be aligned with logo.svg
- ([PR#1911](https://github.com/dubzzz/fast-check/pull/1911)) Doc: Fit svg to mug.svg
- ([PR#1919](https://github.com/dubzzz/fast-check/pull/1919)) Doc: Fix typo in PR template
- ([PR#1915](https://github.com/dubzzz/fast-check/pull/1915)) Doc: Document how to extend fast-check with NextArbitrary
- ([PR#1920](https://github.com/dubzzz/fast-check/pull/1920)) Doc: Update outdated links in AdvancedArbitraries.md
- ([PR#1709](https://github.com/dubzzz/fast-check/pull/1709)) Move: Move integer arbitraries into /arbitrary
- ([PR#1715](https://github.com/dubzzz/fast-check/pull/1715)) Move: Move bigint arbitraries into /arbitrary
- ([PR#1716](https://github.com/dubzzz/fast-check/pull/1716)) Move: Move array arbitraries into /arbitrary
- ([PR#1727](https://github.com/dubzzz/fast-check/pull/1727)) Move: Move frequency arbitraries into /arbitrary
- ([PR#1739](https://github.com/dubzzz/fast-check/pull/1739)) Move: Move tuple arbitraries into /arbitrary
- ([PR#1743](https://github.com/dubzzz/fast-check/pull/1743)) Move: Move letrec arbitrary into /arbitrary
- ([PR#1744](https://github.com/dubzzz/fast-check/pull/1744)) Move: Move memo arbitrary into /arbitrary
- ([PR#1748](https://github.com/dubzzz/fast-check/pull/1748)) Move: Move constant arbitraries into /arbitrary
- ([PR#1763](https://github.com/dubzzz/fast-check/pull/1763)) Move: Move clone arbitraries into /arbitrary
- ([PR#1761](https://github.com/dubzzz/fast-check/pull/1761)) Move: Move stream arbitraries into /arbitrary
- ([PR#1779](https://github.com/dubzzz/fast-check/pull/1779)) Move: Move mixedCase arbitrary into /arbitrary
- ([PR#1786](https://github.com/dubzzz/fast-check/pull/1786)) Move: Move scheduler arbitrary into /arbitrary
- ([PR#1798](https://github.com/dubzzz/fast-check/pull/1798)) Move: Move char arbitraries into /arbitrary
- ([PR#1801](https://github.com/dubzzz/fast-check/pull/1801)) Move: Move boolean arbitrary into /arbitrary
- ([PR#1802](https://github.com/dubzzz/fast-check/pull/1802)) Move: Move string arbitraries into /arbitrary
- ([PR#1831](https://github.com/dubzzz/fast-check/pull/1831)) Move: Move date arbitrary into /arbitrary
- ([PR#1832](https://github.com/dubzzz/fast-check/pull/1832)) Move: Extract internal mapper into its own file
- ([PR#1834](https://github.com/dubzzz/fast-check/pull/1834)) Move: Move mapToConstant arbitrary into /arbitrary
- ([PR#1835](https://github.com/dubzzz/fast-check/pull/1835)) Move: Move lorem arbitrary into /arbitrary
- ([PR#1839](https://github.com/dubzzz/fast-check/pull/1839)) Move: Move ip arbitraries into /arbitrary
- ([PR#1840](https://github.com/dubzzz/fast-check/pull/1840)) Move: Move dictionary arbitraries into /arbitrary
- ([PR#1887](https://github.com/dubzzz/fast-check/pull/1887)) Move: Move ip arbitraries into /arbitrary
- ([PR#1889](https://github.com/dubzzz/fast-check/pull/1889)) Move: Move typed-arrays arbitraries into /arbitrary
- ([PR#1890](https://github.com/dubzzz/fast-check/pull/1890)) Move: Move record arbitrary into /arbitrary
- ([PR#1691](https://github.com/dubzzz/fast-check/pull/1691)) Refactor: Migrate tuple to NextArbitrary
- ([PR#1701](https://github.com/dubzzz/fast-check/pull/1701)) Refactor: Migrate memo to NextArbitrary
- ([PR#1702](https://github.com/dubzzz/fast-check/pull/1702)) Refactor: Migrate letrec to NextArbitrary
- ([PR#1704](https://github.com/dubzzz/fast-check/pull/1704)) Refactor: Simplify letrec initial construction
- ([PR#1705](https://github.com/dubzzz/fast-check/pull/1705)) Refactor: Migrate integer/bigint/double to NextArbitrary
- ([PR#1706](https://github.com/dubzzz/fast-check/pull/1706)) Refactor: Migrate array/set to NextArbitrary
- ([PR#1707](https://github.com/dubzzz/fast-check/pull/1707)) Refactor: Migrate frequency to NextArbitrary
- ([PR#1714](https://github.com/dubzzz/fast-check/pull/1714)) Refactor: Remove unneeded if-branch in shrinker for integer
- ([PR#1728](https://github.com/dubzzz/fast-check/pull/1728)) Refactor: Remove unneeded if-branch in shrinker for bigint
- ([PR#1740](https://github.com/dubzzz/fast-check/pull/1740)) Refactor: Migrate missing snippets to our new APIs
- ([PR#1742](https://github.com/dubzzz/fast-check/pull/1742)) Refactor: Simplify internal implementation of memo
- ([PR#1746](https://github.com/dubzzz/fast-check/pull/1746)) Refactor: Migrate constant to NextArbitrary
- ([PR#1747](https://github.com/dubzzz/fast-check/pull/1747)) Refactor: Migrate clone to NextArbitrary
- ([PR#1757](https://github.com/dubzzz/fast-check/pull/1757)) Refactor: Migrate infiniteStream to NextArbitrary
- ([PR#1762](https://github.com/dubzzz/fast-check/pull/1762)) Refactor: Migrate scheduler to NextArbitrary
- ([PR#1764](https://github.com/dubzzz/fast-check/pull/1764)) Refactor: Migrate mixedCase to NextArbitrary
- ([PR#1891](https://github.com/dubzzz/fast-check/pull/1891)) Refactor: Always use shared-partial record implementation for record
- ([PR#1918](https://github.com/dubzzz/fast-check/pull/1918)) Refactor: Enforce explicit context-passing for NextArbitrary and related
- ([PR#1916](https://github.com/dubzzz/fast-check/pull/1916)) Rename: Rename canGenerate into canShrinkWithoutContext before 1st release
- ([PR#1668](https://github.com/dubzzz/fast-check/pull/1668)) Test: Add non-regression for filter/map/chain
- ([PR#1669](https://github.com/dubzzz/fast-check/pull/1669)) Test: Add non-regression for context
- ([PR#1694](https://github.com/dubzzz/fast-check/pull/1694)) Test: Add more non-regression tests on recursive structures
- ([PR#1695](https://github.com/dubzzz/fast-check/pull/1695)) Test: Rework testFunc for non-regression tests
- ([PR#1700](https://github.com/dubzzz/fast-check/pull/1700)) Test: Update snapshots for letrec due to migration of tuple
- ([PR#1711](https://github.com/dubzzz/fast-check/pull/1711)) Test: Rewrite tests dealing with integer
- ([PR#1729](https://github.com/dubzzz/fast-check/pull/1729)) Test: Rewrite tests dealing with bigInt
- ([PR#1735](https://github.com/dubzzz/fast-check/pull/1735)) Test: Rewrite tests dealing with frequency
- ([PR#1741](https://github.com/dubzzz/fast-check/pull/1741)) Test: Rewrite tests dealing with tuple
- ([PR#1745](https://github.com/dubzzz/fast-check/pull/1745)) Test: Rewrite tests dealing with letrec
- ([PR#1751](https://github.com/dubzzz/fast-check/pull/1751)) Test: Rewrite tests dealing with constant
- ([PR#1775](https://github.com/dubzzz/fast-check/pull/1775)) Test: FIX Assumptions in tests related to ConstantArbitrary
- ([PR#1781](https://github.com/dubzzz/fast-check/pull/1781)) Test: Rewrite tests dealing with clone
- ([PR#1782](https://github.com/dubzzz/fast-check/pull/1782)) Test: Rewrite tests dealing with infiniteStream
- ([PR#1788](https://github.com/dubzzz/fast-check/pull/1788)) Test: Rewrite tests dealing with scheduler
- ([PR#1881](https://github.com/dubzzz/fast-check/pull/1881)) Test: Adapt inputs for wrongly defined property on date
- ([PR#1886](https://github.com/dubzzz/fast-check/pull/1886)) Test: Fix wrongly written isCorrect in tests on dictionary
- ([PR#1923](https://github.com/dubzzz/fast-check/pull/1923)) Test: Integer spec was asking if integer can produce -0
- ([PR#1922](https://github.com/dubzzz/fast-check/pull/1922)) Test: Reduce duplication of assertions on NextArbitrary

---

# 2.14.0

_Easier recursive strcutures and ability discard already seen runs_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.14.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.13.0...v2.14.0)]

## Features

- ([PR#1581](https://github.com/dubzzz/fast-check/pull/1581)) Reject invalid weights on `fc.frequency`
- ([PR#1598](https://github.com/dubzzz/fast-check/pull/1598)) Add `withCrossShrink` constraint on `fc.frequency`
- ([PR#1586](https://github.com/dubzzz/fast-check/pull/1586))  Add a way to ignore already covered cases
- ([PR#1601](https://github.com/dubzzz/fast-check/pull/1601)) Add `maxDepth` constraint on `fc.frequency`
- ([PR#1602](https://github.com/dubzzz/fast-check/pull/1602)) Stricter checks on args of `fc.frequency`
- ([PR#1603](https://github.com/dubzzz/fast-check/pull/1603)) Add `depthFactor` constraint on `fc.frequency`
- ([PR#1606](https://github.com/dubzzz/fast-check/pull/1606)) Adopt variadic tuples for signatures of tuple
- ([PR#1607](https://github.com/dubzzz/fast-check/pull/1607)) Ability to share depth accross instances
- ([PR#1609](https://github.com/dubzzz/fast-check/pull/1609)) Add recursive constraints on `fc.option`
- ([PR#1611](https://github.com/dubzzz/fast-check/pull/1611)) Add recursive constraints on `fc.oneof`
- ([PR#1624](https://github.com/dubzzz/fast-check/pull/1624)) Mark `fc.genericTuple` as deprecated
- ([PR#1629](https://github.com/dubzzz/fast-check/pull/1629)) Introduce a way to mark equal values as skipped

## Fixes

- ([PR#1493](https://github.com/dubzzz/fast-check/pull/1493)) Bug: `add64` is not supposed to produce negative zeros
- ([PR#1514](https://github.com/dubzzz/fast-check/pull/1514)) Doc: Build status should open actions page filtered on main
- ([PR#1515](https://github.com/dubzzz/fast-check/pull/1515)) Doc: Build status should open builds page filtered on main
- ([PR#1521](https://github.com/dubzzz/fast-check/pull/1521)) Tooling: Enable strict mode in tsconfig
- ([PR#1524](https://github.com/dubzzz/fast-check/pull/1524)) Test: Add CJS/ESM tests using esbuild
- ([PR#1525](https://github.com/dubzzz/fast-check/pull/1525)) CI: Relax check ensuring default seed defined in CI
- ([PR#1534](https://github.com/dubzzz/fast-check/pull/1534)) Test: Fix coverage flakiness on `add64(0, 0)`
- ([PR#1555](https://github.com/dubzzz/fast-check/pull/1555)) Test: Run ESM tests against node 13
- ([PR#1578](https://github.com/dubzzz/fast-check/pull/1578)) Refactor: Rework initialisation phase of `fc.frequency`
- ([PR#1577](https://github.com/dubzzz/fast-check/pull/1577)) Refactor: Rework initialisation phase of `fc.oneof`
- ([PR#1597](https://github.com/dubzzz/fast-check/pull/1597)) Test: Rework tests on frequency
- ([PR#1600](https://github.com/dubzzz/fast-check/pull/1600)) CI: Checkout code before publishing the documentation
- ([PR#1604](https://github.com/dubzzz/fast-check/pull/1604)) Refactor: Re-use `fc.frequency` for `fc.oneof`
- ([PR#1605](https://github.com/dubzzz/fast-check/pull/1605)) Refactor: Re-use `fc.frequency` for `fc.option`
- ([PR#1608](https://github.com/dubzzz/fast-check/pull/1608)) Test: Better errors for isValidValue in helpers
- ([PR#1610](https://github.com/dubzzz/fast-check/pull/1610)) Doc: Add missing annotations and jsdoc
- ([PR#1612](https://github.com/dubzzz/fast-check/pull/1612)) Doc: Better documentation for `fc.letrec`
- ([PR#1613](https://github.com/dubzzz/fast-check/pull/1613)) Doc: Update some `fc.memo` to `fc.letrec`
- ([PR#1625](https://github.com/dubzzz/fast-check/pull/1625)) Fix: Add missing export for `OneOfConstraints`

---

# 2.13.0

_Built-in arbitrary for sparse arrays_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.13.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.12.1...v2.13.0)]

## Features

- ([PR#1443](https://github.com/dubzzz/fast-check/pull/1443)) Support sparse arrays in stringify
- ([PR#1447](https://github.com/dubzzz/fast-check/pull/1447)) Add a new arbitrary for sparse arrays
- ([PR#1451](https://github.com/dubzzz/fast-check/pull/1451)) Add support for sparse arrays in `fc.object`

## Fixes

- ([PR#1452](https://github.com/dubzzz/fast-check/pull/1452)) Bug: Reduce bias towards typed arrays in `fc.object`
- ([PR#1429](https://github.com/dubzzz/fast-check/pull/1429)) CI: Action to publish to Netlify on comment
- ([PR#1430](https://github.com/dubzzz/fast-check/pull/1430)) CI: Rework workflow "Request Deploy Netlify"
- ([PR#1431](https://github.com/dubzzz/fast-check/pull/1431)) CI: Clean old netlify job
- ([PR#1432](https://github.com/dubzzz/fast-check/pull/1432)) CI: Fix skip check for 'Deploy to Netlify'
- ([PR#1433](https://github.com/dubzzz/fast-check/pull/1433)) CI: Fix API calls for octokit in Netlify job
- ([PR#1434](https://github.com/dubzzz/fast-check/pull/1434)) CI: Post reactions for netlify on issue comment
- ([PR#1435](https://github.com/dubzzz/fast-check/pull/1435)) CI: Do not add new lines when adding comit hash in deploy message
- ([PR#1436](https://github.com/dubzzz/fast-check/pull/1436)) CI: Do not add new lines when adding comit hash in deploy message
- ([PR#1441](https://github.com/dubzzz/fast-check/pull/1441)) CI: Add `--strict` option for tests on types
- ([PR#1466](https://github.com/dubzzz/fast-check/pull/1466)) CI: Check typings against more versions of TS
- ([PR#1471](https://github.com/dubzzz/fast-check/pull/1471)) CI: Stop sending e2e coverage into codecov
- ([PR#1214](https://github.com/dubzzz/fast-check/pull/1214)) Clean: Reduce the number of lint warnings
- ([PR#1440](https://github.com/dubzzz/fast-check/pull/1440)) Doc: Add tip regarding "Value depending on another one"
- ([PR#1475](https://github.com/dubzzz/fast-check/pull/1475)) Doc: Document when each feature has been released (jsdoc)
- ([PR#1479](https://github.com/dubzzz/fast-check/pull/1479)) Misc: Rename master into main
- ([PR#1490](https://github.com/dubzzz/fast-check/pull/1490)) Misc: Split changelog by major
- ([PR#1464](https://github.com/dubzzz/fast-check/pull/1464)) Refactor: No special case for sparse arrays without trailing holes and no elements
- ([PR#1442](https://github.com/dubzzz/fast-check/pull/1442)) Test: Add `--strict` option for tests on types
- ([PR#1444](https://github.com/dubzzz/fast-check/pull/1444)) Test: Better coverage for stringify of sparse arrays
- ([PR#1474](https://github.com/dubzzz/fast-check/pull/1474)) Test: Increase numRuns for bias e2e to limit flakiness
- ([PR#1465](https://github.com/dubzzz/fast-check/pull/1465)) Typing: Regression introduced in typings for `record`
- ([PR#1478](https://github.com/dubzzz/fast-check/pull/1478)) Typing: Add missing export for double constraints

---

# 2.12.2

_Fix regression in typings of record_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.12.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.12.1...v2.12.2)]

## Fixes

- ([PR#1478](https://github.com/dubzzz/fast-check/pull/1478)) Typing: Add missing export for double constraints
- ([PR#1465](https://github.com/dubzzz/fast-check/pull/1465)) Typing: Regression introduced in typings for `record`

# 2.12.1

_Avoid unsafe eval_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.12.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.12.0...v2.12.1)]

## Fixes

- ([PR#1408](https://github.com/dubzzz/fast-check/pull/1408)) Bug/Security: Avoid using unsafe-eval in implementation of getGlobal
- ([PR#1389](https://github.com/dubzzz/fast-check/pull/1389)) Doc: Add badge from packagequality.com
- ([PR#1391](https://github.com/dubzzz/fast-check/pull/1391)) Doc: Setup a security policy
- ([PR#1392](https://github.com/dubzzz/fast-check/pull/1392)) Doc: Add a code of conduct
- ([PR#1390](https://github.com/dubzzz/fast-check/pull/1390)) Doc: Add Snyk badge for package quality
- ([PR#1393](https://github.com/dubzzz/fast-check/pull/1393)) Doc: Add semver stability badge
- ([PR#1394](https://github.com/dubzzz/fast-check/pull/1394)) Doc: Remove dependencies related badges
- ([PR#1395](https://github.com/dubzzz/fast-check/pull/1395)) Doc: Correct misspellings & other errors in English

# 2.12.0

_More efficient shrinkers_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.12.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.11.0...v2.12.0)]

## Features

- ([PR#1354](https://github.com/dubzzz/fast-check/pull/1354)) Split internal shrinkNumeric for better performances
- ([PR#1355](https://github.com/dubzzz/fast-check/pull/1355)) Introduce new helper ArbitraryWithContextualShrink
- ([PR#1358](https://github.com/dubzzz/fast-check/pull/1358)) More efficient shrinker for integer
- ([PR#1372](https://github.com/dubzzz/fast-check/pull/1372)) More efficient shrinker for bigint
- ([PR#1377](https://github.com/dubzzz/fast-check/pull/1377)) More efficient shrinker for array
- ([PR#1382](https://github.com/dubzzz/fast-check/pull/1382)) More efficient shrinker for subarray
- ([PR#1383](https://github.com/dubzzz/fast-check/pull/1383)) More efficient shrinker for mixedCase
- ([PR#1384](https://github.com/dubzzz/fast-check/pull/1384)) More efficient shrinker for double

## Fixes

- ([PR#1347](https://github.com/dubzzz/fast-check/pull/1347)) Bug: Legacy float/double should never reach the max specified value
- ([PR#1359](https://github.com/dubzzz/fast-check/pull/1359)) Bug: Calling `shrinkableFor` should never apply contextual shrinker
- ([PR#1350](https://github.com/dubzzz/fast-check/pull/1350)) Clean: Re-generate yarn.lock files
- ([PR#1331](https://github.com/dubzzz/fast-check/pull/1331)) Doc: Deploy temporary documentation and package to Netlify
- ([PR#1352](https://github.com/dubzzz/fast-check/pull/1352)) Doc: Performance impacts of filter
- ([PR#1379](https://github.com/dubzzz/fast-check/pull/1379)) Doc: Only specify a single entryPoint in TypeDoc
- ([PR#1357](https://github.com/dubzzz/fast-check/pull/1357)) Refactor: Re-implement shrinker for integer based on contextual shrinker
- ([PR#1373](https://github.com/dubzzz/fast-check/pull/1373)) Refactor: Re-use contextual shrinker of integer in array
- ([PR#1376](https://github.com/dubzzz/fast-check/pull/1376)) Refactor: Re-use contextual shrinker of integer in commands
- ([PR#1385](https://github.com/dubzzz/fast-check/pull/1385)) Refactor: Extract Stream.of logic for re-use
- ([PR#1387](https://github.com/dubzzz/fast-check/pull/1387)) Refactor: Restructure implementations of ArbitraryWithContextualShrink
- ([PR#1353](https://github.com/dubzzz/fast-check/pull/1353)) Test: Add unit tests for stringify on Regex
- ([PR#1368](https://github.com/dubzzz/fast-check/pull/1368)) Test: Add non-regression tests on shrinking quality
- ([PR#1375](https://github.com/dubzzz/fast-check/pull/1375)) Test: Typings of ArbitraryWithContextualShrink
- ([PR#1380](https://github.com/dubzzz/fast-check/pull/1380)) Test: Typings of constantFrom and chain
- ([PR#1381](https://github.com/dubzzz/fast-check/pull/1381)) Test: Tests on typings should fail with explicit errors
- ([PR#1386](https://github.com/dubzzz/fast-check/pull/1386)) Test: Add tests for ArbitraryWithContextualShrink
- ([PR#1388](https://github.com/dubzzz/fast-check/pull/1388)) Test: Add snapshot tests for new core shrinkers: integer, bigint, arrayInt64

---

# 2.11.1

_Avoid unsafe eval and fix regression in typings of record_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.11.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.11.0...v2.11.1)]

## Fixes

- ([PR#1408](https://github.com/dubzzz/fast-check/pull/1408)) Bug/Security: Avoid using unsafe-eval in implementation of getGlobal
- ([PR#1478](https://github.com/dubzzz/fast-check/pull/1478)) Typing: Add missing export for double constraints
- ([PR#1465](https://github.com/dubzzz/fast-check/pull/1465)) Typing: Regression introduced in typings for `record`

# 2.11.0

_Add support for Symbol properties and ability to mark keys as required in `fc.record`_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.11.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.10.0...v2.11.0)]

## Features

- ([PR#1265](https://github.com/dubzzz/fast-check/pull/1265)) Switch from Object.keys to for..in in record _[reverted]_
- ([PR#1266](https://github.com/dubzzz/fast-check/pull/1266)) Arbitrary records with optional fields
- ([PR#1306](https://github.com/dubzzz/fast-check/pull/1306)) Prefer unique symbols over `Symbol.for` :warning:
- ([PR#1328](https://github.com/dubzzz/fast-check/pull/1328)) Better handling of known symbols with `fc.stringify`
- ([PR#1321](https://github.com/dubzzz/fast-check/pull/1321)) Add support for Symbol keys in record
- ([PR#1327](https://github.com/dubzzz/fast-check/pull/1327)) Properly handle objects with symbols as keys in `fc.stringify`
- ([PR#1329](https://github.com/dubzzz/fast-check/pull/1329)) Throw if non enumerable keys declared in requiredKeys of record

## Fixes

- ([PR#1286](https://github.com/dubzzz/fast-check/pull/1286)) CI: Basic setup for codecov
- ([PR#1287](https://github.com/dubzzz/fast-check/pull/1287)) CI: Only take into account files from src/ in coverage
- ([PR#1289](https://github.com/dubzzz/fast-check/pull/1289)) CI: Remove coveralls from the CI
- ([PR#1290](https://github.com/dubzzz/fast-check/pull/1290)) CI: Remove unused flags in coverage
- ([PR#1296](https://github.com/dubzzz/fast-check/pull/1296)) CI: Comment with links to install the package defined by the PR
- ([PR#1304](https://github.com/dubzzz/fast-check/pull/1304)) CI: Better message for automatic comments
- ([PR#1307](https://github.com/dubzzz/fast-check/pull/1307)) CI: Randomly seed runs in CI (by default)
- ([PR#1269](https://github.com/dubzzz/fast-check/pull/1269)) Doc: Fix typo in AdvancedArbitraries.md
- ([PR#1288](https://github.com/dubzzz/fast-check/pull/1288)) Doc: Switch to codecov in README
- ([PR#1291](https://github.com/dubzzz/fast-check/pull/1291)) Doc: Prefer spaces over tabs in the README (easier to fit in screen)
- ([PR#1268](https://github.com/dubzzz/fast-check/pull/1268)) Test: Switch from (deprecated) tsd to tsc for type checking
- ([PR#1280](https://github.com/dubzzz/fast-check/pull/1280)) Test: Reduce flakiness of array e2e

---

# 2.10.1

_Avoid unsafe eval_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.10.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.10.0...v2.10.1)]

## Fixes

- ([PR#1408](https://github.com/dubzzz/fast-check/pull/1408)) Bug/Security: Avoid using unsafe-eval in implementation of getGlobal
- ([PR#1478](https://github.com/dubzzz/fast-check/pull/1478)) Typing: Add missing export for double constraints

# 2.10.0

_Increase performances of generic operations of arbitraries: map, filter, chain_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.10.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.9.0...v2.10.0)]

## Features

- ([PR#1264](https://github.com/dubzzz/fast-check/pull/1264)) Extract inlined-classes outside of Arbitrary base-class

## Fixes

- ([PR#1260](https://github.com/dubzzz/fast-check/pull/1260)) Test: Better coverage of ArrayInt64 to reduce flakiness in coverage

---

# 2.9.1

_Avoid unsafe eval_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.9.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.9.0...v2.9.1)]

## Fixes

- ([PR#1408](https://github.com/dubzzz/fast-check/pull/1408)) Bug/Security: Avoid using unsafe-eval in implementation of getGlobal
- ([PR#1478](https://github.com/dubzzz/fast-check/pull/1478)) Typing: Add missing export for double constraints

# 2.9.0

_Add arbitraries for typed arrays_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.9.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.8.0...v2.9.0)]

## Features

- ([PR#1210](https://github.com/dubzzz/fast-check/pull/1210)) Wider defaults for numbers in objects
- ([PR#1212](https://github.com/dubzzz/fast-check/pull/1212)) Add typed arrays arbitraries
- ([PR#1237](https://github.com/dubzzz/fast-check/pull/1237)) Add option withTypedArray to `fc.object` and `fc.anything`

## Fixes

- ([PR#1231](https://github.com/dubzzz/fast-check/pull/1231)) CI: Split test task into two tasks: one for units, another for e2e
- ([PR#1232](https://github.com/dubzzz/fast-check/pull/1232)) CI: Run E2E tests on multiple platforms
- ([PR#1243](https://github.com/dubzzz/fast-check/pull/1243)) CI: Add github-actions to dependabot list
- ([PR#1230](https://github.com/dubzzz/fast-check/pull/1230)) Test: Reduce flakyness of object boxing coverage
- ([PR#1233](https://github.com/dubzzz/fast-check/pull/1233)) Test: Wrongly defined test for 'Should box any number'
- ([PR#1236](https://github.com/dubzzz/fast-check/pull/1236)) Test: Safer URL validation in our web urls e2e tests
- ([PR#1238](https://github.com/dubzzz/fast-check/pull/1238)) Test: Add legacy tests for typed arrays
- ([PR#1250](https://github.com/dubzzz/fast-check/pull/1250)) Test: Increase stability of e2e on floatNext/doubleNext
- ([PR#1251](https://github.com/dubzzz/fast-check/pull/1251)) Test: Add more tests for fc.anything to reduce coverage flakiness

---

# 2.8.1

_Avoid unsafe eval_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.8.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.8.0...v2.8.1)]

## Fixes

- ([PR#1408](https://github.com/dubzzz/fast-check/pull/1408)) Bug/Security: Avoid using unsafe-eval in implementation of getGlobal
- ([PR#1478](https://github.com/dubzzz/fast-check/pull/1478)) Typing: Add missing export for double constraints

# 2.8.0

_New opt-in implementation for fc.float and fc.double_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.8.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.7.0...v2.8.0)]

## Features

- ([PR#1040](https://github.com/dubzzz/fast-check/pull/1040)) New opt-in implementation for `fc.float`
- ([PR#1185](https://github.com/dubzzz/fast-check/pull/1185)) Move NaN as an extreme value for floatNext
- ([PR#1187](https://github.com/dubzzz/fast-check/pull/1187)) New opt-in implementation for `fc.double`

## Fixes

- ([PR#1190](https://github.com/dubzzz/fast-check/pull/1190)) CI: Check CJS/ESM against node 12.20
- ([PR#1161](https://github.com/dubzzz/fast-check/pull/1161)) Doc: Show examples for `fc.__version` and `fc.__commitHash`
- ([PR#1128](https://github.com/dubzzz/fast-check/pull/1128)) Doc: Add link to ReScript bindings
- ([PR#1173](https://github.com/dubzzz/fast-check/pull/1173)) Test: Add more tests on biasNumeric
- ([PR#1182](https://github.com/dubzzz/fast-check/pull/1182)) Test: Better error reporting with `isValidArbitrary`
- ([PR#1184](https://github.com/dubzzz/fast-check/pull/1184)) Test: Pass the original `seed` to callbacks of `isValidArbitrary`
- ([PR#1183](https://github.com/dubzzz/fast-check/pull/1183)) Test: Wrongly defined `isStrictlySmallerValue` for `floatNext`
- ([PR#1186](https://github.com/dubzzz/fast-check/pull/1186)) Test: Wrongly defined `isStrictlySmallerValue` for `floatNext` (2)
- ([PR#1199](https://github.com/dubzzz/fast-check/pull/1199)) Test: Invalid checks to compare zeros in tests of `fc.float(Next)`
- ([PR#1207](https://github.com/dubzzz/fast-check/pull/1207)) Test: More stable coverage for floatNext
- ([PR#1211](https://github.com/dubzzz/fast-check/pull/1211)) Test: Add missing legacy tests for node 8 on next floats and others
- ([PR#1213](https://github.com/dubzzz/fast-check/pull/1213)) Test: Add some more tests for ArrayInt64 for coverage stability

---

# 2.7.1

_Avoid unsafe eval_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.7.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.7.0...v2.7.1)]

## Fixes

- ([PR#1408](https://github.com/dubzzz/fast-check/pull/1408)) Bug/Security: Avoid using unsafe-eval in implementation of getGlobal

# 2.7.0

_Better bias for integers and any derived arbitraries_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.7.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.6.1...v2.7.0)]

## Features

- ([PR#1020](https://github.com/dubzzz/fast-check/pull/1020)) Faster implementation for set
- ([PR#1034](https://github.com/dubzzz/fast-check/pull/1034)) Stricter limits on email arbitrary
- ([PR#1035](https://github.com/dubzzz/fast-check/pull/1035)) Stricter limits on domain arbitrary :warning:
- ([PR#1160](https://github.com/dubzzz/fast-check/pull/1160)) Add commit hash into the generated package (see `fc.__commitHash`)
- ([PR#1149](https://github.com/dubzzz/fast-check/pull/1149)) Bias towards extreme values for integer and bigint :warning:

## Fixes

- ([PR#1112](https://github.com/dubzzz/fast-check/pull/1112)) Bug: Constraints on `fc.date` might be wrongly applied
- ([PR#1139](https://github.com/dubzzz/fast-check/pull/1139)) Bug: Bump pure-rand to fix large integers
- ([PR#1085](https://github.com/dubzzz/fast-check/pull/1085)) CI: Check package's compatibility against latest node
- ([PR#1086](https://github.com/dubzzz/fast-check/pull/1086)) CI: Add Skypack package score during tests
- ([PR#1155](https://github.com/dubzzz/fast-check/pull/1155)) CI: No more Travis CI, switch to GitHub actions - ([PR#1155](https://github.com/dubzzz/fast-check/pull/1155), [PR#1156](https://github.com/dubzzz/fast-check/pull/1156), [PR#1157](https://github.com/dubzzz/fast-check/pull/1157), [PR#1158](https://github.com/dubzzz/fast-check/pull/1158))
- ([PR#1159](https://github.com/dubzzz/fast-check/pull/1159)) CI: Faster installs from production bundles
- ([PR#1097](https://github.com/dubzzz/fast-check/pull/1097)) Typo: Fix typo in Tips.md
- ([PR#1140](https://github.com/dubzzz/fast-check/pull/1140)) Tool: Clean warnings related to ts-jest

---

# 2.6.1

_Wrongly typed `fc.record`_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.6.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.6.0...v2.6.1)]

## Fixes

- ([PR#1142](https://github.com/dubzzz/fast-check/pull/1142)) Typings: Wrongly typed `fc.record`

# 2.6.0

_Towards a uniform way to constrain arbitraries - step 3: number arbitraries_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.6.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.5.0...v2.6.0)]

## Features

- ([PR#1067](https://github.com/dubzzz/fast-check/pull/1067)) Unify signatures on arbitraries: fc.bigInt and fc.bigUint (see [#992](https://github.com/dubzzz/fast-check/issues/992))
- ([PR#1068](https://github.com/dubzzz/fast-check/pull/1068)) Unify signatures on arbitraries: fc.float and fc.double (see [#992](https://github.com/dubzzz/fast-check/issues/992))
- ([PR#1076](https://github.com/dubzzz/fast-check/pull/1076)) Unify signatures on arbitraries: fc.integer and fc.nat (see [#992](https://github.com/dubzzz/fast-check/issues/992))
- ([PR#1080](https://github.com/dubzzz/fast-check/pull/1080)) Mark old signatures as deprecated (see [#992](https://github.com/dubzzz/fast-check/issues/992))

---

# 2.5.1

_Wrongly typed `fc.record`_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.5.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.5.0...v2.5.1)]

## Fixes

- ([PR#1142](https://github.com/dubzzz/fast-check/pull/1142)) Typings: Wrongly typed `fc.record`

# 2.5.0

_Towards a uniform way to constrain arbitraries - step 2: remaining arbitraries except number related ones_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.5.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.4.0...v2.5.0)]

## Features

- ([PR#1023](https://github.com/dubzzz/fast-check/pull/1023)) Unify signatures on arbitraries: fc.\*\[jJ\]son\* (see [#992](https://github.com/dubzzz/fast-check/issues/992))
- ([PR#1026](https://github.com/dubzzz/fast-check/pull/1026)) Unify signatures on arbitraries: fc.lorem (see [#992](https://github.com/dubzzz/fast-check/issues/992))
- ([PR#1063](https://github.com/dubzzz/fast-check/pull/1063)) Rename fc.dedup into fc.clone (older name has been deprecated for the moment)
- ([PR#1065](https://github.com/dubzzz/fast-check/pull/1065)) Add withDate option on fc.object

## Fixes

- ([PR#1022](https://github.com/dubzzz/fast-check/pull/1022)) Tool: Script udate:examples should not fail on updates
- ([PR#1024](https://github.com/dubzzz/fast-check/pull/1024)) Doc: Support fc.option in codemod for [#992](https://github.com/dubzzz/fast-check/issues/992)
- ([PR#1025](https://github.com/dubzzz/fast-check/pull/1025)) Doc: Support fc.commands in codemod for [#992](https://github.com/dubzzz/fast-check/issues/992)

---

# 2.4.1

_Wrongly typed `fc.record`_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.4.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.4.0...v2.4.1)]

## Fixes

- ([PR#1142](https://github.com/dubzzz/fast-check/pull/1142)) Typings: Wrongly typed `fc.record`

# 2.4.0

_Towards a uniform way to constrain arbitraries - step 1: array-like arbitraries_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.4.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.3.0...v2.4.0)]

## Features

- ([PR#954](https://github.com/dubzzz/fast-check/pull/954)) Stringify supports typed arrays and buffers
- ([PR#973](https://github.com/dubzzz/fast-check/pull/973)) Clean unneeded lines on toString for function arbitraries
- ([PR#986](https://github.com/dubzzz/fast-check/pull/986)) Unify signatures on arbitraries: fc.array (see [#992](https://github.com/dubzzz/fast-check/issues/992)) :warning:
- ([PR#988](https://github.com/dubzzz/fast-check/pull/988)) Unify signatures on arbitraries: fc.set (see [#992](https://github.com/dubzzz/fast-check/issues/992))
- ([PR#1010](https://github.com/dubzzz/fast-check/pull/1010)) Unify signatures on arbitraries: fc.\*string (see [#992](https://github.com/dubzzz/fast-check/issues/992)) :warning:
- ([PR#1011](https://github.com/dubzzz/fast-check/pull/1011)) Unify signatures on arbitraries: fc.\*subarray (see [#992](https://github.com/dubzzz/fast-check/issues/992))

## Fixes

- ([PR#975](https://github.com/dubzzz/fast-check/pull/975)) Doc: Add runkit code example
- ([PR#992](https://github.com/dubzzz/fast-check/pull/992)) Doc: Add automatic simplification of min and max in codemod for [#992](https://github.com/dubzzz/fast-check/issues/992)
- ([PR#993](https://github.com/dubzzz/fast-check/pull/993)) Fix: Do not depreciate overloads for array-like (yet)
- ([PR#1012](https://github.com/dubzzz/fast-check/pull/1012)) Fix: Adopt a safer signature recognition on array and set 
- ([PR#1014](https://github.com/dubzzz/fast-check/pull/1014)) Test: Ensure old non-unified syntaxes still work
- ([PR#991](https://github.com/dubzzz/fast-check/pull/991)) Tool: Fix .prettierignore
- ([PR#976](https://github.com/dubzzz/fast-check/pull/976)) Typo: Use WebUrlConstraints instead of an inlined typing for webUrl

---

# 2.3.1

_Wrongly typed `fc.record`_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.3.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.3.0...v2.3.1)]

## Fixes

- ([PR#1142](https://github.com/dubzzz/fast-check/pull/1142)) Typings: Wrongly typed `fc.record`

# 2.3.0

_Add global beforeEach and afterEach hooks_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.3.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.2.1...v2.3.0)]

## Features

- ([PR#900](https://github.com/dubzzz/fast-check/pull/900)) Add global beforeEach/afterEach hooks

## Fixes

- ([PR#970](https://github.com/dubzzz/fast-check/pull/970)) Doc: Rewrite the documentation to better target JavaScript users

---

# 2.2.2

_Wrongly typed `fc.record`_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.2.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.2.1...v2.2.2)]

## Fixes

- ([PR#1142](https://github.com/dubzzz/fast-check/pull/1142)) Typings: Wrongly typed `fc.record`

# 2.2.1

_Fix infinite loop in `fc.date` when passing a NaN date_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.2.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.2.0...v2.2.1)]

## Fixes

- ([PR#938](https://github.com/dubzzz/fast-check/pull/938)) Bug: Fix NaN passed to max in `fc.date()`
- ([PR#936](https://github.com/dubzzz/fast-check/pull/936)) Doc: Switch to typedoc for the API Reference
- ([PR#939](https://github.com/dubzzz/fast-check/pull/939)) Doc: Rename 'Documentation' badge into 'API Reference'
- ([PR#948](https://github.com/dubzzz/fast-check/pull/948)) Doc: Mark TypeScript as an optional requirement in the README
- ([PR#919](https://github.com/dubzzz/fast-check/pull/919)) Test: Reduce coverage flakiness on `HostArbitrary.ts`

# 2.2.0

_Export missing typings and various cleaning around the tsdoc_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.2.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.1.0...v2.2.0)]

## Features

- ([PR#880](https://github.com/dubzzz/fast-check/pull/880)) Publish missing constraints types (option, scheduler)
- ([PR#881](https://github.com/dubzzz/fast-check/pull/881)) Add an interface to better type (Async)Property
- ([PR#902](https://github.com/dubzzz/fast-check/pull/902)) Standardize exported typings and add missing ones :warning:
- ([PR#906](https://github.com/dubzzz/fast-check/pull/906)) Prefer interfaces and functions for exported entities

## Fixes

- ([PR#904](https://github.com/dubzzz/fast-check/pull/904)) Bug: Asynchrorous properties should be able to use `asyncReporter`
- ([PR#850](https://github.com/dubzzz/fast-check/pull/850)) CI: Ignore fast-check bumps for some directories
- ([PR#872](https://github.com/dubzzz/fast-check/pull/872)) CI: Slow down dependabot frequency
- ([PR#879](https://github.com/dubzzz/fast-check/pull/879)) CI: Remove unneeded before_install step on .travis.yml
- ([PR#882](https://github.com/dubzzz/fast-check/pull/882)) CI: Apply post-build script before generating the doc
- ([PR#903](https://github.com/dubzzz/fast-check/pull/903)) CI: Break CI whenever documentation compiles with warnings
- ([PR#905](https://github.com/dubzzz/fast-check/pull/905)) CI: Enable protobot-stale
- ([PR#873](https://github.com/dubzzz/fast-check/pull/873)) Doc: Remove snyk badge
- ([PR#878](https://github.com/dubzzz/fast-check/pull/878)) Doc: Fix some of the warnings raised by API Extractor
- ([PR#883](https://github.com/dubzzz/fast-check/pull/883)) Doc: Update the template for new Pull Requests
- ([PR#894](https://github.com/dubzzz/fast-check/pull/894)) Doc: Fix warnings related to invalid references raised by api-extractor
- ([PR#907](https://github.com/dubzzz/fast-check/pull/907)) Doc: Fix examples leaking in to functions table
- ([PR#908](https://github.com/dubzzz/fast-check/pull/908)) Doc: Document non-documented sections
- ([PR#911](https://github.com/dubzzz/fast-check/pull/911)) Doc: Remove useless "fast-check#" prefix in @link
- ([PR#848](https://github.com/dubzzz/fast-check/pull/848)) Test: Do not use `@testing-library/dom` directly in `examples/`
- ([PR#851](https://github.com/dubzzz/fast-check/pull/851)) Test: Reduce coverage flakiness on `ReplayPath.ts`
- ([PR#874](https://github.com/dubzzz/fast-check/pull/874)) Test: Reduce coverage flakiness on `hash.ts`
- ([PR#893](https://github.com/dubzzz/fast-check/pull/893)) Tool: Add script to serve the generated documentation locally

---

# 2.1.0

_Better reported errors for `func`, `compareFunc` and `compareBooleanFunc`_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.1.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.0.0...v2.1.0)]

## Features

- ([PR#843](https://github.com/dubzzz/fast-check/pull/843)) Report a valid `function` on `func` and `compareFunc`
- ([PR#844](https://github.com/dubzzz/fast-check/pull/844)) Export internal `hash` function
- ([PR#845](https://github.com/dubzzz/fast-check/pull/845)) Rewrite `hash` without using node specific APIs

## Fixes

- ([PR#833](https://github.com/dubzzz/fast-check/pull/833)) CI: Enable CodeQL Analysis
- ([PR#837](https://github.com/dubzzz/fast-check/pull/837)) Clean: Remove usages of `!` operator in `ObjectArbitrary`
- ([PR#838](https://github.com/dubzzz/fast-check/pull/838)) Clean: Remove custom implementation of `Array.prototype.find`
- ([PR#816](https://github.com/dubzzz/fast-check/pull/816)) Doc: Fix typos in migration guide
- ([PR#846](https://github.com/dubzzz/fast-check/pull/846)) Doc: Update links for `pika.dev` to `skypack.dev`
- ([PR#819](https://github.com/dubzzz/fast-check/pull/819)) Test: Better test coverage for `fc.option`
- ([PR#818](https://github.com/dubzzz/fast-check/pull/818)) Test: Reduce flakiness of coverage

---

# 2.0.0

_Hybrid and full support for both ES Modules and CommonJS_
[[Code](https://github.com/dubzzz/fast-check/tree/v2.0.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.26.0...v2.0.0)]

This new major of fast-check is:
- **lighter**: 906kB with 385 files to 505kB with 287 files
- **faster**: takes between -15% (sync) to -40% (async) less time to run properties ([more](https://github.com/dubzzz/fast-check/pull/748))
- **es-module** compatible: can be executed with `type:module`

## Breaking changes

- ([PR#748](https://github.com/dubzzz/fast-check/pull/748)) Drop support for old runtimes of JavaScript, requirements: node>=8 and ES2017+
- ([PR#747](https://github.com/dubzzz/fast-check/pull/747)) Better typings of `fc.constantFrom`
- ([PR#749](https://github.com/dubzzz/fast-check/pull/749)) Remove depreciated `with_deleted_keys` on `fc.record`
- ([PR#750](https://github.com/dubzzz/fast-check/pull/750)) Drop support for TypeScript <3.2
- ([PR#751](https://github.com/dubzzz/fast-check/pull/751)) Strip internal code at build time
- ([PR#753](https://github.com/dubzzz/fast-check/pull/753)) Bump `pure-rand` package to use its hybrid build
- ([PR#755](https://github.com/dubzzz/fast-check/pull/755)) Replace namespace `ObjectConstraints` by an type
- ([PR#752](https://github.com/dubzzz/fast-check/pull/752)) Support ES Modules and CommonJS
- ([PR#756](https://github.com/dubzzz/fast-check/pull/756)) Drop browser build

*You may refer to our migration guide in case of issue: https://github.com/dubzzz/fast-check/blob/main/MIGRATION_1.X_TO_2.X.md*

## Fixes

- ([PR#752](https://github.com/dubzzz/fast-check/pull/752)) Doc: Update compatibility table
- ([PR#730](https://github.com/dubzzz/fast-check/pull/730)) Test: Reproducible tests by adding missing lockfiles
