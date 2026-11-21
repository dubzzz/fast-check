import * as fc from 'fast-check';

// The later spread can override the Unicode flag or supply its own stringUnit.
fc.json({ noUnicodeString: false, ...options });
