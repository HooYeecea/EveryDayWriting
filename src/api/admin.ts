import { API_PATHS } from './config'
import { del, get, post, put } from './request'
import type { PaginatedData } from './types'

export interface AdminRoleBrief {
  id: string
  name: string
}

export interface AdminUserListItem {
  id: string
  email: string
  nickname: string
  roles: AdminRoleBrief[]
  isBanned: boolean
  vipLevel: number
  totalWritings: number
  lastLoginAt: string | null
  createdAt: string
}

export interface AdminUserDetail {
  profile: {
    id: string
    email: string
    nickname: string
    avatar: string | null
    roles: AdminRoleBrief[]
    isBanned: boolean
    banReason: string | null
    bannedAt: string | null
    banExpiry: string | null
    vipLevel: number
    vipExpiry: string | null
    ipAddress: string | null
    locationText: string | null
    createdAt: string
  }
  writingStats: {
    totalSubmits: number
    averageScore: number
    highestScore: number
    lowestScore: number
    totalWords: number
  }
  recentSubmits: Array<{
    id: string
    title: string
    topicType: string
    aiScore: number | null
    wordCount: number
    submittedAt: string
  }>
  loginLogs: Array<{
    loginAt: string
    ipAddress: string
    ipLocation: string | null
    userAgent: string
  }>
  dailyUsage: Array<{
    date: string
    totalSeconds: number
    requestCount: number
  }>
  scoreTrend: Array<{ date: string; score: number }>
}

export interface AdminAnnouncementListItem {
  id: string
  title: string
  priority: string
  isPublished: boolean
  publishedAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string | null
}

export interface AdminConfigItem {
  key: string
  value: string
  description: string
  updatedAt: string
}

export interface AdminQuoteItem {
  id: string
  content: string
  category: string
  isEnabled: boolean
  sortOrder: number
  createdAt: string
}

export interface AdminCheckInTierItem {
  id: string
  name: string
  minDays: number
  iconUrl: string
  sortOrder: number
  createdAt: string
  updatedAt: string | null
}

export interface AdminTopicTypeItem {
  id: number
  name: string
  description: string | null
  sortOrder: number
  isEnabled: boolean
  topicCount: number
  createdAt: string
  updatedAt: string | null
}

export interface AdminTokenUsageItem {
  id: string
  userId: string
  userEmail: string
  providerId: string
  modelId: string
  purpose: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  createdAt: string
}

export interface AdminAuditLogItem {
  id: string
  adminUser: { id: string; email: string }
  action: string
  targetUserId: string | null
  details: string
  ipAddress: string
  createdAt: string
}

export interface AdminProviderItem {
  id: string
  name: string
  baseUrl: string
  isEnabled: boolean
  sortOrder: number
  modelCount: number
  updatedAt: string
}

export interface AdminProviderModel {
  id: string
  name: string
  isDefault: boolean
  capabilities: string[] | unknown
  maxTokens: number
  requestTemplate: unknown
  responseMapping: unknown
  isEnabled: boolean
}

export interface AdminProviderDetail {
  id: string
  name: string
  baseUrl: string
  authHeader: string
  isEnabled: boolean
  sortOrder: number
  models: AdminProviderModel[]
}

export interface AdminRoleItem {
  id: string
  name: string
  description: string
  isSystem: boolean
  userCount: number
  permissionCount: number
}

export interface AdminPermissionItem {
  id: string
  code: string
  name: string
  group: string
}

export interface AdminRoleDetail {
  id: string
  name: string
  description: string
  isSystem: boolean
  permissions: AdminPermissionItem[]
}

export interface AdminAgreementListItem {
  id: string
  type: string
  title: string
  version: number
  publishedAt: string
  effectiveAt: string
  publishedBy: { id: string; email: string }
  acceptanceCount: number
}

// ── Users ──

export async function listAdminUsers(params?: {
  page?: number
  pageSize?: number
  search?: string
  roleId?: string
  isBanned?: boolean
  vipLevel?: number
  sortBy?: string
  order?: string
}): Promise<PaginatedData<AdminUserListItem>> {
  return get(API_PATHS.admin.users, { params })
}

