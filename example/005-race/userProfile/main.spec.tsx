import fc from 'fast-check';
import * as React from 'react';

import UserProfilePage from './src/UserProfilePage';

import { render, cleanup, act, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

// If you want to test the behaviour of fast-check in case of a bug:
const bugId = undefined; // = 1; // to enable bug

if (!fc.readConfigureGlobal()) {
  // Global config of Jest has been ignored, we will have a timeout after 5000ms
  // (CodeSandbox falls in this category)
  fc.configureGlobal({ interruptAfterTimeLimit: 4000 });
}

describe('UserProfilePage', () => {
  it('should not display data related to another user', () =>
    fc.assert(
      fc
        .asyncProperty(fc.uuid(), fc.uuid(), fc.scheduler({ act }), async (uid1, uid2, s) => {
          // Arrange
          const getUserProfileImplem = s.scheduleFunction(function getUserProfile(userId: string) {
            return Promise.resolve({ id: userId, name: userId });
          });

          // Act
          const { rerender } = render(
            <UserProfilePage userId={uid1} getUserProfile={getUserProfileImplem} bug={bugId} />
          );
          s.scheduleSequence([
            async () => {
              rerender(<UserProfilePage userId={uid2} getUserProfile={getUserProfileImplem} bug={bugId} />);
            },
          ]);
          await s.waitAll();

          // Assert
          expect(await screen.queryByText('Loading...')).toBe(null);
          expect((await screen.queryByTestId('user-id'))!.textContent).toBe(`Id: ${uid2}`);
        })
        .beforeEach(async () => {
          jest.resetAllMocks();
          await cleanup();
        })
    ));

  it('should not display data related to another user (complex)', () =>
    fc.assert(
      fc
        .asyncProperty(fc.array(fc.uuid(), { minLength: 1 }), fc.scheduler(), async (loadedUserIds, s) => {
          // Arrange
          const getUserProfileImplem = s.scheduleFunction(function getUserProfile(userId: string) {
            return Promise.resolve({ id: userId, name: userId });
          });

          // Act
          let currentUid = loadedUserIds[0];
          const { rerender } = render(
            <UserProfilePage userId={currentUid} getUserProfile={getUserProfileImplem} bug={bugId} />
          );
          s.scheduleSequence(
            loadedUserIds.slice(1).map((uid) => ({
              label: `Update user id to ${uid}`,
              builder: async () => {
                currentUid = uid;
                rerender(<UserProfilePage userId={uid} getUserProfile={getUserProfileImplem} bug={bugId} />);
              },
            }))
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
          jest.resetAllMocks();
          await cleanup();
        })
    ));
});
