import fc from 'fast-check';
import * as React from 'react';

import AutocompleteField from './src/AutocompleteField';
//import AutocompleteField from './src/AutocompleteFieldMostRecentQuery';
//import AutocompleteField from './src/AutocompleteFieldSimple';

import { render, cleanup, fireEvent, act, getNodeText, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { search } from './src/Api';

// If you want to test the behaviour of fast-check in case of a bug:
const bugs = {
  //  enableBugBetterResults: true,
  //  enableBugUnfilteredResults: true,
  //  enableBugUnrelatedResults: true,
  //  enableBugDoNotDiscardOldQueries: true
};

if (!fc.readConfigureGlobal()) {
  // Global config of Jest has been ignored, we will have a timeout after 5000ms
  // (CodeSandbox falls in this category)
  fc.configureGlobal({ interruptAfterTimeLimit: 4000 });
}

describe('AutocompleteField', () => {
  it('should suggest results matching the value of the autocomplete field', () =>
    fc.assert(
      fc
        .asyncProperty(AllResultsArbitrary, QueriesArbitrary, fc.scheduler({ act }), async (allResults, queries, s) => {
          // Arrange
          const searchImplem: typeof search = s.scheduleFunction(function search(query, maxResults) {
            return Promise.resolve(allResults.filter((r) => r.includes(query)).slice(0, maxResults));
          });

          // Act
          render(<AutocompleteField search={searchImplem} {...bugs} />);
          const input = screen.getByRole('textbox') as HTMLElement;
          s.scheduleSequence(buildAutocompleteEvents(input, queries));

          // Assert
          while (s.count() !== 0) {
            await s.waitOne();

            const autocompletionValue = input.attributes.getNamedItem('value')!.value;
            const suggestions = (screen.queryAllByRole('listitem') as HTMLElement[]).map(getNodeText);
            if (!suggestions.every((suggestion) => suggestion.includes(autocompletionValue))) {
              throw new Error(
                `Invalid suggestions for ${JSON.stringify(autocompletionValue)}, got: ${JSON.stringify(suggestions)}`
              );
            }
          }
        })
        .beforeEach(async () => {
          jest.resetAllMocks();
          await cleanup();
        })
    ));

  it('should display more and more sugestions as results come', () =>
    fc.assert(
      fc
        .asyncProperty(AllResultsArbitrary, QueriesArbitrary, fc.scheduler({ act }), async (allResults, queries, s) => {
          // Arrange
          const query = queries[queries.length - 1];
          const searchImplem: typeof search = s.scheduleFunction(function search(query, maxResults) {
            return Promise.resolve(allResults.filter((r) => r.includes(query)).slice(0, maxResults));
          });

          // Act
          render(<AutocompleteField search={searchImplem} {...bugs} />);
          const input = screen.getByRole('textbox') as HTMLElement;
          for (const event of buildAutocompleteEvents(input, queries)) {
            await event.builder();
          } // All the user's inputs have been fired onto the AutocompleField

          // Assert
          let suggestions: string[] = [];
          while (s.count() !== 0) {
            // Resolving one async query in a random order
            await s.waitOne();

            // Read suggestions shown by the component
            const prevSuggestions = suggestions;
            suggestions = (screen.queryAllByRole('listitem') as HTMLElement[]).map(getNodeText);

            // We expect the number of suggestions to increase up to the final number
            // of suggestions for <query> or 10 (max number of suggestions)
            if (suggestions.length < prevSuggestions.length) {
              const got = JSON.stringify({
                prevSuggestions,
                suggestions,
              });
              throw new Error(`We expect to have more and more suggestions as we resolve queries, got: ${got}`);
            }
          }
          // At the end we expect to get results matching <query>
          if (!suggestions.every((s) => s.startsWith(query))) {
            throw new Error(`Must start with ${JSON.stringify(query)}, got: ${JSON.stringify(suggestions)}`);
          }
        })
        .beforeEach(async () => {
          jest.resetAllMocks();
          await cleanup();
        })
    ));
});

// Helpers

const AllResultsArbitrary = fc.set(fc.string(), { maxLength: 1000 });
const QueriesArbitrary = fc.array(fc.string(), { minLength: 1 });

/**
 * Generate a sequence of events that have to be fired onto the component
 * in order to send it all the queries (characters are fired one by one)
 */
const buildAutocompleteEvents = (input: HTMLElement, queries: string[]) => {
  const autocompleteEvents: Exclude<fc.SchedulerSequenceItem, () => any>[] = [];

  for (const query of queries) {
    for (let numCharacters = 0; numCharacters <= query.length; ++numCharacters) {
      const subQuery = query.substring(0, numCharacters);
      const builder = async () => {
        await act(async () => {
          fireEvent.change(input, { target: { value: subQuery } });
        });
      };
      const label = `typing(${JSON.stringify(subQuery)})`;
      autocompleteEvents.push({ builder, label });
    }
  }

  return autocompleteEvents;
};
