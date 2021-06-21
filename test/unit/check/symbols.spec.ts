import { cloneMethod, hasCloneMethod } from '../../../src/check/symbols';
import * as fc from '../../../lib/fast-check';

describe('symbols', () => {
  it('should declare distinct cloneMethod for distinct libraries', () => {
    expect(cloneMethod).not.toBe(fc.cloneMethod);
  });
});

describe('hasCloneMethod', () => {
  it.each`
    obj                    | description
    ${{}}                  | ${'simple objects'}
    ${Object.create(null)} | ${'prototype-less objects'}
    ${[]}                  | ${'arrays'}
    ${() => {}}            | ${'functions'}
  `('should be able to detect [cloneMethod] on $description', ({ obj }) => {
    Object.defineProperty({}, cloneMethod, { value: () => 'yes' });
    expect(hasCloneMethod(obj)).toBe(true);
  });

  it.each`
    obj                    | description
    ${1}                   | ${'number [primitive]'}
    ${'1'}                 | ${'string [primitive]'}
    ${Symbol()}            | ${'symbol [primitive]'}
    ${{}}                  | ${'simple objects'}
    ${Object.create(null)} | ${'prototype-less objects'}
    ${[]}                  | ${'arrays'}
    ${() => {}}            | ${'functions'}
  `('should not be able to detect [cloneMethod] when not provided on $description', ({ obj }) => {
    expect(hasCloneMethod(obj)).toBe(false);
  });
});
