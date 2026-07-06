import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { LoginGraphCaptcha, UserProfile } from '../types'
import * as authApi from '../api/auth'
import { setUnauthorizedHandler } from '../api/request'
import { getToken } from '../storage/tokenStorage'

interface AuthContextValue {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, captcha?: LoginGraphCaptcha) => Promise<void>
  register: (email: string, password: string, code: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearUser = useCallback(() => {
    setUser(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    const profile = await authApi.fetchUserProfile()
    setUser(profile)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(clearUser)
    return () => setUnauthorizedHandler(null)
  }, [clearUser])

  useEffect(() => {
    if (!getToken()) {
      setIsLoading(false)
      return
    }

    authApi
      .restoreSession()
      .then((profile) => setUser(profile))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string, captcha?: LoginGraphCaptcha) => {
    await authApi.login(email, password, captcha)
    const profile = await authApi.fetchUserProfile()
    setUser(profile)
  }, [])

  const register = useCallback(async (email: string, password: string, code: string) => {
    await authApi.register(email, password, code)
    const profile = await authApi.fetchUserProfile()
    setUser(profile)
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, isLoading, login, register, logout, refreshProfile],
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
