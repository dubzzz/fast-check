import { assert, nat, property } from 'fast-check';
import { asyncProperty } from 'other';

assert(property(nat(), (n) => true));
