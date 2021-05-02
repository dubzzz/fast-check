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

describe('DebouncedAutocomplete', () => {
  it('should autocomplete queries (with mocked timers)', async () => {
    await fc.assert(
      fc
        .asyncProperty(
          fc.scheduler({ act }),
          fc.set(fc.string()),
          fc.string({ minLength: 1 }),
          async (s, allResults, userQuery) => {
            // Arrange
            jest.useFakeTimers();
            const suggestionsFor = s.scheduleFunction(async (query: string) => {
              return allResults.filter((r) => r.includes(query));
            });
            const expectedResults = allResults.filter((r) => r.includes(userQuery));

            // Act
            render(<DebouncedAutocomplete suggestionsFor={suggestionsFor} />);
            s.scheduleSequence(
              [...userQuery].map((c, idx) => ({
                label: `Typing "${c}"`,
                builder: async () => await userEvent.type(screen.getByRole('textbox'), userQuery.substr(idx, 1)),
              }))
            );
            await waitAllWithTimers(s);

            // Assert
            const displayedSuggestions = screen.queryAllByRole('listitem');
            expect(displayedSuggestions.map((el) => el.textContent)).toEqual(expectedResults);
          }
        )
        .beforeEach(async () => {
          jest.clearAllTimers();
          jest.resetAllMocks();
          await cleanup();
        })
    );
  });

  it('should autocomplete queries (with mocked timers)', async () => {
    await fc.assert(
      fc
        .asyncProperty(
          fc.scheduler({ act }).map(withTimers),
          fc.set(fc.string()),
          fc.string({ minLength: 1 }),
          async (s, allResults, userQuery) => {
            // Arrange
            jest.useFakeTimers();
            const suggestionsFor = s.scheduleFunction(async (query: string) => {
              return allResults.filter((r) => r.includes(query));
            });
            const expectedResults = allResults.filter((r) => r.includes(userQuery));

            // Act
            render(<DebouncedAutocomplete suggestionsFor={suggestionsFor} />);
            s.scheduleSequence(
              [...userQuery].map((c, idx) => ({
                label: `Typing "${c}"`,
                builder: async () =>
                  await userEvent.type(screen.getByRole('textbox'), userQuery.substr(idx, 1), { delay: 0 }),
              }))
            );
            await s.waitAll();

            // Assert
            const displayedSuggestions = screen.queryAllByRole('listitem');
            expect(displayedSuggestions.map((el) => el.textContent)).toEqual(expectedResults);
          }
        )
        .beforeEach(async () => {
          jest.clearAllTimers();
          jest.resetAllMocks();
          await cleanup();
        })
    );
  });
});

// Helpers

// Here is a first helper that can be used to mock timers
// It should be used to replace calls to s.waitAll
const waitAllWithTimers = async (s: fc.Scheduler) => {
  let alreadyScheduledTaskToUnqueueTimers = false;
  const countWithTimers = () => {
    // Append a scheduled task to unqueue pending timers (if task missing and pending timers)
    if (!alreadyScheduledTaskToUnqueueTimers && jest.getTimerCount() !== 0) {
      alreadyScheduledTaskToUnqueueTimers = true;
      s.schedule(Promise.resolve('advance timers if any')).then(() => {
        alreadyScheduledTaskToUnqueueTimers = false;
        jest.advanceTimersToNextTimer();
      });
    }
    return s.count();
  };
  while (countWithTimers() !== 0) {
    await s.waitOne();
  }
};

// Here is a second helper that can be used to mock timers
// It should to build the schdeuler: fc.scheduler({ act }).map(withTimers)
const withTimers = (s: fc.Scheduler): fc.Scheduler => {
  let alreadyScheduledTaskToUnqueueTimers = false;
  const appendScheduledTaskToUnqueueTimersIfNeeded = () => {
    // Append a scheduled task to unqueue pending timers (if task missing and pending timers)
    if (!alreadyScheduledTaskToUnqueueTimers && jest.getTimerCount() !== 0) {
      alreadyScheduledTaskToUnqueueTimers = true;
      s.schedule(Promise.resolve('advance timers if any')).then(() => {
        alreadyScheduledTaskToUnqueueTimers = false;
        jest.advanceTimersToNextTimer();
      });
    }
  };

  return {
    schedule(...args) {
      return s.schedule(...args);
    },
    scheduleFunction(...args) {
      return s.scheduleFunction(...args);
    },
    scheduleSequence(...args) {
      return s.scheduleSequence(...args);
    },
    count() {
      return s.count();
    },
    toString() {
      return String(s);
    },
    async waitOne() {
      appendScheduledTaskToUnqueueTimersIfNeeded();
      await s.waitOne();
    },
    async waitAll() {
      appendScheduledTaskToUnqueueTimersIfNeeded();
      while (s.count()) {
        await s.waitOne();
        appendScheduledTaskToUnqueueTimersIfNeeded();
      }
    },
  } as fc.Scheduler;
};
