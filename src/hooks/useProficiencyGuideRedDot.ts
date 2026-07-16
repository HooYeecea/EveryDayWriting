import { useEffect, useState } from 'react'
import { getProficiencyStatus } from '../api/proficiencyTest'
import { useAuth } from '../context/AuthContext'
import type { ProficiencyTestStatus } from '../types/proficiencyTest'

/** 未完成能力测评时，在「使用指南」菜单显示红点 */
export function useProficiencyGuideRedDot(): boolean {
  const { isAuthenticated, user } = useAuth()
  const profileStatus = user?.proficiencyOnboarding?.status
  const [fetchedStatus, setFetchedStatus] = useState<ProficiencyTestStatus | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setFetchedStatus(null)
      return
    }
    if (profileStatus != null) return

    let cancelled = false
    void getProficiencyStatus()
      .then((data) => {
        if (!cancelled) setFetchedStatus(data.status)
      })
      .catch(() => {
        if (!cancelled) setFetchedStatus(null)
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, profileStatus])

  const status = profileStatus ?? fetchedStatus
  return isAuthenticated && status != null && status !== 'completed'
}