export async function getAdminUserDetail(id: string): Promise<AdminUserDetail> {
  return get(API_PATHS.admin.userById(id))
}

export async function banAdminUser(id: string, reason: string, duration?: number): Promise<void> {
  await put(API_PATHS.admin.banUser(id), { reason, duration })
}

export async function unbanAdminUser(id: string, note?: string): Promise<void> {
  await put(API_PATHS.admin.unbanUser(id), { note })
}

export async function updateAdminUserVip(
  id: string,
  vipLevel: number,
  vipExpiry?: string | null,
): Promise<void> {
  await put(API_PATHS.admin.vipUser(id), { vipLevel, vipExpiry })
}

export async function assignAdminUserRoles(userId: string, roleIds: string[]): Promise<void> {
  await put(API_PATHS.admin.userRoles(userId), { roleIds })
}

// ── Audit ──

export async function listAdminAuditLogs(params?: {
  page?: number
  pageSize?: number
  adminId?: string
  action?: string
  from?: string
  to?: string
}): Promise<PaginatedData<AdminAuditLogItem>> {
  return get(API_PATHS.admin.auditLogs, { params })
}

// ── Providers / Models ──

export async function listAdminProviders(): Promise<{
  items: AdminProviderItem[]
  totalCount: number
}> {
  return get(API_PATHS.admin.providers)
}

export async function getAdminProvider(providerId: string): Promise<AdminProviderDetail> {
  return get(API_PATHS.admin.providerById(providerId))
}

export async function upsertAdminProvider(body: {
  id: string
  name: string
  baseUrl: string
  authHeader: string
  sortOrder?: number
}): Promise<void> {
  await post(API_PATHS.admin.providers, body)
}

export async function toggleAdminProvider(id: string, isEnabled: boolean): Promise<void> {
  await put(API_PATHS.admin.toggleProvider(id), { isEnabled })
}

export async function deleteAdminProvider(providerId: string): Promise<void> {
  await del(API_PATHS.admin.providerById(providerId))
}

export async function upsertAdminModel(
  providerId: string,
  body: {
    id: string
    name: string
    isDefault?: boolean
    capabilities?: string[]
    maxTokens?: number
    requestTemplate?: unknown
    responseMapping?: unknown
  },
): Promise<void> {
  await post(API_PATHS.admin.providerModels(providerId), body)
}

export async function toggleAdminModel(
  providerId: string,
  modelId: string,
  isEnabled: boolean,
): Promise<void> {
  await put(API_PATHS.admin.toggleModel(providerId, modelId), { isEnabled })
}

export async function deleteAdminModel(providerId: string, modelId: string): Promise<void> {
  await del(API_PATHS.admin.deleteModel(providerId, modelId))
}

// ── Roles / Permissions ──

export async function listAdminRoles(): Promise<{ items: AdminRoleItem[]; totalCount: number }> {
  return get(API_PATHS.admin.roles)
}

export async function getAdminRole(roleId: string): Promise<AdminRoleDetail> {
  return get(API_PATHS.admin.roleById(roleId))
}

export async function createAdminRole(body: {
  name: string
  description?: string
  permissionIds?: string[]
}): Promise<void> {
  await post(API_PATHS.admin.roles, body)
}

export async function updateAdminRole(
  roleId: string,
  body: { description?: string; permissionIds?: string[] },
): Promise<void> {
  await put(API_PATHS.admin.roleById(roleId), body)
}

export async function deleteAdminRole(roleId: string): Promise<void> {
  await del(API_PATHS.admin.roleById(roleId))
}

export async function listAdminPermissions(): Promise<{ items: AdminPermissionItem[] }> {
  return get(API_PATHS.admin.permissions)
}

// ── Configs ──

export async function listAdminConfigs(): Promise<{ items: AdminConfigItem[] }> {
  return get(API_PATHS.admin.configs)
}

export async function updateAdminConfig(key: string, value: string): Promise<void> {
  await put(API_PATHS.admin.configByKey(key), { value })
}

// ── Quotes ──

