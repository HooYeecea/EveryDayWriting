/** 测评状态：not_started | skipped | in_progress | completed */
export type ProficiencyTestStatus =
  | 'not_started'
  | 'skipped'
  | 'in_progress'
  | 'completed'

/** 测评阶段：A 自评 / B 客观题 / C 短写作 / done */
export type ProficiencyStage = 'A' | 'B' | 'C' | 'done'

export type WritingSlot = 'easy' | 'hard'
export type DifficultyBand = 'easy' | 'medium' | 'hard'

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
  /** easy | medium | hard */
  difficultyBand?: DifficultyBand | string
  content: ObjectiveQuestionContent | string | null
  sortOrder: number
}

export interface ObjectiveQuestionsResponse {
  testId: string
  totalCount?: number
  difficultyCurve?: string
  questions: ObjectiveQuestion[]
}

export interface SubmitObjectiveAnswersResponse {
  testId: string
  currentStage: ProficiencyStage
  correctCount: number
  totalCount: number
  objectiveScore: number
  bandBreakdown?: Record<string, { correct?: number; total?: number }>
}

export interface WritingTask {
  slot: WritingSlot | string
  questionId?: string | null
  difficulty: number
  prompt: string
  instruction?: string | null
  minWords: number
  maxWords: number
  suggestedMinutes?: number
  text?: string | null
  wordCount?: number | null
  submitted?: boolean
}

export interface WritingPromptsResponse {
  testId: string
  tasks: WritingTask[]
}

export interface SubmitWritingResponse {
  testId: string
  totalWordCount: number
  currentStage: ProficiencyStage
  readyForEvaluation: boolean
  tasks: WritingTask[]
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
  writingTasks?: unknown
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
