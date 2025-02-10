import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import fc from 'fast-check';
import request from 'supertest';
import type { User } from './src/db';
import { app, dropDeactivatedInternal } from './src/app';
// import { app, dropDeactivatedInternal } from'./src/appBug';
import * as DbMock from './src/db';

vi.mock('./src/db');

if (!fc.readConfigureGlobal()) {
  // Global config of Jest has been ignored, we will have a timeout after 5000ms
  // (CodeSandbox falls in this category)
  fc.configureGlobal({ interruptAfterTimeLimit: 4000 });
}

const beforeEachHook = () => {
  vi.resetAllMocks();
};
beforeEach(beforeEachHook);
fc.configureGlobal({ ...fc.readConfigureGlobal(), beforeEach: beforeEachHook });

describe('app', () => {
  it('should be able to call multiple /drop-deactivated at the same time', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(
          fc.record<User>({
            id: fc.uuid({ version: 4 }),
            name: fc.string(),
            deactivated: fc.boolean(),
          }),
          { selector: (u) => u.id },
        ),
        fc.integer({ min: 1, max: 5 }),
        fc.scheduler({
          // In the case of supertest, as a user you MUST define a custom `act` function
          // if you want to run multiple queries at the same time. The following one adds
          // some extra timers so that supertest can push promises in the queue in time.
          // Second test is the very same test but outside of supertest.
          act: async (f) => {
            await new Promise((r) => setTimeout(r, 0));
            await f();
          },
        }),
        async (allUsers, num, s) => {
          // Arrange
          let knownUsers = allUsers;
          const getAllUsers = DbMock.getAllUsers as MockedFunction<typeof DbMock.getAllUsers>;
          const removeUsers = DbMock.removeUsers as MockedFunction<typeof DbMock.removeUsers>;
          getAllUsers.mockImplementation(
            s.scheduleFunction(async function getAllUsers() {
              return knownUsers;
            }),
          );
          removeUsers.mockImplementation(
            s.scheduleFunction(async function removeUsers(ids) {
              const sizeBefore = knownUsers.length;
              knownUsers = knownUsers.filter((u) => !ids.includes(u.id));
              return sizeBefore - knownUsers.length;
            }),
          );

          // Act
          const r = request(app);
          const queries = [];
          for (let index = 0; index !== num; ++index) {
            queries.push(r.get('/drop-deactivated?id=' + index).send());
          }
          const out = await s.waitFor(Promise.all(queries));

          // Assert
          for (const outQuery of out) {
            expect(outQuery.body.status).toBe('success');
          }
        },
      ),
    );
  });

  it('should be able to call multiple /drop-deactivated at the same time (no supertest)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(
          fc.record<User>({
            id: fc.uuid({ version: 4 }),
            name: fc.string(),
            deactivated: fc.boolean(),
          }),
          { selector: (u) => u.id },
        ),
        fc.integer({ min: 1, max: 5 }),
        fc.scheduler(),
        async (allUsers, num, s) => {
          // Arrange
          let knownUsers = allUsers;
          const getAllUsers = DbMock.getAllUsers as MockedFunction<typeof DbMock.getAllUsers>;
          const removeUsers = DbMock.removeUsers as MockedFunction<typeof DbMock.removeUsers>;
          getAllUsers.mockImplementation(
            s.scheduleFunction(async function getAllUsers() {
              return knownUsers;
            }),
          );
          removeUsers.mockImplementation(
            s.scheduleFunction(async function removeUsers(ids) {
              const sizeBefore = knownUsers.length;
              knownUsers = knownUsers.filter((u) => !ids.includes(u.id));
              return sizeBefore - knownUsers.length;
            }),
          );

          // Act
          const queries = [];
          for (let index = 0; index !== num; ++index) {
            queries.push(dropDeactivatedInternal());
          }
          const out = await s.waitFor(Promise.all(queries));

          // Assert
          for (const outQuery of out) {
            expect(outQuery.status).toBe('success');
          }
        },
      ),
    );
  });
});
