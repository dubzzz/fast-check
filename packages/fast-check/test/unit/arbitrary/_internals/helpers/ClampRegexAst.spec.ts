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
    { source: /ab|cde/, target: /ab/, maxLength: 2 }, // drop too large static parts from "Disjunction"
    { source: /a|b|cde/, target: /a|b/, maxLength: 2 }, // drop too large static parts from "Disjunction"
    { source: /|cde/, target: /|/, maxLength: 2 }, // drop too large static parts from "Disjunction" when mixed with empty parts
    { source: /cde|/, target: /|/, maxLength: 2 }, // drop too large static parts from "Disjunction" when mixed with empty parts
    { source: /a|bc|def|hijk|lmn|op|q/, target: /a|bc|op|q/, maxLength: 2 }, // drop too large static parts from "Disjunction"
    { source: /abcd*|efg*h|i*jkl*|mn*o*p*/, target: /i{0,0}jkl{0,0}|mn{0,1}o{0,1}p{0,1}/, maxLength: 2 }, // drop too large "*" parts from "Disjunction"
    { source: /(abc)+/, target: /(abc){1,3}/, maxLength: 10 }, // restrict non-unitary repetetions
    { source: /(abc)+/, target: /(abc){1,3}/, maxLength: 11 }, // restrict non-unitary repetetions
    { source: /(abc)+/, target: /(abc){1,4}/, maxLength: 12 }, // restrict non-unitary repetetions
    { source: /(abc|de)+/, target: /(abc|de){1,6}/, maxLength: 12 }, // restrict non-unitary repetetions of a Disjunction
    { source: /a{2,}b{3,}/, target: /a{2,7}b{3,8}/, maxLength: 10 }, // distribute allowance to all parts: a takes at least 2 slots, b can take up to 8 ; same logic gives a can take up to 7
    { source: /a{2,}b{3,}c{2,5}d+/, target: /a{2,14}b{3,15}c{2,5}d{1,13}/, maxLength: 20 }, // distribute allowance to all parts
    { source: /a{2,}b{3,}c{2,5}d+/, target: /a{2,4}b{3,5}c{2,4}d{1,3}/, maxLength: 10 }, // distribute allowance to all parts, we have to restrict c to max 4, given 5 cannot make it
    { source: /(a|bc){2,}(de|fgh){3,}/, target: /(a|bc){2,4}(de|fgh){3,4}/, maxLength: 10 }, // distribute allowance to all parts even with Disjunction running
    { source: /(a|bc){2,}(de|fgh){3,}/, target: /(a|bc){2,5}(de|fgh){3,4}/, maxLength: 11 }, // distribute allowance to all parts even with Disjunction running
    { source: /(cd){5,}/, target: /(cd){5,5}/, maxLength: 10 }, // complex mix A (step 1)
    { source: /(h?iZk*){5,}/, target: /(h{0,0}iZk{0,0}){5,5}/, maxLength: 10 }, // complex mix A (step 2)
    { source: /(h?i[a-z]k*){5,}/, target: /(h{0,0}i[a-z]k{0,0}){5,5}/, maxLength: 10 }, // complex mix A (step 3)
    { source: /(cd|efg|h?i[a-z]k*){5,}/, target: /(cd|h{0,0}i[a-z]k{0,0}){5,5}/, maxLength: 10 }, // complex mix A (step 4)
    { source: /(ab|(cd|efg|h?i[a-z]k*){5,}){2,}/, target: /(ab|(cd|h{0,0}i[a-z]k{0,0}){5,5}){2,10}/, maxLength: 20 }, // complex mix A (step 5)
    { source: /(ab|(cd|efg|h?i[a-z]k*){5,}){2,}/, target: /(ab|(cd|h{0,0}i[a-z]k{0,0}){5,6}){2,12}/, maxLength: 25 }, // complex mix A (step 6)
  ])('should transform $source into $target for $maxLength', ({ source, target, maxLength }) => {
    const sourceAst = tokenizeRegex(source);
    const targetAst = tokenizeRegex(target);
    expect(clampRegexAst(sourceAst, maxLength)).toEqual(targetAst);
  });
});
