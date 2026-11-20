import * as fc from 'fast-check';

fc.configureGlobal({ noDefaultPlugins: true });

fc.installGlobalPlugin(fc.defaultReporter({
  includeErrorInReport: true
}), 'post');
