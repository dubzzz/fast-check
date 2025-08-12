export type User = { id: string; name: string; deactivated: boolean };

export async function getAllUsers(): Promise<User[]> {
  return [];
}

export async function removeUsers(_ids: string[]): Promise<number> {
  return 0;
}
