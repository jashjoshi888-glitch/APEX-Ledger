import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { UserProfile } from '../types'
import {
  deleteAccount,
  getCurrentUser,
  getDeviceUsers,
  signIn,
  signOut,
  signUp,
  switchUser,
} from '../lib/auth'

interface AuthContextValue {
  user: UserProfile | null
  deviceUsers: UserProfile[]
  isLoading: boolean
  login: (email: string, password: string) => Promise<string | null>
  register: (name: string, email: string, password: string) => Promise<string | null>
  logout: () => void
  selectUser: (userId: string) => void
  removeAccount: (userId: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [deviceUsers, setDeviceUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUser(getCurrentUser())
    setDeviceUsers(getDeviceUsers())
    setIsLoading(false)
  }, [])

  const refreshUsers = useCallback(() => {
    setDeviceUsers(getDeviceUsers())
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await signIn(email, password)
    if ('error' in result) return result.error
    setUser(result.user)
    refreshUsers()
    return null
  }, [refreshUsers])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await signUp(name, email, password)
    if ('error' in result) return result.error
    setUser(result.user)
    refreshUsers()
    return null
  }, [refreshUsers])

  const logout = useCallback(() => {
    signOut()
    setUser(null)
    refreshUsers()
  }, [refreshUsers])

  const selectUser = useCallback((userId: string) => {
    const selected = switchUser(userId)
    if (selected) setUser(selected)
  }, [])

  const removeAccount = useCallback((userId: string) => {
    deleteAccount(userId)
    setUser(getCurrentUser())
    refreshUsers()
  }, [refreshUsers])

  const value = useMemo(
    () => ({ user, deviceUsers, isLoading, login, register, logout, selectUser, removeAccount }),
    [user, deviceUsers, isLoading, login, register, logout, selectUser, removeAccount],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
