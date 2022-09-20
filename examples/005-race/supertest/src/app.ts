import express from 'express';
import { getAllUsers, removeUsers } from './db';

const app = express();

let lock: Promise<unknown> = Promise.resolve();

async function dropDeactivatedInternal(): Promise<{ status: string }> {
  async function synchronized() {
    const allUsers = await getAllUsers();
    const usersToBeDeleted = allUsers.filter((u) => u.deactivated).map((u) => u.id);
    const numDeleted = await removeUsers(usersToBeDeleted);
    return { status: numDeleted === usersToBeDeleted.length ? 'success' : 'error' };
  }
  const newLock = lock.then(synchronized, synchronized);
  lock = newLock;
  return newLock;
}

app.get('/drop-deactivated', async function (req, res) {
  const out = await dropDeactivatedInternal();
  res.status(200).json(out);
});

export { dropDeactivatedInternal, app };
