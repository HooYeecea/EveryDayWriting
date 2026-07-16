import { API_PATHS } from './config'
import { get, post, put } from './request'
import type {
  CompleteProficiencyTestResponse,
  EvaluationPayloadResponse,
  ObjectiveQuestionsResponse,
  ProficiencyTestStatusResponse,
  StartProficiencyTestResponse,
  StudyPlanResponse,
  SubmitObjectiveAnswersResponse,
  SubmitWritingResponse,
  WritingPromptsResponse,
  ProficiencyResultResponse,
  SelfAssessmentQuestion,
} from '../types/proficiencyTest'

export async function getProficiencyStatus(): Promise<ProficiencyTestStatusResponse> {
  return get<ProficiencyTestStatusResponse>(API_PATHS.proficiencyTest.status)
}

export async function startProficiencyTest(): Promise<StartProficiencyTestResponse> {
  return post<StartProficiencyTestResponse>(API_PATHS.proficiencyTest.start)
}

export async function skipProficiencyTest(): Promise<void> {
  await post(API_PATHS.proficiencyTest.skip)
}

export async function dismissProficiencyRedDot(): Promise<void> {
  await post(API_PATHS.proficiencyTest.dismissRedDot)
}

export async function getSelfAssessmentQuestions(): Promise<SelfAssessmentQuestion[]> {
  const data = await get<{ questions: SelfAssessmentQuestion[] }>(
    API_PATHS.proficiencyTest.selfAssessmentQuestions,
  )
  return data.questions ?? []
}

export async function submitSelfAssessment(
  testId: string,
  answers: Record<string, string>,
): Promise<{ testId: string; currentStage: string }> {
  return post(API_PATHS.proficiencyTest.selfAssessment(testId), { answers })
}

export async function getObjectiveQuestions(testId: string): Promise<ObjectiveQuestionsResponse> {
  return get<ObjectiveQuestionsResponse>(API_PATHS.proficiencyTest.objectiveQuestions(testId))
}

export async function submitObjectiveAnswers(
  testId: string,
  answers: Array<{ questionId: string; answer: string }>,
): Promise<SubmitObjectiveAnswersResponse> {
  return post<SubmitObjectiveAnswersResponse>(API_PATHS.proficiencyTest.objectiveAnswers(testId), {
    answers,
  })
}

export async function getWritingPrompts(testId: string): Promise<WritingPromptsResponse> {
  return get<WritingPromptsResponse>(API_PATHS.proficiencyTest.writingPrompts(testId))
}

export async function submitWritingAnswers(
  testId: string,
  answers: Array<{ slot: string; text: string }>,
): Promise<SubmitWritingResponse> {
  return post<SubmitWritingResponse>(API_PATHS.proficiencyTest.writing(testId), { answers })
}

export async function getEvaluationPayload(testId: string): Promise<EvaluationPayloadResponse> {
  return get<EvaluationPayloadResponse>(API_PATHS.proficiencyTest.evaluationPayload(testId))
}

export async function completeProficiencyTest(
  testId: string,
  result: unknown,
): Promise<CompleteProficiencyTestResponse> {
  return post<CompleteProficiencyTestResponse>(API_PATHS.proficiencyTest.complete(testId), {
    result,
  })
}

export async function getProficiencyResult(testId: string): Promise<ProficiencyResultResponse> {
  return get<ProficiencyResultResponse>(API_PATHS.proficiencyTest.result(testId))
}

export async function getStudyPlan(): Promise<StudyPlanResponse> {
  return get<StudyPlanResponse>(API_PATHS.proficiencyTest.plan)
}

export async function updateStudyPlanProgress(payload: {
  currentPhaseIndex?: number
  progress?: unknown
}): Promise<StudyPlanResponse> {
  return put<StudyPlanResponse>(API_PATHS.proficiencyTest.planProgress, payload)
}
