import * as fc from 'fast-check';
fc.configureGlobal({ ...fc.readConfigureGlobal(), timeout: 10 });
