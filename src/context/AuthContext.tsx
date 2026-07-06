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
import * as authApi from '../api/auth'
import { setUnauthorizedHandler } from '../api/request'
import {
  clearMustChangePassword,
  getMustChangePassword,
} from '../storage/mustChangePasswordStorage'
import { getToken } from '../storage/tokenStorage'

interface LoginResult {
  mustChangePassword: boolean
}

interface AuthContextValue {
  user: UserProfile | null
  isAuthenticated: boolean
  mustChangePassword: boolean
  isLoading: boolean
  login: (email: string, password: string, code?: string) => Promise<LoginResult>
  register: (email: string, password: string, code: string) => Promise<LoginResult>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  completeForcedPasswordChange: (oldPassword: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [mustChangePassword, setMustChangePasswordState] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    setUser(null)
    setMustChangePasswordState(false)
    clearMustChangePassword()
  }, [])

  const refreshProfile = useCallback(async () => {
    const profile = await authApi.fetchUserProfile()
    setUser(profile)
  }, [])

  const finishAuthSession = useCallback(async (sessionMustChange: boolean): Promise<LoginResult> => {
    if (sessionMustChange) {
      setMustChangePasswordState(true)
      setUser(null)
      return { mustChangePassword: true }
    }

    setMustChangePasswordState(false)
    clearMustChangePassword()
    const profile = await authApi.fetchUserProfile()
    setUser(profile)
    return { mustChangePassword: false }
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(clearSession)
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  useEffect(() => {
    if (!getToken()) {
      setIsLoading(false)
      return
    }

    if (getMustChangePassword()) {
      setMustChangePasswordState(true)
      setIsLoading(false)
      return
    }

    authApi
      .restoreSession()
      .then((profile) => setUser(profile))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(
    async (email: string, password: string, code?: string): Promise<LoginResult> => {
      const session = await authApi.login(email, password, code)
      return finishAuthSession(Boolean(session.user.mustChangePassword))
    },
    [finishAuthSession],
  )

  const register = useCallback(
    async (email: string, password: string, code: string): Promise<LoginResult> => {
      const session = await authApi.register(email, password, code)
      return finishAuthSession(Boolean(session.user.mustChangePassword))
    },
    [finishAuthSession],
  )

  const completeForcedPasswordChange = useCallback(
    async (oldPassword: string, newPassword: string) => {
      await authApi.changePassword(oldPassword, newPassword)
      setMustChangePasswordState(false)
      const profile = await authApi.fetchUserProfile()
      setUser(profile)
    },
    [],
  )

  const logout = useCallback(async () => {
    await authApi.logout()
    clearSession()
  }, [clearSession])

  const value = useMemo(
    () => ({
      user,
      mustChangePassword,
      isAuthenticated: user !== null && !mustChangePassword,
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
      completeForcedPasswordChange,
    }),
    [
      user,
      mustChangePassword,
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
      completeForcedPasswordChange,
    ],
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
