/** @internal */
export function partsToUrlMapper(data: [string, string, string, string | null, string | null]): string {
  const [scheme, authority, path] = data;
  const query = data[3] === null ? '' : `?${data[3]}`;
  const fragments = data[4] === null ? '' : `#${data[4]}`;
  return `${scheme}://${authority}${path}${query}${fragments}`;
}

/** @internal More details on RFC 3986, https://www.ietf.org/rfc/rfc3986.txt */
const UrlSplitRegex =
  /^([[A-Za-z][A-Za-z0-9+.-]*):\/\/([^/?#]*)([^?#]*)(\?[A-Za-z0-9\-._~!$&'()*+,;=:@/?%]*)?(#[A-Za-z0-9\-._~!$&'()*+,;=:@/?%]*)?$/;

/** @internal */
export function partsToUrlUnmapper(value: unknown): [string, string, string, string | null, string | null] {
  if (typeof value !== 'string') {
    throw new Error('Incompatible value received: type');
  }
  const m = UrlSplitRegex.exec(value);
  if (m === null) {
    throw new Error('Incompatible value received');
  }
  const scheme = m[1];
  const authority = m[2];
  const path = m[3];
  const query: string | undefined = m[4];
  const fragments: string | undefined = m[5];
  return [
    scheme,
    authority,
    path,
    query !== undefined ? query.substring(1) : null,
    fragments !== undefined ? fragments.substring(1) : null,
  ];
}
