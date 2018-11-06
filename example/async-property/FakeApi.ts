export class FakeApi {
  private static Users = ['toto', 'titi', 'tata', 'tutu'];

  // Simulate a db query to fetch all users
  // Can be replaced by any other asynchronous code
  // This calls is supposed to fail whenever the query get back exactly zero result
  static searchUsers(query: string): Promise<string[]> {
    const answer = FakeApi.Users.filter(name => name.indexOf(query) !== -1);
    return new Promise((resolve, reject) => {
      if (answer.length === 0) {
        setTimeout(() => reject('Unhandled exception'), 0);
        return;
      }
      setTimeout(() => resolve(answer), 0);
    });
  }

  // Simulate a call to a rest api
  static findUser(username: string): Promise<{ id: number } | null> {
    const id = FakeApi.Users.indexOf(username);
    const answer = id !== -1 ? { id } : null;
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(answer), 0);
    });
  }
}
