// DISCLAIMER:
// Detecting race conditions using fast-check is still a feature under dev.
// See https://github.com/dubzzz/fast-check/pull/479

import fc from 'fast-check';
import AutocompleteField from './src/AutocompleteField';
// import AutocompleteField from './src/AutocompleteFieldMostRecentQuery';
// import AutocompleteField from './src/AutocompleteFieldSimple';

import * as React from 'react';
import { render, cleanup, fireEvent, act, getNodeText } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { search } from './src/Api';

// If you want to test the behaviour of fast-check in case of a bug
//// Replace: React.createElement(AutocompleteField)
//// By: React.createElement(AutocompleteField, { bugId: 1 })

if (!fc.readConfigureGlobal()) {
  // Global config of Jest has been ignored, we will have a timeout after 5000ms
  // (CodeSandbox falls in this category)
  fc.configureGlobal({ interruptAfterTimeLimit: 4000 });
}

describe('AutocompleteField', () => {
  it('should suggest results matching the value of the autocomplete field', () =>
    fc.assert(
      fc
        .asyncProperty(
          fc.set(fc.uuidV(4), 0, 1000),
          fc.array(fc.hexaString(0, 4), 1, 10),
          fc.scheduler(),
          async (allResults, queries, s) => {
            // Arrange
            const searchImplem: typeof search = s.scheduleFunction(function search(query, maxResults) {
              return Promise.resolve(allResults.filter(r => r.includes(query)).slice(0, maxResults));
            });

            // Act
            const { getByRole, queryAllByRole } = await renderAutoCompleteField(searchImplem);
            const buildTypeQuerySequence = (input: HTMLElement, query: string) => {
              return [...query]
                .map((_, idx) => query.substring(0, idx))
                .map(subquery => ({
                  builder: async () => {
                    await act(async () => {
                      fireEvent.change(input, { target: { value: subquery } });
                    });
                  },
                  label: `typing(${JSON.stringify(subquery)})`
                }));
            };
            const input = getByRole('input') as HTMLElement;
            s.scheduleSequence(queries.flatMap(query => buildTypeQuerySequence(input, query)));

            // Assert
            while (s.count() !== 0) {
              await act(async () => {
                await s.waitOne();
              });
              const autocompletionValue = input.attributes.getNamedItem('value')!.value;
              const suggestions = (queryAllByRole('listitem') as HTMLElement[]).map(getNodeText);
              if (!suggestions.every(suggestion => suggestion.includes(autocompletionValue))) {
                throw new Error(
                  `Current suggestions are invalid given the value of the autocomplete field ${JSON.stringify(
                    autocompletionValue
                  )}, suggestions are: ${JSON.stringify(suggestions)}`
                );
              }
            }
          }
        )
        .beforeEach(async () => {
          jest.resetAllMocks();
          cleanup();
        })
    ));

  it('should display results corresponding to the longest available subsequence of query', () =>
    fc.assert(
      fc
        .asyncProperty(
          fc.set(fc.uuidV(4), 0, 1000),
          fc.hexaString(0, 4),
          fc.scheduler(),
          async (allResults, query, s) => {
            // Arrange
            const searchImplem: typeof search = s.scheduleFunction(function search(query, maxResults) {
              return Promise.resolve(allResults.filter(r => r.includes(query)).slice(0, maxResults));
            });

            // Act
            const { getByRole, queryAllByRole } = await renderAutoCompleteField(searchImplem);
            await fireOneByOneForQuery(getByRole('input') as HTMLElement, query);

            // Assert

            //// Resolve query by query in a random order
            //// Check that each time we resolve a new query we either got
            //// - results for the same subquery
            //// - results for a longer subquery
            //// Example:
            //// (1) abc resolves  - we get results matching abc
            //// (2) ab  resolves  - we still get results matching abc (ab ignored)
            //// (3) abcd resolves - we get results matching abcd
            let lastMatchingSubquery = { longest: '', suggestions: [] as string[] };
            while (s.count() !== 0) {
              await act(async () => {
                await s.waitOne();
              });
              lastMatchingSubquery = await checkSuggestions(
                queryAllByRole('listitem') as HTMLElement[],
                query,
                lastMatchingSubquery
              );
            }

            //// At the end we expect to get results matching the final query
            // TODO Replace by: expect(lastMatchingSubquery.longest).toBe(query); // Not supported in CodeSandbox
            if (lastMatchingSubquery.longest !== query) {
              throw new Error(
                `Expected last matching subquery to be ${JSON.stringify(query)}, got: ${JSON.stringify(
                  lastMatchingSubquery.longest
                )}`
              );
            }
          }
        )
        .beforeEach(async () => {
          jest.resetAllMocks();
          cleanup();
        })
    ));

  it('should display results corresponding to the longest available subsequence of the current query', () =>
    fc.assert(
      fc
        .asyncProperty(
          fc.set(fc.uuidV(4), 0, 1000),
          fc.array(fc.hexaString(0, 4), 1, 10),
          fc.scheduler(),
          async (allResults, queries, s) => {
            // Arrange
            const searchImplem: typeof search = s.scheduleFunction(function search(query, maxResults) {
              return Promise.resolve(allResults.filter(r => r.includes(query)).slice(0, maxResults));
            });
            const query = queries[queries.length - 1];

            // Act
            const { getByRole, queryAllByRole } = await renderAutoCompleteField(searchImplem);
            for (const q of queries) {
              await fireOneByOneForQuery(getByRole('input') as HTMLElement, q);
            }

            // Assert

            //// Resolve query by query in a random order
            //// Example for final query abd - first query was for abcd, second one for abd:
            //// (1) abc resolves  - we still get results matching '' (abc ignored - not substring of abd)
            //// (2) ab  resolves  - we get results matching ab
            //// (3) abcd resolves - we still get results matching ab (abcd ignored - not substring of abd)
            //// (4) abd  resolves - we get results matching abd
            let lastMatchingSubquery = { longest: '', suggestions: [] as string[] };
            while (s.count() !== 0) {
              await act(async () => {
                await s.waitOne();
              });
              lastMatchingSubquery = await checkSuggestions(
                queryAllByRole('listitem') as HTMLElement[],
                query,
                lastMatchingSubquery
              );
            }

            //// At the end we expect to get results matching the final query
            // TODO Replace by: expect(lastMatchingSubquery.longest).toBe(query); // Not supported in CodeSandbox
            if (lastMatchingSubquery.longest !== query) {
              throw new Error(
                `Expected last matching subquery to be ${JSON.stringify(query)}, got: ${JSON.stringify(
                  lastMatchingSubquery.longest
                )}`
              );
            }
          }
        )
        .beforeEach(async () => {
          jest.resetAllMocks();
          cleanup();
        })
    ));
});

