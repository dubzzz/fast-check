import * as fc from 'fast-check';

fc.configureGlobal({ reporter: (details) => console.log(details.failed) });
