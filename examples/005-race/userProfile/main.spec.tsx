/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import * as React from 'react';

import UserProfilePage from './src/UserProfilePage.js';

import { render, cleanup, act, screen } from '@testing-library/react';

describe('UserProfilePage', () => {
  it('should never display stale user data after userId changes', async () => {
    await fc.assert(
      fc
        .asyncProperty(fc.array(fc.uuid(), { minLength: 1 }), fc.scheduler(), async (loadedUserIds, s) => {
          // Arrange
          const getUserProfileImplem = s.scheduleFunction(function getUserProfile(userId: string) {
            return Promise.resolve({ id: userId, name: userId });
          });

          // Act
          let currentUid = loadedUserIds[0];
          const { rerender } = render(
            <UserProfilePage userId={currentUid} getUserProfile={getUserProfileImplem} />,
          );
          s.scheduleSequence(
            loadedUserIds.slice(1).map((uid) => ({
              label: `Update user id to ${uid}`,
              builder: async () => {
                currentUid = uid;
                rerender(<UserProfilePage userId={uid} getUserProfile={getUserProfileImplem} />);
              },
            })),
          );

          // Assert
          while (s.count() !== 0) {
            await act(async () => {
              await s.waitOne();
            });
            const isLoading = (await screen.queryByText('Loading...')) !== null;
            if (!isLoading) {
              const idField = await screen.queryByTestId('user-id');
              expect(idField).not.toBe(null);
              expect(idField!.textContent).toBe(`Id: ${currentUid}`);
            }
          }
        })
        .beforeEach(async () => {
          vi.resetAllMocks();
          await cleanup();
        }),
    );
  });
});