// Helpers

const extractLongestSubqueryMatchingAll = (suggestions: string[], query: string) => {
  // Dummy implementation
  for (let numRemovedChars = 0; numRemovedChars !== query.length; ++numRemovedChars) {
    const subquery = query.substring(0, query.length - numRemovedChars);
    if (suggestions.every(s => s.includes(subquery))) {
      return subquery;
    }
  }
  return '';
};

const renderAutoCompleteField = async (searchImplem: typeof search) => {
  let getByRole: ReturnType<typeof render>['getByRole'] = null as any;
  let queryAllByRole: ReturnType<typeof render>['queryAllByRole'] = null as any;

  await act(async () => {
    const wrapper = render(React.createElement(AutocompleteField, { search: searchImplem }));
    getByRole = wrapper.getByRole;
    queryAllByRole = wrapper.queryAllByRole;
  });

  return { getByRole, queryAllByRole };
};

const fireOneByOneForQuery = async (input: HTMLElement, query: string) => {
  // Fire characters of query one by one
  for (let idx = 0; idx !== query.length; ++idx) {
    await act(async () => {
      fireEvent.change(input, { target: { value: query.substring(0, idx + 1) } });
    });
  }
  if (query.length === 0) {
    await act(async () => {
      fireEvent.change(input, { target: { value: query } });
    });
  }

  // Sanity check: input has the right value
  // TODO Replace by: expect(input).toHaveAttribute('value', query); // Not supported in CodeSandbox
  if (input.attributes.getNamedItem('value')!.value !== query) {
    throw new Error(
      `Expected input content to be ${JSON.stringify(query)}, got: ${JSON.stringify(
        input.attributes.getNamedItem('value')!.value
      )}`
    );
  }
};

const checkSuggestions = async (
  items: HTMLElement[],
  query: string,
  lastMatchingSubquery: { longest: string; suggestions: string[] }
): Promise<{ longest: string; suggestions: string[] }> => {
  const suggestions = items.map(getNodeText);
  const longest = extractLongestSubqueryMatchingAll(suggestions, query);

  if (lastMatchingSubquery.suggestions.length > 0 && longest.length < lastMatchingSubquery.longest.length) {
    throw new Error(
      `Previous results were matching ${JSON.stringify(lastMatchingSubquery.longest)} (${JSON.stringify(
        lastMatchingSubquery.suggestions
      )}) while current ones are matching ${JSON.stringify(longest)} (${JSON.stringify(suggestions)})`
    );
  }

  return { longest, suggestions };
};
