const MUST_CHANGE_PASSWORD_KEY = 'ew_must_change_password'

export function getMustChangePassword(): boolean {
  return localStorage.getItem(MUST_CHANGE_PASSWORD_KEY) === 'true'
}

export function setMustChangePassword(required: boolean): void {
  if (required) {
    localStorage.setItem(MUST_CHANGE_PASSWORD_KEY, 'true')
  } else {
    localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY)
  }
}

export function clearMustChangePassword(): void {
  localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY)
}