export async function listAdminQuotes(params?: {
  category?: string
  isEnabled?: boolean
}): Promise<{ items: AdminQuoteItem[]; totalCount: number }> {
  return get(API_PATHS.admin.quotes, { params })
}

export async function createAdminQuote(body: {
  content: string
  category: string
  sortOrder?: number
}): Promise<void> {
  await post(API_PATHS.admin.quotes, body)
}

export async function updateAdminQuote(
  id: string,
  body: { content?: string; isEnabled?: boolean; sortOrder?: number },
): Promise<void> {
  await put(API_PATHS.admin.quoteById(id), body)
}

export async function deleteAdminQuote(id: string): Promise<void> {
  await del(API_PATHS.admin.quoteById(id))
}

// ── Check-in tiers ──

export async function listAdminCheckInTiers(): Promise<{
  items: AdminCheckInTierItem[]
  totalCount: number
}> {
  return get(API_PATHS.admin.checkinTiers)
}

export async function createAdminCheckInTier(body: {
  name: string
  minDays: number
  iconUrl?: string
  sortOrder?: number
}): Promise<void> {
  await post(API_PATHS.admin.checkinTiers, body)
}

export async function updateAdminCheckInTier(
  id: string,
  body: { name: string; minDays: number; iconUrl?: string; sortOrder: number },
): Promise<void> {
  await put(API_PATHS.admin.checkinTierById(id), body)
}

export async function deleteAdminCheckInTier(id: string): Promise<void> {
  await del(API_PATHS.admin.checkinTierById(id))
}

export async function reorderAdminCheckInTiers(tierIds: string[]): Promise<void> {
  await put(API_PATHS.admin.reorderTiers, { tierIds })
}

// ── Topic types ──

export async function listAdminTopicTypes(): Promise<{
  items: AdminTopicTypeItem[]
  totalCount: number
}> {
  return get(API_PATHS.admin.topicTypes)
}

export async function createAdminTopicType(body: {
  name: string
  description?: string
  sortOrder?: number
  isEnabled?: boolean
}): Promise<void> {
  await post(API_PATHS.admin.topicTypes, body)
}

export async function updateAdminTopicType(
  id: number,
  body: { name: string; description?: string; sortOrder: number; isEnabled: boolean },
): Promise<void> {
  await put(API_PATHS.admin.topicTypeById(id), body)
}

export async function deleteAdminTopicType(id: number): Promise<void> {
  await del(API_PATHS.admin.topicTypeById(id))
}

// ── Token usage ──

