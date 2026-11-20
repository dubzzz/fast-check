import * as fc from 'fast-check';

fc.anything({ withUnicodeString: readFlag(), stringUnit: 'grapheme' });
