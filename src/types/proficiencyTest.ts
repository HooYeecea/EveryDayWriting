/** 测评状态：not_started | skipped | in_progress | completed */
export type ProficiencyTestStatus =
  | 'not_started'
  | 'skipped'
  | 'in_progress'
  | 'completed'

/** 测评阶段：A 自评 / B 客观题 / C 短写作 / done */
export type ProficiencyStage = 'A' | 'B' | 'C' | 'done'

/** profile / 登录后的引导摘要 */
export interface ProficiencyOnboardingBrief {
  status: ProficiencyTestStatus
  showGuideRedDot: boolean
  shouldShowOnboarding: boolean
  overallLevel?: string | null
}

export interface ProficiencyTestStatusResponse {
  status: ProficiencyTestStatus
  showGuideRedDot: boolean
  shouldShowOnboarding: boolean
  activeTestId: string | null
  activeStage: ProficiencyStage | null
  overallLevel: string | null
  overallScore: number | null
  hasActivePlan: boolean
}

export interface SelfAssessmentOption {
  key: string
  label: string
}

export interface SelfAssessmentQuestion {
  id: string
  question: string
  options: SelfAssessmentOption[]
  required?: boolean
}

export interface StartProficiencyTestResponse {
  testId: string
  currentStage: ProficiencyStage
  selfAssessmentQuestions: SelfAssessmentQuestion[]
}

export interface ObjectiveQuestionOption {
  key: string
  text: string
}

export interface ObjectiveQuestionContent {
  sentence?: string
  prompt?: string
  topic?: string
  instruction?: string
  options?: ObjectiveQuestionOption[]
  [key: string]: unknown
}

export interface ObjectiveQuestion {
  id: string
  questionType: string
  difficulty: number
  content: ObjectiveQuestionContent | string | null
  sortOrder: number
}

export interface ObjectiveQuestionsResponse {
  testId: string
  questions: ObjectiveQuestion[]
}

export interface SubmitObjectiveAnswersResponse {
  testId: string
  currentStage: ProficiencyStage
  correctCount: number
  totalCount: number
  objectiveScore: number
}

export interface WritingPromptResponse {
  testId: string
  questionId: string | null
  prompt: string
  instruction?: string | null
  minWords: number
  maxWords: number
  suggestedMinutes?: number
}

export interface SubmitWritingResponse {
  testId: string
  wordCount: number
  currentStage: ProficiencyStage
  readyForEvaluation: boolean
}

export interface EvaluationPayloadResponse {
  testId: string
  userContent: string
  purpose: string
}

export interface ProficiencyDimensionScore {
  score?: number
  level?: string
  comment?: string
}

export interface ProficiencyPlanPhase {
  title?: string
  days?: number
  focus?: string
  tasks?: string[]
  description?: string
  [key: string]: unknown
}

export interface ProficiencyStudyPlanContent {
  title?: string
  goalLevel?: string
  totalDays?: number
  phases?: ProficiencyPlanPhase[]
  weeklyFrequency?: number
  recommendedWordCount?: string
  [key: string]: unknown
}

export interface ProficiencyEvaluationResult {
  overallLevel?: string
  overallScore?: number
  dimensions?: Record<string, ProficiencyDimensionScore>
  strengths?: string[]
  weaknesses?: string[]
  plan?: ProficiencyStudyPlanContent
  summary?: string
  [key: string]: unknown
}

export interface CompleteProficiencyTestResponse {
  testId: string
  overallLevel: string
  overallScore: number
  result: ProficiencyEvaluationResult | null
  planId: string | null
}

export interface ProficiencyResultResponse {
  testId: string
  status: string
  overallLevel: string | null
  overallScore: number | null
  objectiveScore: number | null
  writingWordCount: number | null
  result: ProficiencyEvaluationResult | null
  completedAt: string | null
}

export interface StudyPlanResponse {
  id: string
  testId: string
  title: string
  goalLevel: string
  totalDays: number
  currentPhaseIndex: number
  plan: ProficiencyStudyPlanContent | null
  progress: Record<string, unknown> | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}
