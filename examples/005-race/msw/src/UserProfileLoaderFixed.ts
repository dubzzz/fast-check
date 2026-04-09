export type UserProfile = { id: string; name: string };

let displayedUser: UserProfile | null = null;
let lastRequestedId: string | null = null;

export function getDisplayedUser(): UserProfile | null {
  return displayedUser;
}

export async function switchUser(userId: string): Promise<void> {
  lastRequestedId = userId;
  const res = await fetch(`https://api.example.com/users/${userId}`);
  const data: UserProfile = await res.json();
  if (lastRequestedId === userId) {
    displayedUser = data;
  }
}

export function reset(): void {
  displayedUser = null;
  lastRequestedId = null;
}
