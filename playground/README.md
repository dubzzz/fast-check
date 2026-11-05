# fast-check playground

[Open the playground](https://fast-check.dev/new) to try fast-check in your browser with StackBlitz and Vitest UI.
StackBlitz installs the dependencies and starts the tests automatically.
Edit `example.test.js` to try a property or create a minimal reproduction, then save your StackBlitz project to share it.

## Run from the repository

From the repository root:

```sh
pnpm install
pnpm --filter fast-check-playground test:ui
```

To run the playground tests and check its JavaScript types:

```sh
pnpm exec vitest run --project fast-check-playground
pnpm --filter fast-check-playground typecheck
```

The playground is included in the monorepo's test and typecheck runs.
TypeScript checks the JavaScript example and Vitest configuration using `checkJs`, without emitting files.

## Run a standalone copy

Copy this directory outside the repository, then run from that copy:

```sh
npm install
npm run test:ui
```

To run the tests once and check types:

```sh
npm run test:run
npm run typecheck
```

Keep the playground's dependencies and configuration self-contained: StackBlitz imports only this directory.
The local Vitest configuration also prevents standalone runs from loading the monorepo's configuration.

The starter URL is:

<https://stackblitz.com/fork/github/dubzzz/fast-check/tree/main/playground?initialPath=__vitest__/&file=example.test.js>
