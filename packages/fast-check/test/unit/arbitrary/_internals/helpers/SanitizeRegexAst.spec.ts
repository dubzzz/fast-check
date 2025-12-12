import { describe, it, expect } from 'vitest';
import { addMissingDotStar } from '../../../../../src/arbitrary/_internals/helpers/SanitizeRegexAst.js';
import { tokenizeRegex } from '../../../../../src/arbitrary/_internals/helpers/TokenizeRegex.js';

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
});
