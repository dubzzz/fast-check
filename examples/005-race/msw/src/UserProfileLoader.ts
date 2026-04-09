export type UserProfile = { id: string; name: string };

let displayedUser: UserProfile | null = null;

export function getDisplayedUser(): UserProfile | null {
  return displayedUser;
}

export async function switchUser(userId: string): Promise<void> {
  const res = await fetch(`https://api.example.com/users/${userId}`);
  const data: UserProfile = await res.json();
  displayedUser = data; // BUG: no staleness check — old response can overwrite new one
}

export function reset(): void {
  displayedUser = null;
}
