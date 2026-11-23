import { asyncProperty, integer } from 'fast-check';

asyncProperty(integer(), async () => true);