export async function listAdminTokenUsage(params?: {
  page?: number
  pageSize?: number
  from?: string
  to?: string
}): Promise<{
  items: AdminTokenUsageItem[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  totalTokens: number
}> {
  return get(API_PATHS.admin.tokenUsage, { params })
}

// ── Announcements ──

export async function listAdminAnnouncements(params?: {
  page?: number
  pageSize?: number
}): Promise<PaginatedData<AdminAnnouncementListItem>> {
  return get(API_PATHS.admin.announcements, { params })
}

export async function createAdminAnnouncement(body: {
  title: string
  content: string
  priority?: string
  isPublished: boolean
  expiresAt?: string | null
}): Promise<{ id: string; title: string }> {
  return post(API_PATHS.admin.announcements, body)
}

export async function updateAdminAnnouncement(
  id: string,
  body: {
    title: string
    content: string
    priority?: string
    isPublished: boolean
    expiresAt?: string | null
  },
): Promise<void> {
  await put(API_PATHS.admin.announcementById(id), body)
}

export async function deleteAdminAnnouncement(id: string): Promise<void> {
  await del(API_PATHS.admin.announcementById(id))
}

// ── Agreements ──

export async function listAdminAgreements(params?: {
  page?: number
  pageSize?: number
  type?: string
  sortBy?: string
}): Promise<PaginatedData<AdminAgreementListItem>> {
  return get(API_PATHS.admin.agreements, { params })
}

export async function createAdminAgreement(body: {
  type: string
  title: string
  content: string
  effectiveAt: string
}): Promise<void> {
  await post(API_PATHS.admin.agreements, body)
}

export async function updateAdminAgreement(
  id: string,
  body: { title?: string; content?: string; effectiveAt?: string },
): Promise<void> {
  await put(API_PATHS.admin.agreementById(id), body)
}

export async function deleteAdminAgreement(id: string): Promise<void> {
  await del(API_PATHS.admin.agreementById(id))
}

// ── Dashboard / System ──

export type DashboardPeriod = '7d' | '30d' | '90d' | 'all'

export interface AdminDashboardOverview {
  period: DashboardPeriod
  generatedAt: string
  users: {
    total: number
    todayNew: number
    periodNew: number
    banned: number
    vipDistribution: Array<{ vipLevel: number; count: number }>
  }
  activity: {
    todayLogins: number
    todayDau: number
    activeSessions: number
  }
  writing: {
    totalWritings: number
    todayWritings: number
    periodWritings: number
    totalWords: number
    averageScore: number
    scoreDistribution: Record<string, number>
    topicDistribution: Array<{ type: string; count: number }>
  }
  vocabulary: {
    total: number
    periodAdded: number
  }
  checkIn: {
    todayCheckIns: number
  }
  tokenUsage: {
    monthTokens: number
    periodTokens: number
    byPurpose: Array<{ purpose: string; tokens: number; calls: number }>
    byProvider: Array<{ providerId: string; tokens: number; calls: number }>
  }
  trends: {
    registration: Array<{ date: string; count: number }>
    submits: Array<{ date: string; count: number }>
    checkIns: Array<{ date: string; count: number }>
    dau: Array<{ date: string; count: number }>
    tokens: Array<{ date: string; tokens: number }>
  }
}

export interface AdminSystemInfo {
  generatedAt: string
  process: {
    name: string
    pid: number
    startTimeUtc: string | null
    uptimeSeconds: number
    threadCount: number
  }
  memory: {
    workingSetMb: number
    privateMemoryMb: number
    managedMemoryMb: number
    gc: {
      gen0Collections: number
      gen1Collections: number
      gen2Collections: number
      isServerGC: boolean
    }
  }
  cpu: {
    logicalCores: number
    processUsagePercent: number
  }
  disks: Array<{
    name: string
    driveType: string
    format: string
    totalGb: number
    freeGb: number
    usedGb: number
    usedPercent: number
  }>
  runtime: {
    osDescription: string
    osArchitecture: string
    processArchitecture: string
    frameworkDescription: string
    machineName: string
    systemUtcNow: string
  }
  health: {
    database: string
  }
}

export async function getAdminDashboardOverview(
  period: DashboardPeriod = '7d',
): Promise<AdminDashboardOverview> {
  return get(API_PATHS.admin.dashboardOverview, { params: { period } })
}

export async function getAdminSystemInfo(): Promise<AdminSystemInfo> {
  return get(API_PATHS.admin.systemInfo)
}

// ── Prompt Templates ──

export interface AdminPromptListItem {
  id: string
  purpose: string
  vipLevel: number
  name: string
  description: string | null
  version: number
  isEnabled: boolean
  updatedAt: string
  updatedBy: { id: string; email: string } | null
}

export interface AdminPromptDetail {
  id: string
  purpose: string
  vipLevel: number
  name: string
  content: string
  description: string | null
  version: number
  isEnabled: boolean
  createdAt: string
  updatedAt: string
  updatedBy: { id: string; email: string } | null
}

export interface AdminPromptHistoryItem {
  version: number
  content: string
  changeNote: string | null
  createdAt: string
  createdBy: { id: string; email: string } | null
}

export interface AdminPromptTestResult {
  aiResponse: string
  tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number }
  latencyMs: number
}

export async function listAdminPrompts(params?: {
  purpose?: string
  vipLevel?: number
  isEnabled?: boolean
}): Promise<{ items: AdminPromptListItem[]; totalCount: number }> {
  return get(API_PATHS.admin.prompts, { params })
}

export async function getAdminPrompt(id: string): Promise<AdminPromptDetail> {
  return get(API_PATHS.admin.promptById(id))
}

