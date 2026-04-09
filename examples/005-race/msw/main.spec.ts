import { describe, it, expect } from 'vitest';
import { http, type HttpResponseResolver } from 'msw';
import { HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import fc, { type Scheduler } from 'fast-check';

import { switchUser, getDisplayedUser, reset } from './src/UserProfileLoader.js';
// import { switchUser, getDisplayedUser, reset } from './src/UserProfileLoaderFixed.js';

if (!fc.readConfigureGlobal()) {
  fc.configureGlobal({ interruptAfterTimeLimit: 4000 });
}

// ---------------------------------------------------------------------------
// Wrapper: transparent glue between MSW and fast-check's scheduler.
// Developers write plain MSW resolvers; the wrapper takes care of scheduling.
// ---------------------------------------------------------------------------

/**
 * Wrap an MSW resolver so that each response is delayed until the
 * fast-check scheduler decides to release it.
 *
 * Usage:
 *   http.get('/api/users/:id', scheduled(s, ({ params }) => {
 *     return HttpResponse.json({ id: params.id });
 *   }))
 */
function scheduled<
  Params extends Record<string, string | readonly string[]>,
  RequestBody extends import('msw').DefaultBodyType,
  ResponseBody extends import('msw').DefaultBodyType,
>(
  s: Scheduler,
  resolver: HttpResponseResolver<Params, RequestBody, ResponseBody>,
): HttpResponseResolver<Params, RequestBody, ResponseBody> {
  return async (info) => {
    const url = new URL(info.request.url);
    const label = `${info.request.method} ${url.pathname}`;
    await s.schedule(Promise.resolve(label), label);
    return resolver(info);
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('switchUser', () => {
  it('should display the last requested user (manual wiring)', async () => {
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
          const p1 = switchUser('alice');
          const p2 = switchUser('bob');
          await s.waitFor(Promise.all([p1, p2]));

          expect(getDisplayedUser()?.id).toBe('bob');
        } finally {
          server.close();
        }
      }),
    );
  });

  it('should display the last requested user (with scheduled() wrapper)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.scheduler(), async (s) => {
        reset();

        // Same test, but handlers use the scheduled() wrapper.
        // No s.schedule() call — the wrapper does it transparently.
        const server = setupServer(
          http.get(
            'https://api.example.com/users/:id',
            scheduled(s, ({ params }) => {
              const id = params['id'] as string;
              return HttpResponse.json({ id, name: `User ${id}` });
            }),
          ),
        );
        server.listen({ onUnhandledRequest: 'error' });

        try {
          const p1 = switchUser('alice');
          const p2 = switchUser('bob');
          await s.waitFor(Promise.all([p1, p2]));

          expect(getDisplayedUser()?.id).toBe('bob');
        } finally {
          server.close();
        }
      }),
    );
  });
});
