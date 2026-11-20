import { configureGlobal } from 'fast-check';
configureGlobal({
  numRuns: 15,
  reporter: (details) => {
    accept(details);
  },
});
