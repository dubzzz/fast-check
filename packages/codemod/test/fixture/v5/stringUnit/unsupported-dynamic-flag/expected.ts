import * as fc from 'fast-check';

fc.object({ withUnicodeString: useUnicode() });
