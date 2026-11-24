import * as fc from 'fast-check';
import { property } from 'other';

fc.assert(property(fc.nat(), (n) => true));
