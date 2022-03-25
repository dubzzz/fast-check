import express from 'express';
import { getAllUsers, removeUsers } from './db';

const app = express();

async function dropDeactivatedInternal(): Promise<{ status: string }> {
  const allUsers = await getAllUsers();
  const usersToBeDeleted = allUsers.filter((u) => u.deactivated).map((u) => u.id);
  const numDeleted = await removeUsers(usersToBeDeleted);
  return { status: numDeleted === usersToBeDeleted.length ? 'success' : 'error' };
}

app.get('/drop-deactivated', async function (req, res) {
  const out = await dropDeactivatedInternal();
  res.status(200).json(out);
});

export { dropDeactivatedInternal, app };
