const USERS_KEY = 'ew_users'
const SESSION_KEY = 'ew_session'

export function getSessionUserId(): string | null {
  return localStorage.getItem(SESSION_KEY)
}

export function setSessionUserId(userId: string | null): void {
  if (userId) {
    localStorage.setItem(SESSION_KEY, userId)
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

export { USERS_KEY, SESSION_KEY }
