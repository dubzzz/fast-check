import { test, fc } from '@fast-check/vitest';
import { expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { Scheduler } from 'fast-check';
import type { HttpResponseResolver, DefaultBodyType } from 'msw';

// import { switchUser, getDisplayedUser, reset } from './src/UserProfileLoader.js';
import { switchUser, getDisplayedUser, reset } from './src/UserProfileLoaderFixed.js';

function scheduled<
  Params extends Record<string, string | readonly string[]>,
  RequestBody extends DefaultBodyType,
  ResponseBody extends DefaultBodyType,
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

test('should display the last requested user (g + scheduled)', async ({ g }) => {
  const s = g(fc.scheduler);
  reset();

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
});
