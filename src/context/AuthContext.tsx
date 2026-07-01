import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { UserProfile } from '../types'
import * as authApi from '../api/auth'

interface AuthContextValue {
  user: UserProfile | null
  isAuthenticated: boolean
  login: (email: string, password: string) => void
  register: (name: string, email: string, password: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => authApi.getCurrentUser())

  const login = useCallback((email: string, password: string) => {
    const profile = authApi.login(email, password)
    setUser(profile)
  }, [])

  const register = useCallback((name: string, email: string, password: string) => {
    const profile = authApi.register(name, email, password)
    setUser(profile)
  }, [])

  const logout = useCallback(() => {
    authApi.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
