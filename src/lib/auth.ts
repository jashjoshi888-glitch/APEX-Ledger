import type { UserProfile } from '../types'
import { getJSON, removeKey, setJSON, STORAGE_KEYS } from './storage'

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// NOTE: This is a browser-only demo. Passwords are hashed locally with SHA-256.
// For real production auth, a server + salted KDF (bcrypt/argon2) is required.
export async function hashPassword(password: string): Promise<string> {
  return sha256Hex(`apex-ledger:${password}`)
}

export function loadUsers(): UserProfile[] {
  return getJSON<UserProfile[]>(STORAGE_KEYS.users, [])
}

function saveUsers(users: UserProfile[]): void {
  setJSON(STORAGE_KEYS.users, users)
}

export function getSessionUserId(): string | null {
  return getJSON<string | null>(STORAGE_KEYS.session, null)
}

function setSessionUserId(userId: string | null): void {
  if (userId === null) {
    removeKey(STORAGE_KEYS.session)
    return
  }
  setJSON(STORAGE_KEYS.session, userId)
}

export function getCurrentUser(): UserProfile | null {
  const id = getSessionUserId()
  if (!id) return null
  const user = loadUsers().find((u) => u.id === id)
  return user ?? null
}

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<{ user: UserProfile } | { error: string }> {
  const cleanName = name.trim()
  const cleanEmail = email.trim().toLowerCase()

  if (cleanName.length < 2) return { error: 'Name must be at least 2 characters.' }
  if (!isValidEmail(cleanEmail)) return { error: 'Enter a valid email address.' }
  if (password.length < 6) return { error: 'Password must be at least 6 characters.' }

  const users = loadUsers()
  if (users.some((u) => u.email === cleanEmail)) {
    return { error: 'An account with that email already exists on this device.' }
  }

  const user: UserProfile = {
    id: crypto.randomUUID(),
    name: cleanName,
    email: cleanEmail,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  }

  users.push(user)
  saveUsers(users)
  setSessionUserId(user.id)
  return { user }
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ user: UserProfile } | { error: string }> {
  const cleanEmail = email.trim().toLowerCase()
  const user = loadUsers().find((u) => u.email === cleanEmail)
  if (!user) return { error: 'No account found for that email.' }

  const hash = await hashPassword(password)
  if (hash !== user.passwordHash) return { error: 'Incorrect password.' }

  setSessionUserId(user.id)
  return { user }
}

export function signOut(): void {
  setSessionUserId(null)
}

export function getDeviceUsers(): UserProfile[] {
  return loadUsers()
}

export function switchUser(userId: string): UserProfile | null {
  const user = loadUsers().find((u) => u.id === userId)
  if (!user) return null
  setSessionUserId(user.id)
  return user
}

export function deleteAccount(userId: string): void {
  const users = loadUsers().filter((u) => u.id !== userId)
  saveUsers(users)
  removeKey(STORAGE_KEYS.userData(userId))
  if (getSessionUserId() === userId) setSessionUserId(null)
}
