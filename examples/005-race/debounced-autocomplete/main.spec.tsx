/* eslint-disable @typescript-eslint/no-use-before-define */
import React from 'react';
import DebouncedAutocomplete from './src/DebouncedAutocomplete';

import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fc from 'fast-check';

beforeEach(() => {
  jest.clearAllTimers();
  jest.resetAllMocks();
});

// Copied from https://github.com/testing-library/user-event/issues/586
function escapeKeyboardInput(value: string): string {
  return value.replace(/[{[]/g, '$&$&');
}

describe('DebouncedAutocomplete', () => {
  it('should autocomplete queries (with mocked timers)', async () => {
    await fc.assert(
      fc
        .asyncProperty(
          fc.scheduler(),
          fc.uniqueArray(fc.string()),
          fc.string({ minLength: 1 }),
          async (s, allResults, userQuery) => {
            // Arrange
            jest.useFakeTimers();
            const suggestionsFor = s.scheduleFunction(
              async (query: string) => {
                return allResults.filter((r) => r.includes(query));
              },
              // Continuations plugged onto calls to suggestionsFor(...) might perform state updates
              // as a consequence they need to be fired from an act-context
              act,
            );
            const expectedResults = allResults.filter((r) => r.includes(userQuery));

            // Act
            render(<DebouncedAutocomplete suggestionsFor={suggestionsFor} />);
            const { task } = s.scheduleSequence(
              [...userQuery].map((c, idx) => ({
                label: `Typing "${c}"`,
                builder: async () => {
                  await act(async () => {
                    // Typing stuff may trigger state updates, thus they have to be wrapped into act
                    const input = screen.getByRole('textbox');
                    const character = escapeKeyboardInput(userQuery.substr(idx, 1));
                    const options = { delay: null }; // we don't want any call to setTimeout
                    await userEvent.type(input, character, options);
                  });
                },
              })),
            );
            const customAct = buildWrapWithTimersAct(s);
            await s.waitFor(task, customAct);
            await s.waitAll(customAct);

            // Assert
            const displayedSuggestions = screen.queryAllByRole('listitem');
            expect(displayedSuggestions.map((el) => el.textContent)).toEqual(expectedResults);
          },
        )
        .beforeEach(async () => {
          jest.clearAllTimers();
          jest.resetAllMocks();
          await cleanup();
        }),
    );
  });
});

// Helpers

/**
 * Build an act function
 * able to automatically schedule timers when new ones gets registered
 */
function buildWrapWithTimersAct(s: fc.Scheduler) {
  let timersAlreadyScheduled = false;

  function scheduleTimersIfNeeded() {
    if (timersAlreadyScheduled || jest.getTimerCount() === 0) {
      return;
    }
    timersAlreadyScheduled = true;
    s.schedule(Promise.resolve('advance timers')).then(() => {
      timersAlreadyScheduled = false;
      act(() => {
        // Timers may trigger state updates, thus they have to be wrapped into act
        jest.advanceTimersToNextTimer();
      });
      scheduleTimersIfNeeded();
    });
  }

  return async function wrapWithTimersAct(f: () => Promise<unknown>) {
    try {
      await f();
    } finally {
      scheduleTimersIfNeeded();
    }
  };
}
