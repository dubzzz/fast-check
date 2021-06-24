/** @internal */
export function filterInvalidSubdomainLabel(subdomainLabel: string): boolean {
  // Here our definition of a subdomain is <label> and "[l]abels must be 63 characters or less"
  // According RFC 1034 a subdomain should be defined as follows:
  //  - <subdomain> ::= <label> | <subdomain> "." <label>
  //  - <label> ::= <letter> [ [ <ldh-str> ] <let-dig> ]
  //  - <ldh-str> ::= <let-dig-hyp> | <let-dig-hyp> <ldh-str>
  //  - <let-dig-hyp> ::= <let-dig> | "-"
  //  - <let-dig> ::= <letter> | <digit>
  //  - <letter> ::= any one of the 52 alphabetic characters A through Z in upper case and a through z in lower case
  //  - <digit> ::= any one of the ten digits 0 through 9
  // If we strictly follow RFC 1034, 9gag would be an invalid domain. Support for such domain has been added by ....
  if (subdomainLabel.length > 63) {
    return false; // invalid, it seems that this restriction has been relaxed in modern web browsers
  }
  // We discard any subdomain starting by xn--
  // as they would require lots of checks to confirm if they are valid internationalized domains.
  // While they still are valid subdomains they might be problematic with some libs,
  // so we prefer not to include them by default (eg.: new URL in Node does not accept invalid internationalized domains)
  return (
    subdomainLabel.length < 4 ||
    subdomainLabel[0] !== 'x' ||
    subdomainLabel[1] !== 'n' ||
    subdomainLabel[2] !== '-' ||
    subdomainLabel[3] !== '-'
  );
}
