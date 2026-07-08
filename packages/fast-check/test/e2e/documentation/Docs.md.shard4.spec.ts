import { declareDocsMdTests } from './DocsMd.js';

// The snippets are sharded over several spec files so that Vitest can run them on distinct workers,
// see DocsMd.ts for more details
declareDocsMdTests(3, 4);
