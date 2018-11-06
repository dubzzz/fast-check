import * as fc from '../../lib/fast-check';
import { FakeApi } from './FakeApi';

describe('Asynchronous example', () => {
  it('Search users asynchronously (fails)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async query => {
        const users = await FakeApi.searchUsers(query);
        return Array.isArray(users) && users.every(name => name.indexOf(query) !== -1);
      })
    );
  });
  it('Get back user id from label (success)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom('toto', 'titi'), async username => {
        const user = await FakeApi.findUser(username);
        return user != null && typeof user.id === 'number' && user.id >= 0;
      })
    );
  });
});
