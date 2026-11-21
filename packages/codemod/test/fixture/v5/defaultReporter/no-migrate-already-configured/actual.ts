import * as fc from 'fast-check';

fc.assert(prop, { noDefaultPlugins: true, plugins: [fc.defaultReporter()] });
