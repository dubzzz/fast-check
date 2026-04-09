import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import fc from 'fast-check';

import { switchUser, getDisplayedUser, reset } from './src/UserProfileLoader.js';
// import { switchUser, getDisplayedUser, reset } from './src/UserProfileLoaderFixed.js';

if (!fc.readConfigureGlobal()) {
  fc.configureGlobal({ interruptAfterTimeLimit: 4000 });
}

describe('switchUser', () => {
  it('should display the last requested user', async () => {
    await fc.assert(
      fc.asyncProperty(fc.scheduler(), async (s) => {
        reset();

        // Wire MSW handlers to the fast-check scheduler:
        // s.schedule() controls WHEN each response is delivered.
        const server = setupServer(
          http.get('https://api.example.com/users/:id', async ({ params }) => {
            const id = params['id'] as string;
            await s.schedule(Promise.resolve(`response for ${id}`), `GET /users/${id}`);
            return HttpResponse.json({ id, name: `User ${id}` });
          }),
        );
        server.listen({ onUnhandledRequest: 'error' });

        try {
          // Simulate rapid navigation: user switches from alice to bob
          const p1 = switchUser('alice');
          const p2 = switchUser('bob');

          // Process all pending tasks — scheduler picks random order
          await s.waitFor(Promise.all([p1, p2]));

          // The displayed user should always be the LAST one requested
          expect(getDisplayedUser()?.id).toBe('bob');
        } finally {
          server.close();
        }
      }),
    );
  });
});
