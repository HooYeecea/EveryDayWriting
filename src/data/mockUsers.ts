import type { StoredUser, UserProfile } from '../types'

export const STATIC_USERS: StoredUser[] = [
  {
    id: 'user-001',
    email: 'alex.chen@example.com',
    password: '123456',
    profile: {
      id: 'user-001',
      name: 'Alex Chen',
      email: 'alex.chen@example.com',
      avatar: 'AC',
      level: 'Intermediate',
      totalWritings: 47,
      totalWords: 28560,
      streakDays: 12,
      joinedAt: '2025-09-15',
    },
  },
  {
    id: 'user-002',
    email: 'demo@example.com',
    password: 'demo123',
    profile: {
      id: 'user-002',
      name: 'Demo User',
      email: 'demo@example.com',
      avatar: 'DU',
      level: 'Beginner',
      totalWritings: 5,
      totalWords: 1200,
      streakDays: 3,
      joinedAt: '2026-01-10',
    },
  },
]

export function createUserProfile(
  id: string,
  name: string,
  email: string,
): UserProfile {
  const initials = name
    .split(' ')
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)

  return {
    id,
    name,
    email,
    avatar: initials || 'U',
    level: 'Beginner',
    totalWritings: 0,
    totalWords: 0,
    streakDays: 0,
    joinedAt: new Date().toISOString().slice(0, 10),
  }
}
