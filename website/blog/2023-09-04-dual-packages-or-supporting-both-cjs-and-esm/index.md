---
title: Dual packages or supporting both CJS and ESM
authors: [dubzzz]
tags: [retrospective, maintainer]
---

As library authors and maintainers, hiding the complexity of the build systems and making it as easy as possible for users to utilize our libraries has always been one of our priorities. From Node to the browser, including Deno, we always wanted our users not to struggle too much into using fast-check wherever they want.

The rise of ES Modules was both a relief and a pain. It relieved us of the need to consider multiple delivery targets: Asynchronous Module Definition (AMD), CommonJS (CJS), Universal Module Definition (UMD) and others. Instead there is one to rule them all: ES Modules. But, as the ecosystem was and is still late, we were not able to switch in a snap to an ES Modules world and had to keep CJS.

In this article, we will explore how we publish fast-check to support both CommonJS and ES Modules seamlessly.

<!--truncate-->

## The world before ES Modules

In the early days of JavaScript, it primarily served as a tool for creating small user interactions on web pages. During this period, embedding code directly within HTML files wasn't a significant concern. However, as the use of JavaScript expanded, people started to separate their code into multiple `.js` files to better organize and manage it. But they had to put them into the appropriate order so that dependencies load first, then the code using them. To address this need in the browser, solutions like [Asynchronous Module Definition (AMD)](https://requirejs.org/docs/whyamd.html) emerged. The syntax of AMD is:

```js
requirejs(['dep1', 'dep2'], function (dep1, dep2) {
  // This function is called when dep1.js and dep2.js
  // and their dependencies are loaded.
});
```

On the other hand, Node introduced its own standard known as CommonJS (CJS). In CJS, dependencies were imported using the `require` function:

```js
const dep1 = require('dep1');
const dep2 = require('dep2');
```

For library authors targeting both Node and the browser, this meant providing two versions of their library. Then, ES Modules entered the scene as [the official standard format](https://tc39.github.io/ecma262/#sec-modules) for packaging JavaScript code, aiming to bridge the gap between the browser and Node environments.

However, adopting ES Modules in Node presented some structural challenges and slowed down its support and later its adoption:

- Modules are async by nature
- Modules have to be imported with a clear extension
- Modules have to be declared first

## Towards dual mode

With the first official support of ES Modules in Node 12, we started to investigate how we could make fast-check usable by ES Modules users. At that time, fast-check was already packaged for the browser with IIFE-style (importing the browser file was creating a global object called `fc` on `window`), for ESM via bundlers and for Node in CJS.

Our package definition was something like:

```json
{
  "main": "lib/target-for-node.js",
  "module": "lib/target-for-bundler.js",
  "browser": "lib/target-for-browser.js"
}
```

However, Node only read one field: `main` and as a result, our package was not compatible with ES Modules in Node.

By not being compatible with ES Modules in Node, we somehow block our users to move forward to the next generation of imports. By doing the switch instantly, we force them to move but it would only be feasible if all their dependencies did the same move.

Some libraries like [lodash](https://lodash.com/) come with a version dedicated to ES Modules: [lodash-es](https://www.npmjs.com/package/lodash-es). While it could have been a solution, we rejected it. We wanted our users not to think about that and just import our library whatever the destination and so dual mode came to mind.

## Project structure

We wanted to proclaim: "fast-check is an ES Modules project". But we faced a roadblock because none of our dependencies — be it for building, testing, or other tasks — were ready for ES Modules at that time. Consequently, our package needed to be declared as a CommonJS (CJS) module within our `package.json`:

```json
{
  "type": "commonjs"
}
```

By declaring the type of the package to be CJS, we told to Node that any file with a `.js` extension shoud be read with the CommonJS terminology for us but also for people importing our package.

For dual mode, we have to declare both CJS and ESM files, and not only restrict ourselves to one type. Hopefully, there were multiple ways to achieve that. Among the options, the first one was to go for the extension `.mjs` whenever we want Node to interpret files as ES Modules. While it looked pretty straightforward we were a bit unhappy with using a `.mjs` extension just for the sake of the dual mode. So we looked for other options and found one playing with the nesting of `package.json` files.

```txt
/package.json      ← declares itself with: type=commonjs
/lib
↳ /esm
  ↳ /package.json  ← declares itself with: type=module
```

With that structure, any file within `/lib/esm/` will be considered to be a ES Modules one.

## Package definition

Now that we have established our file structure, the next step is to inform Node, bundlers, and other tools how to interpret our package. To ensure compatibility with old clients and to facilitate a smooth transition, we retained the legacy fields (except the `browser` one) in the root `package.json` and introduced new fields alongside them:

```json title="package.json"
{
  "type": "commonjs",
  "main": "lib/fast-check.js",
  "module": "lib/esm/fast-check.js",
  "exports": {
    "./package.json": "./package.json",
    ".": {
      "require": {
        "types": "./lib/fast-check.d.ts",
        "default": "./lib/fast-check.js"
      },
      "import": {
        "types": "./lib/esm/fast-check.d.ts",
        "default": "./lib/esm/fast-check.js"
      }
    }
  },
  "types": "lib/fast-check.d.ts"
}
```

```json title="lib/esm/package.json"
{
  "type": "module"
}
```

The `exports` field represents the new syntax for declaring the structure of a package. It defines where to locate the relevant sources and how to link them to types. In essence, with recent tooling and support for `exports`, the fields `main`, `module` or `types` seem no longer strictly necessary.

## Package creation

With our file structure and package definition in place, the next step is to generate the actual code and type files for fast-check. As fast-check is a TypeScript project, it means we have to compile it for two targets: CJS and ESM. As a consequence we have to publish twice the code and twice the types.

:::info Type files also follow the CJS/ESM logic
Initially, We attempted to publish only one set of typing files and to reuse it for ESM. Instead of declaring `"types": "./lib/esm/fast-check.d.ts"` in the import part, we just reused the ones of the CJS target by specifying `"types": "./lib/fast-check.d.ts"`. It turned out to be problematic as TypeScript interprets `/lib/fast-check.d.ts` as a typing file linked to a CJS file.

Thanks to [@AndaristRake](https://twitter.com/AndaristRake) for explaining the reasoning behind this logic in [this thread](https://twitter.com/AndaristRake/status/1695549037556949344).
:::

For the typings, we primarily push the same typings twice. There are multiple ways to accomplish this, including copying and pasting the type files or using the `--outDir lib/esm` option with `tsc`.

For the CommonJS target, there aren't any significant blockers or traps. The key is to instruct `tsc` to compile the code using the CommonJS module system with `--module commonjs`.

However, handling the ES Modules target can be a bit trickier, specifically concerning file extensions. ES Modules require imports to specify the exact file extension, which can complicate the TypeScript compilation process. Initially, TypeScript's approach to CJS/ESM cases was unclear. So our solution involved post-processing all generated files to add a `.js` extension to every import statement.

Nowadays, if you build your package using `tsc`, a simple approach is to import TypeScript files with the `.js` extension, like this:

```ts file="my-file.ts"
import { a } from './other-file.js'; // ← it's another TS file but we import it with the JS extension
```

This might seem surprising initially, but by importing the `.js` file, TypeScript understands that it should import the file that will ultimately create the `.js` output, which is the `.ts` file. While this choice might initially appear unconventional, it eliminates the need for custom post-processing steps during the build process.
