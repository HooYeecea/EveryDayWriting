const TOKEN_KEY = 'ew_token'
const REFRESH_TOKEN_KEY = 'ew_refresh_token'
const TOKEN_EXPIRES_KEY = 'ew_token_expires_at'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function removeRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getTokenExpiresAt(): string | null {
  return localStorage.getItem(TOKEN_EXPIRES_KEY)
}

export function setTokenExpiresAt(expiresAt: string): void {
  localStorage.setItem(TOKEN_EXPIRES_KEY, expiresAt)
}

export function removeTokenExpiresAt(): void {
  localStorage.removeItem(TOKEN_EXPIRES_KEY)
}

export function clearAuthTokens(): void {
  removeToken()
  removeRefreshToken()
  removeTokenExpiresAt()
}

export function persistAuthSession(token: string, refreshToken: string, expiresAt: string): void {
  setToken(token)
  setRefreshToken(refreshToken)
  setTokenExpiresAt(expiresAt)
}

export { TOKEN_KEY }
