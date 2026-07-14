import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthLoginResult, AuthRole, LoginGraphCaptcha, UserProfile } from '../types'
import * as authApi from '../api/auth'
import { setUnauthorizedHandler } from '../api/request'
import {
  clearMustChangePassword,
  getMustChangePassword,
} from '../storage/mustChangePasswordStorage'
import {
  clearStoredPermissions,
  getStoredPermissions,
  setStoredPermissions,
} from '../storage/permissionsStorage'
import { clearStoredRoles, getStoredRoles, setStoredRoles } from '../storage/rolesStorage'
import { getToken } from '../storage/tokenStorage'
import { getDefaultHomePath, parseAuthPermissions, parseAuthRoles } from '../utils/roles'

interface AuthContextValue {
  user: UserProfile | null
  roles: AuthRole[]
  permissions: string[]
  isAuthenticated: boolean
  mustChangePassword: boolean
  isLoading: boolean
  login: (email: string, password: string, captcha?: LoginGraphCaptcha) => Promise<AuthLoginResult>
  register: (email: string, password: string, code: string) => Promise<AuthLoginResult>
  logout: () => Promise<void>
  logoutAllDevices: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshAccess: () => Promise<void>
  completeForcedPasswordChange: (oldPassword: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function applyAccessFromProfile(
  profile: UserProfile,
  setRoles: (roles: AuthRole[]) => void,
  setPermissions: (permissions: string[]) => void,
) {
  const nextRoles = parseAuthRoles(profile.roles)
  if (nextRoles.length) {
    setRoles(nextRoles)
    setStoredRoles(nextRoles)
  }
  // profile 始终带 permissions 字段（可为 []），必须同步，否则撤销权限后侧栏不会更新
  if (profile.permissions !== undefined) {
    const nextPermissions = parseAuthPermissions(profile.permissions)
    setPermissions(nextPermissions)
    setStoredPermissions(nextPermissions)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [roles, setRoles] = useState<AuthRole[]>(() => getStoredRoles())
  const [permissions, setPermissions] = useState<string[]>(() => getStoredPermissions())
  const [mustChangePassword, setMustChangePasswordState] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    setUser(null)
    setRoles([])
    setPermissions([])
    setMustChangePasswordState(false)
    clearMustChangePassword()
    clearStoredRoles()
    clearStoredPermissions()
  }, [])

  const refreshAccess = useCallback(async () => {
    const profile = await authApi.fetchUserProfile()
    applyAccessFromProfile(profile, setRoles, setPermissions)
    setUser(profile)
  }, [])

  const refreshProfile = useCallback(async () => {
    await refreshAccess()
  }, [refreshAccess])

  const finishAuthSession = useCallback(
    async (
      sessionMustChange: boolean,
      sessionRoles: AuthRole[],
      sessionPermissions: string[],
    ): Promise<AuthLoginResult> => {
      setRoles(sessionRoles)
      setStoredRoles(sessionRoles)
      setPermissions(sessionPermissions)
      setStoredPermissions(sessionPermissions)
      const redirectTo = getDefaultHomePath(sessionRoles, sessionPermissions)

      if (sessionMustChange) {
        setMustChangePasswordState(true)
        setUser(null)
        return { mustChangePassword: true, redirectTo: '/change-password' }
      }

      setMustChangePasswordState(false)
      clearMustChangePassword()
      const profile = await authApi.fetchUserProfile()
      applyAccessFromProfile(profile, setRoles, setPermissions)
      setUser(profile)
      return { mustChangePassword: false, redirectTo }
    },
    [],
  )

  useEffect(() => {
    setUnauthorizedHandler(clearSession)
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  useEffect(() => {
    if (!getToken()) {
      setRoles([])
      setPermissions([])
      clearStoredRoles()
      clearStoredPermissions()
      setIsLoading(false)
      return
    }

    if (getMustChangePassword()) {
      setMustChangePasswordState(true)
      setRoles(getStoredRoles())
      setPermissions(getStoredPermissions())
      setIsLoading(false)
      return
    }

    setRoles(getStoredRoles())
    setPermissions(getStoredPermissions())
    authApi
      .restoreSession()
      .then((profile) => {
        if (!profile) {
          clearSession()
          return
        }
        applyAccessFromProfile(profile, setRoles, setPermissions)
        setUser(profile)
      })
      .finally(() => setIsLoading(false))
  }, [clearSession])

  const login = useCallback(
    async (email: string, password: string, captcha?: LoginGraphCaptcha): Promise<AuthLoginResult> => {
      const session = await authApi.login(email, password, captcha)
      return finishAuthSession(
        Boolean(session.user.mustChangePassword),
        session.user.roles ?? [],
        session.permissions,
      )
    },
    [finishAuthSession],
  )

  const register = useCallback(
    async (email: string, password: string, code: string): Promise<AuthLoginResult> => {
      const session = await authApi.register(email, password, code)
      return finishAuthSession(
        Boolean(session.user.mustChangePassword),
        session.user.roles ?? [],
        session.permissions,
      )
    },
    [finishAuthSession],
  )

  const completeForcedPasswordChange = useCallback(
    async (oldPassword: string, newPassword: string) => {
      await authApi.changePassword(oldPassword, newPassword)
      setMustChangePasswordState(false)
      const profile = await authApi.fetchUserProfile()
      applyAccessFromProfile(profile, setRoles, setPermissions)
      setUser(profile)
    },
    [],
  )

  const logout = useCallback(async () => {
    await authApi.logout()
    clearSession()
  }, [clearSession])

  const logoutAllDevices = useCallback(async () => {
    await authApi.logoutAll()
    clearSession()
  }, [clearSession])

  const value = useMemo(
    () => ({
      user,
      roles,
      permissions,
      mustChangePassword,
      isAuthenticated: user !== null && !mustChangePassword,
      isLoading,
      login,
      register,
      logout,
      logoutAllDevices,
      refreshProfile,
      refreshAccess,
      completeForcedPasswordChange,
    }),
    [
      user,
      roles,
      permissions,
      mustChangePassword,
      isLoading,
      login,
      register,
      logout,
      logoutAllDevices,
      refreshProfile,
      refreshAccess,
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
