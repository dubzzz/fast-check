import type { Parameters } from 'fast-check';
import * as unrelated from 'other-package';
unrelated.assert(prop, { reporter: custom });
