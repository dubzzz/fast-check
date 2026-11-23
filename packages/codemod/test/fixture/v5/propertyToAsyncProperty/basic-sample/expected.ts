import * as fc from 'fast-check';

fc.sample(fc.asyncProperty(fc.nat(), () => true));
