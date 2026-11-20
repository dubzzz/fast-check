import * as fc from 'fast-check';

fc.anything({ withUnicodeString: true, stringUnit: 'grapheme' });
