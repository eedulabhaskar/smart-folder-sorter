/**
 * Mock authentication system using localStorage.
 * Stores user data and session tokens in browser storage.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  avatar?: string;
}

interface StoredUser extends User {
  password: string;
}

const USERS_KEY = "sfo_users";
const SESSION_KEY = "sfo_session";

/** Get all registered users from localStorage */
function getStoredUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Save users to localStorage */
function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/** Register a new user */
export function signup(name: string, email: string, password: string): { user?: User; error?: string } {
  const users = getStoredUsers();
  if (users.find((u) => u.email === email)) {
    return { error: "An account with this email already exists." };
  }

  const newUser: StoredUser = {
    id: `user_${Date.now()}`,
    name,
    email,
    password,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  const { password: _, ...safeUser } = newUser;
  localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
  return { user: safeUser };
}

/** Log in an existing user */
export function login(email: string, password: string): { user?: User; error?: string } {
  const users = getStoredUsers();
  const found = users.find((u) => u.email === email && u.password === password);
  if (!found) {
    return { error: "Invalid email or password." };
  }

  const { password: _, ...safeUser } = found;
  localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
  return { user: safeUser };
}

/** Log out current user */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

/** Get current logged-in user */
export function getCurrentUser(): User | null {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/** Update user profile */
export function updateProfile(updates: Partial<Pick<User, "name">>): User | null {
  const current = getCurrentUser();
  if (!current) return null;

  const users = getStoredUsers();
  const idx = users.findIndex((u) => u.id === current.id);
  if (idx === -1) return null;

  if (updates.name) users[idx].name = updates.name;
  saveUsers(users);

  const { password: _, ...safeUser } = users[idx];
  localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
  return safeUser;
}

/** Change password (mock) */
export function changePassword(currentPassword: string, newPassword: string): { success: boolean; error?: string } {
  const current = getCurrentUser();
  if (!current) return { success: false, error: "Not logged in." };

  const users = getStoredUsers();
  const idx = users.findIndex((u) => u.id === current.id);
  if (idx === -1) return { success: false, error: "User not found." };
  if (users[idx].password !== currentPassword) return { success: false, error: "Current password is incorrect." };

  users[idx].password = newPassword;
  saveUsers(users);
  return { success: true };
}
