/**
 * Retrieve up to 10 suggestions of packages
 * corresponding to the query
 */
export async function suggestionsFor(query: string): Promise<string[]> {
  if (query === '') {
    return [];
  }
  const response = await fetch(`https://api.npms.io/v2/search/suggestions?q=${encodeURIComponent(query)}&size=10`);
  if (response.status !== 200) {
    throw new Error(await response.text());
  }
  const data = await response.json();
  return data.map((suggestion: any) => suggestion.package.name);
}
