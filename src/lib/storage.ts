const PREFIX = 'apex_ledger_v1_'

export const STORAGE_KEYS = {
  users: `${PREFIX}users`,
  session: `${PREFIX}session`,
  userData: (userId: string) => `${PREFIX}data_${userId}`,
}

export function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function setJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error('Failed to persist local data', err)
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function listUserDataKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (key && key.startsWith(`${PREFIX}data_`)) keys.push(key)
  }
  return keys
}
