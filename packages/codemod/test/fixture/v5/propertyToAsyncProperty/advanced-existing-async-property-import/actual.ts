import { assert, nat, property, asyncProperty } from 'fast-check';

assert(property(nat(), (n) => true));
