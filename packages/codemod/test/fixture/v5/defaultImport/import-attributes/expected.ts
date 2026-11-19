import fc, { integer } from 'fast-check' with { custom: 'value' };
import * as other from 'fast-check';
fc.sample(integer());
other.sample(other.integer());
