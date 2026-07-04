import { API_PATHS } from './config'
import { get } from './request'
import type { AssessmentStats } from '../types'

export type AssessmentPeriod = 'all' | '7d' | '30d' | '90d'

export async function getAssessmentStats(period: AssessmentPeriod = 'all'): Promise<AssessmentStats> {
  return get<AssessmentStats>(API_PATHS.assessment.stats, {
    params: { period },
  })
}
