import { useEffect, useState } from 'react'
import { getProficiencyStatus } from '../api/proficiencyTest'
import { useAuth } from '../context/AuthContext'
import type { ProficiencyTestStatus } from '../types/proficiencyTest'

let statusInflight: Promise<ProficiencyTestStatus | null> | null = null
let statusCache: ProficiencyTestStatus | null = null

function fetchSharedProficiencyStatus(): Promise<ProficiencyTestStatus | null> {
  if (statusCache != null) return Promise.resolve(statusCache)
  if (statusInflight) return statusInflight

  statusInflight = getProficiencyStatus()
    .then((data) => {
      statusCache = data.status
      return data.status
    })
    .catch(() => null)
    .finally(() => {
      statusInflight = null
    })

  return statusInflight
}

/** 未完成能力测评时，在「使用指南」菜单显示红点（多处调用共享一次请求） */
export function useProficiencyGuideRedDot(): boolean {
  const { isAuthenticated, user } = useAuth()
  const onboarding = user?.proficiencyOnboarding
  const [fetchedStatus, setFetchedStatus] = useState<ProficiencyTestStatus | null>(
    () => statusCache,
  )

  useEffect(() => {
    if (!isAuthenticated) {
      setFetchedStatus(null)
      return
    }
    if (onboarding != null) return

    let cancelled = false
    void fetchSharedProficiencyStatus().then((status) => {
      if (!cancelled) setFetchedStatus(status)
    })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, onboarding])

  if (!isAuthenticated) return false
  if (onboarding != null) return onboarding.showGuideRedDot

  return fetchedStatus != null && fetchedStatus !== 'completed'
}
