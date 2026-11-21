import { property as build, integer } from 'fast-check';

build(integer(), async () => true);