export async function updateAdminPrompt(
  id: string,
  body: { name?: string; content?: string; description?: string; isEnabled?: boolean; changeNote?: string },
): Promise<{ id: string; version: number; updatedAt: string }> {
  return put(API_PATHS.admin.promptById(id), body)
}

export async function getAdminPromptHistory(id: string): Promise<{
  items: AdminPromptHistoryItem[]
  totalCount: number
}> {
  return get(API_PATHS.admin.promptHistory(id))
}

export async function testAdminPrompt(
  id: string,
  body: { testContent: string; providerId?: string; modelId?: string },
): Promise<AdminPromptTestResult> {
  return post(API_PATHS.admin.promptTest(id), body)
}

export async function rollbackAdminPrompt(
  id: string,
  targetVersion: number,
): Promise<{ id: string; version: number; updatedAt: string }> {
  return post(API_PATHS.admin.promptRollback(id), { targetVersion })
}

// ── Question Bank ──

export interface AdminQuestionListItem {
  id: string
  stepNumber: number
  questionType: string
  examType: string
  difficulty: number
  content: unknown
  isEnabled: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminQuestionExportResult {
  exportedAt: string
  filters: Record<string, unknown>
  totalCount: number
  questions: Array<{
    stepNumber: number
    questionType: string
    examType: string
    difficulty: number
    content: unknown
    answer: unknown
  }>
}

export async function listAdminQuestions(params?: {
  page?: number
  pageSize?: number
  stepNumber?: number
  questionType?: string
  examType?: string
  difficulty?: number
  isEnabled?: boolean
}): Promise<{
  items: AdminQuestionListItem[]
  page: number; pageSize: number; totalCount: number; totalPages: number
}> {
  return get(API_PATHS.admin.questions, { params })
}

export async function createAdminQuestion(body: {
  stepNumber: number
  questionType: string
  examType?: string
  difficulty: number
  content: unknown
  answer: unknown
}): Promise<{ id: string }> {
  return post(API_PATHS.admin.questions, body)
}

export async function updateAdminQuestion(
  id: string,
  body: {
    stepNumber?: number
    questionType?: string
    examType?: string
    difficulty?: number
    content?: unknown
    answer?: unknown
  },
): Promise<void> {
  await put(API_PATHS.admin.questionById(id), body)
}

export async function toggleAdminQuestion(id: string, isEnabled: boolean): Promise<void> {
  await put(API_PATHS.admin.questionToggle(id), { isEnabled })
}

export async function deleteAdminQuestion(id: string): Promise<void> {
  await del(API_PATHS.admin.questionById(id))
}

export async function batchCreateAdminQuestions(questions: Array<{
  stepNumber: number
  questionType: string
  examType?: string
  difficulty: number
  content: unknown
  answer: unknown
}>): Promise<{
  total: number; success: number; failed: number
  errors: Array<{ index: number; message: string }>
  successIds: string[]
}> {
  return post(API_PATHS.admin.questionsBatch, { questions })
}

export async function exportAdminQuestions(params?: {
  format?: string
  examType?: string
  stepNumber?: number
  questionType?: string
  isEnabled?: boolean
}): Promise<AdminQuestionExportResult | Blob> {
  if (params?.format === 'xlsx' || params?.format === 'csv') {
    // For file downloads, fetch directly
    const { getApiBaseUrl } = await import('./config')
    const base = getApiBaseUrl()
    const searchParams = new URLSearchParams()
    for (const [k, v] of Object.entries(params ?? {})) {
      if (v !== undefined && v !== null && v !== '') searchParams.set(k, String(v))
    }
    const url = `${base}${API_PATHS.admin.questionsExport}?${searchParams.toString()}`
    const token = (await import('../storage/tokenStorage')).getToken()
    const resp = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    return resp.blob()
  }
  return get(API_PATHS.admin.questionsExport, { params })
}

export async function downloadQuestionsTemplate(): Promise<Blob> {
  const { getApiBaseUrl } = await import('./config')
  const base = getApiBaseUrl()
  const url = `${base}${API_PATHS.admin.questionsTemplate}`
  const token = (await import('../storage/tokenStorage')).getToken()
  const resp = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  return resp.blob()
}

