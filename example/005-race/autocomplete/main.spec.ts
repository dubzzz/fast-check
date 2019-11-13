// Remark: Many "as any" casts - should be fixed by providing a better configuration to ts-jest

import fc from 'fast-check';
import AutocompleteField from './src/AutocompleteField';

import * as React from 'react';
import { render, cleanup, fireEvent, act, getNodeText } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import * as ApiMock from './src/Api';
jest.mock('./src/Api');

// If you want to test the behaviour of fast-check in case of a bug
//// Replace: React.createElement(AutocompleteField)
//// By: React.createElement(AutocompleteField, { bugId: 1 })

describe('AutocompleteField', () => {
  it('should display results corresponding to the longest available subsequence of query', () =>
    fc.assert(
      fc
        .asyncProperty(
          fc.array(fc.uuidV(4), 0, 1000),
          fc.hexaString(0, 4),
          fc.scheduler(),
          async (allResults, query, s) => {
            // Arrange
            const { search } = mockModule(ApiMock);
            search.mockImplementation(
              s.scheduleFunction(function search(query, maxResults) {
                return Promise.resolve(allResults.filter(r => r.includes(query)).slice(0, maxResults));
              })
            );

            // Act
            const { getByRole, queryAllByRole } = await renderAutoCompleteField();
            await fireOnByOneForQuery(getByRole('input') as HTMLElement, query);

            // Assert

            //// Resolve query by query in a random order
            //// Check that each time we resolve a new query we either got
            //// - results for the same subquery
            //// - results for a longer subquery
            //// Example:
            //// (1) abc resolves  - we get results matching abc
            //// (2) ab  resolves  - we still get results matching abc (ab ignored)
            //// (3) abcd resolves - we get results matching abcd
            let lastMatchingSubquery = '';
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
            expect(lastMatchingSubquery).toBe(query);
          }
        )
        .beforeEach(async () => {
          jest.resetAllMocks();
          cleanup();
        })
    ));
});

// Helpers

type MockedFunction<T> = T extends (...args: infer Args) => infer Result
  ? jest.Mock<Result, Args>
  : jest.Mock<any, any>;

type MockedModule<T> = { [K in keyof T]: MockedFunction<T[K]> };

const mockModule = <T>(module: T): MockedModule<T> => module as any;

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

const renderAutoCompleteField = async () => {
  let getByRole: ReturnType<typeof render>['getByRole'] = null as any;
  let queryAllByRole: ReturnType<typeof render>['queryAllByRole'] = null as any;

  await act(async () => {
    const wrapper = render(React.createElement(AutocompleteField));
    getByRole = wrapper.getByRole;
    queryAllByRole = wrapper.queryAllByRole;
  });

  return { getByRole, queryAllByRole };
};

const fireOnByOneForQuery = async (input: HTMLElement, query: string) => {
  // Fire characters of query one by one
  for (let idx = 0; idx !== query.length; ++idx) {
    await act(async () => {
      fireEvent.change(input, { target: { value: query.substring(0, idx + 1) } });
    });
  }

  // Sanity check: input has the right value
  expect(input).toHaveAttribute('value', query);
};

const checkSuggestions = async (items: HTMLElement[], query: string, lastMatchingSubquery: string): Promise<string> => {
  const suggestions = items.map(getNodeText);
  const longest = extractLongestSubqueryMatchingAll(suggestions, query);

  expect(
    // Trick to get nicer error message
    longest.length < lastMatchingSubquery.length
      ? `Previous results were matching ${JSON.stringify(
          lastMatchingSubquery
        )} while current ones are matching ${JSON.stringify(longest)}`
      : null
  ).toBe(null);

  return longest;
};
