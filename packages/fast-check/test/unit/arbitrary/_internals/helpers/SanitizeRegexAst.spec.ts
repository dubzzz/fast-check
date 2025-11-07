import { describe, it, expect } from 'vitest';
import { addMissingDotStar } from '../../../../../src/arbitrary/_internals/helpers/SanitizeRegexAst';
import { tokenizeRegex } from '../../../../../src/arbitrary/_internals/helpers/TokenizeRegex';

describe('addMissingDotStar', () => {
  it.each`
    source              | target
    ${/a/}              | ${/(?:^.*a.*$)/}
    ${/abc/}            | ${/(?:^.*a)b(?:c.*$)/}
    ${/[a-z]/}          | ${/(?:^.*[a-z].*$)/}
    ${/a|b/}            | ${/(?:^.*a.*$)|(?:^.*b.*$)/}
    ${/(a)/}            | ${/(?:^.*(a).*$)/}
    ${/(a|b)/}          | ${/((?:^.*a.*$)|(?:^.*b.*$))/ /* original group altered */}
    ${/(a|^b$)/}        | ${/((?:^.*a.*$)|^b$)/ /* original group altered */}
    ${/(^|b)a($|c)/}    | ${/(^|(?:^.*b))a($|(?:c.*$))/ /* original group altered */}
    ${/(?<toto>a)/}     | ${/(?:^.*(?<toto>a).*$)/}
    ${/(^|\s)a+(\s|$)/} | ${/(^|(?:^.*\s))a+((?:\s.*$)|$)/}
  `('should transform $source into $target', ({ source, target }) => {
    const sourceAst = tokenizeRegex(source);
    const targetAst = tokenizeRegex(target);

    const transformedSourceAst = addMissingDotStar(sourceAst);
    expect(transformedSourceAst).toEqual(targetAst);

    const twiceTransformedSourceAst = addMissingDotStar(transformedSourceAst);
    expect(twiceTransformedSourceAst).toEqual(transformedSourceAst);
  });

  describe('with maxLength constraint', () => {
    it.each`
      source           | maxLength | target
      ${/a/}           | ${10}     | ${/(?:^.{0,10}a.{0,10}$)/}
      ${/a|b/}         | ${5}      | ${/(?:^.{0,5}a.{0,5}$)|(?:^.{0,5}b.{0,5}$)/}
      ${/(^|b)a($|c)/} | ${8}      | ${/(^|(?:^.{0,8}b))a($|(?:c.{0,8}$))/}
      ${/a|/}          | ${7}      | ${/(?:^.{0,7}a.{0,7}$)|/}
    `('should transform $source with maxLength=$maxLength into $target', ({ source, maxLength, target }) => {
      const sourceAst = tokenizeRegex(source);
      const targetAst = tokenizeRegex(target);

      const transformedSourceAst = addMissingDotStar(sourceAst, maxLength);
      expect(transformedSourceAst).toEqual(targetAst);
    });
  });
});
