import * as fc from 'fast-check';
fc.assert(prop, { reporter: sync, asyncReporter: asyncReport });
fc.assert(prop, { reporter: (d) => fc.defaultReportMessage(d) });
fc.assert(prop, { reporter: sync, includeErrorInReport: true });
fc.assert(prop, { reporter: sync, noDefaultPlugins: false });
fc.configureGlobal({ reporter: globalHandler });
fc.assert(prop, { asyncReporter: localHandler });
