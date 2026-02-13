import { describe, it, expect } from 'vitest';
import { tokenizeRegex } from '../../../../../src/arbitrary/_internals/helpers/TokenizeRegex.js';
import { clampRegexAst } from '../../../../../src/arbitrary/_internals/helpers/ClampRegexAst.js';

describe('clampRegexAst', () => {
  it.each([
    { source: /a/, target: /a/, maxLength: 10 }, // nothing can be clamped
    { source: /a{2,}/, target: /a{2,10}/, maxLength: 10 }, // unbound range must be clamped
    { source: /a{2,50}/, target: /a{2,10}/, maxLength: 10 }, // bound range with higher bound too high must be clamped
    { source: /a{2,50}/, target: /a{2,10}/, maxLength: 10 }, // bound range with acceptable higher bound must be unchanged
    { source: /a*/, target: /a{0,10}/, maxLength: 10 }, // unbound "*" range must be clamped
    { source: /a+/, target: /a{1,10}/, maxLength: 10 }, // unbound "+" range must be clamped
    { source: /a?/, target: /a?/, maxLength: 10 }, // optional must be unchanged when length >0
    { source: /a?/, target: /a{0,0}/, maxLength: 0 }, // optional must be dropped when length=0
    { source: /(a*)/, target: /(a{0,10})/, maxLength: 10 }, // forward clamping through "(<something>)"
    { source: /a*|b*/, target: /a{0,10}|b{0,10}/, maxLength: 10 }, // forward clamping through "<something>|<something>"
    { source: /a*b*/, target: /a{0,10}b{0,10}/, maxLength: 10 }, // forward clamping through "<something><something>"
    { source: /[a-z]*/, target: /[a-z]{0,10}/, maxLength: 10 }, // unbound "*" range must be clamped
    { source: /[^a-z]*/, target: /[^a-z]{0,10}/, maxLength: 10 }, // unbound "*" range must be clamped
  ])('should transform $source into $target for $maxLength', ({ source, target, maxLength }) => {
    const sourceAst = tokenizeRegex(source);
    const targetAst = tokenizeRegex(target);
    expect(clampRegexAst(sourceAst, maxLength)).toEqual(targetAst);
  });
});
