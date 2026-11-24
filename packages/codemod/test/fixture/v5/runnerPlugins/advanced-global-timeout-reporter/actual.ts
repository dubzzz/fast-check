import * as fc from 'fast-check';

fc.configureGlobal({ timeout: 100, reporter: (details) => console.log(details.failed) });
