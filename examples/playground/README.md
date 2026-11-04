# fast-check playground

[Open the playground](https://fast-check.dev/new) to try fast-check in your browser with StackBlitz and Vitest UI.
StackBlitz installs the dependencies and starts the tests automatically.
Edit `example.test.ts` to try a property or create a minimal reproduction, then save your StackBlitz project to share it.

## Run locally

From this directory:

```sh
npm install --workspaces=false
npm run test:ui --workspaces=false
```

To run the tests once:

```sh
npm run test:run --workspaces=false
```

This directory is a standalone project using the published npm version of fast-check.
Keep its dependencies and configuration self-contained: StackBlitz imports only this directory.
The local Vitest configuration also prevents the playground from loading the monorepo's configuration when run locally.

The starter URL is:

<https://stackblitz.com/fork/github/dubzzz/fast-check/tree/main/examples/playground?initialPath=__vitest__/&file=example.test.ts>
