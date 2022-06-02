# Examples based on `fast-check`

This directory gathers multiple examples of properties you might come with when using `fast-check`.

Try online with [CodeSandbox](https://codesandbox.io/s/github/dubzzz/fast-check/tree/main/examples?previewwindow=tests).

_Teach yourself property based through examples_

## Examples by category

Following examples show how you could think about properties given algorithms ranging from basic pure functions returning easy to assess outputs to complex state machines.

**Simple data structures**

101 for property based:

- `decompPrime` - Returns the list of prime factors corresponding to the input value
- `fibonacci` - Returns the item at a given position in the sequence of Fibonacci
- `indexOf` - Returns the position of the first occurrence of `pattern` in `text`
- `sort` - Returns a sorted copy of the input array

**Recursive structures**

Let's see how to generate recursive inputs using `letrec`, `memo` or even none of them:

- `isSearchTree` - Returns `true` if the tree is a binary search tree, `false` otherwise

**Misc**

Various algorithms to have more random examples:

- `knight` - Multi dimensional dichotomy given as a coding exercise
- `mazeGenerator` - Maze generator
- `roman` - Convert from and to roman notation for numbers

**State machines to user interfaces**

Property based testing applied to state machines or user interfaces:

- `MusicPlayer` - Simple music player with `play`, `pause`, `addTrack` and `next`

**Race conditions**

Property based testing used to detect race conditions in various kind of JavaScript snippets:

- `AutocompleteField` - An autocomplete field written in React providing suggestions as soon as possible
- `Counter` - Increment a counter stored in a DB - non atomic and atomic versions
- `DebouncedAutocomplete` - An autocomplete field written in React providing suggestions in a debounced way (uses timers)
- `dependencyTree` - Fetch recursively dependencies for a npm package
- `TodoList` - Simple todolist React app
- `UserProfilePage` - A simple React component loading user profile on mount

## Rules of property based

1. Properties do not replace examples, they are just an extra layer of tests
2. Properties can be used at any level: unit, integration, end-to-end

## Tricks to find properties

1. Characteristics independent of the inputs

> Examples:
>
> `for any floating point number d, Math.floor(d) is an integer`
>
> `for any integer n, Math.abs(n) ≥ 0`

2. Characteristics derived from the inputs

> Examples:
>
> `for any a and b integers the average of a and b is between a and b`
>
> `for any array — data, sorted(data) and data contain the same elements`

3. Restricted set of inputs with useful characteristics

> Examples:
>
> `for any prime number p, its decomposition into prime factors is itself`
>
> `for any a, b and c strings the concatenation of a, b and c always contains b`

4. Characteristics on combination of functions

> Examples:
>
> `for any file f, unzip(zip(f)) is the original file`
>
> `for any a, b numbers lcm(a, b) * gcd(a, b) equals a * b`

5. Comparison with a simpler implementation
