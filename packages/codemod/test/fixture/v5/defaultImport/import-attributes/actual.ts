import fc, { integer } from 'fast-check' with { custom: 'value' };
import other from 'fast-check';
fc.sample(integer());
other.sample(other.integer());
