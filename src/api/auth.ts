import type { StoredUser, UserProfile } from '../types'
import { STATIC_USERS, createUserProfile } from '../data/mockUsers'
import { SESSION_KEY, USERS_KEY, setSessionUserId } from '../storage/authStorage'

function readUsers(): StoredUser[] {
  const raw = localStorage.getItem(USERS_KEY)
  if (!raw) {
    writeUsers(STATIC_USERS)
    return STATIC_USERS
  }
  try {
    return JSON.parse(raw) as StoredUser[]
  } catch {
    writeUsers(STATIC_USERS)
    return STATIC_USERS
  }
}

function writeUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users, null, 2))
}

export function getAllUsers(): StoredUser[] {
  return readUsers()
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return readUsers().find((user) => user.email === email)
}

export function findUserById(id: string): StoredUser | undefined {
  return readUsers().find((user) => user.id === id)
}

export function login(email: string, password: string): UserProfile {
  const user = findUserByEmail(email)
  if (!user || user.password !== password) {
    throw new Error('邮箱或密码错误')
  }
  setSessionUserId(user.id)
  return user.profile
}

export function register(name: string, email: string, password: string): UserProfile {
  const users = readUsers()
  if (users.some((user) => user.email === email)) {
    throw new Error('该邮箱已被注册')
  }

  const id = `user-${crypto.randomUUID()}`
  const profile = createUserProfile(id, name, email)
  const newUser: StoredUser = { id, email, password, profile }

  writeUsers([...users, newUser])
  setSessionUserId(id)
  return profile
}

export function logout(): void {
  setSessionUserId(null)
}

export function getCurrentUser(): UserProfile | null {
  const sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) return null
  return findUserById(sessionId)?.profile ?? null
}
