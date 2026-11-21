import * as fc from 'fast-check';

// Migrate this custom reporter with v5/runnerPlugins before migrating the default format.
fc.assert(prop, { reporter: log, includeErrorInReport: true });
