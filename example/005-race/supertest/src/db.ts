/* eslint-disable @typescript-eslint/no-unused-vars */

export type User = { id: string; name: string; deactivated: boolean };

export async function getAllUsers(): Promise<User[]> {
  return [];
}

export async function removeUsers(ids: string[]): Promise<number> {
  return 0;
}
