import * as fc from 'fast-check';

// Global reporting must be migrated together with its per-run overrides.
fc.configureGlobal({ includeErrorInReport: true });
