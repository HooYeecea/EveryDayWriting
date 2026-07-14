import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Ban,
  Bell,
  Cpu,
  FileText,
  Gauge,
  PenLine,
  Shield,
  Users,
} from 'lucide-react'
import {
  listAdminAnnouncements,
  listAdminAuditLogs,
  listAdminProviders,
  listAdminRoles,
  listAdminTokenUsage,
  listAdminTopicTypes,
  listAdminUsers,
  type AdminTokenUsageItem,
} from '../../../api/admin'
import { getVisibleAdminRoutes } from '../../../config/adminRoutes'
import { useAuth } from '../../../context/AuthContext'
import { hasPermission } from '../../../utils/roles'
import {
  AdminCard,
  AdminEmpty,
  AdminError,
  AdminPageBody,
  AdminPageHeader,
} from '../AdminUi'

const CHART_NEUTRALS = ['#171717', '#525252', '#737373', '#a3a3a3', '#d4d4d4', '#404040']

interface DashboardStats {
  userTotal: number | null
  bannedTotal: number | null
  vipTotal: number | null
  writingsOnSample: number | null
  sampleUserCount: number
  tokenTotal: number | null
  tokenCalls: number | null
  announcementTotal: number | null
  publishedAnnouncements: number | null
  providerTotal: number | null
  modelTotal: number | null
  topicTypeTotal: number | null
  roleTotal: number | null
  recentAudit: number | null
  tokenByDay: Array<{ date: string; tokens: number }>
  tokenByPurpose: Array<{ name: string; value: number }>
  vipDistribution: Array<{ name: string; value: number }>
}

const EMPTY_STATS: DashboardStats = {
  userTotal: null,
  bannedTotal: null,
  vipTotal: null,
  writingsOnSample: null,
  sampleUserCount: 0,
  tokenTotal: null,
  tokenCalls: null,
  announcementTotal: null,
  publishedAnnouncements: null,
  providerTotal: null,
  modelTotal: null,
  topicTypeTotal: null,
  roleTotal: null,
  recentAudit: null,
  tokenByDay: [],
  tokenByPurpose: [],
  vipDistribution: [],
}

function buildTokenByDay(items: AdminTokenUsageItem[]) {
  const map = new Map<string, number>()
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    map.set(d.toISOString().slice(0, 10), 0)
  }
  for (const item of items) {
    const key = new Date(item.createdAt).toISOString().slice(0, 10)
    if (!map.has(key)) continue
    map.set(key, (map.get(key) ?? 0) + item.totalTokens)
  }
  return [...map.entries()].map(([date, tokens]) => ({
    date: date.slice(5),
    tokens,
  }))
}

function buildTokenByPurpose(items: AdminTokenUsageItem[]) {
  const map = new Map<string, number>()
  for (const item of items) {
    const key = item.purpose || 'other'
    map.set(key, (map.get(key) ?? 0) + item.totalTokens)
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  hint?: string
  icon: typeof Users
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-neutral-400">{label}</p>
          <p className="mt-2 font-sans text-2xl font-semibold tracking-tight text-neutral-900">
            {value}
          </p>
          {hint ? <p className="mt-1 text-xs text-neutral-400">{hint}</p> : null}
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
          <Icon size={18} strokeWidth={1.75} />
        </span>
      </div>
    </div>
  )
}

function formatCount(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toLocaleString('zh-CN')
}

export function AdminDashboardPage() {
  const { permissions } = useAuth()
  const links = getVisibleAdminRoutes(permissions).filter((route) => route.path !== '/admin')
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      const next: DashboardStats = { ...EMPTY_STATS, tokenByDay: [], tokenByPurpose: [], vipDistribution: [] }

      const tasks: Array<Promise<void>> = []

      if (hasPermission(permissions, 'user:list')) {
        tasks.push(
          (async () => {
            const [all, banned, usersPage] = await Promise.all([
              listAdminUsers({ page: 1, pageSize: 1 }),
              listAdminUsers({ page: 1, pageSize: 1, isBanned: true }),
              listAdminUsers({ page: 1, pageSize: 100 }),
            ])
            next.userTotal = all.totalCount
            next.bannedTotal = banned.totalCount
            next.sampleUserCount = usersPage.items.length
            next.writingsOnSample = usersPage.items.reduce(
              (sum, item) => sum + (item.totalWritings || 0),
              0,
            )
            next.vipTotal = usersPage.items.filter((item) => item.vipLevel > 0).length
            const vipMap = new Map<string, number>()
            for (const item of usersPage.items) {
              const label = item.vipLevel > 0 ? `VIP ${item.vipLevel}` : '普通用户'
              vipMap.set(label, (vipMap.get(label) ?? 0) + 1)
            }
            next.vipDistribution = [...vipMap.entries()].map(([name, value]) => ({ name, value }))
          })(),
        )
      }

      if (hasPermission(permissions, 'token_usage:view')) {
        tasks.push(
          (async () => {
            const data = await listAdminTokenUsage({ page: 1, pageSize: 100 })
            next.tokenTotal = data.totalTokens
            next.tokenCalls = data.totalCount
            next.tokenByDay = buildTokenByDay(data.items)
            next.tokenByPurpose = buildTokenByPurpose(data.items)
          })(),
        )
      }

      if (hasPermission(permissions, 'announcement:manage')) {
        tasks.push(
          (async () => {
            const data = await listAdminAnnouncements({ page: 1, pageSize: 100 })
            next.announcementTotal = data.totalCount
            next.publishedAnnouncements = data.items.filter((item) => item.isPublished).length
          })(),
        )
      }

      if (hasPermission(permissions, 'provider:manage')) {
        tasks.push(
          (async () => {
            const data = await listAdminProviders()
            next.providerTotal = data.totalCount
            next.modelTotal = data.items.reduce((sum, item) => sum + (item.modelCount || 0), 0)
          })(),
        )
      }

      if (hasPermission(permissions, 'topic_type:manage')) {
        tasks.push(
          (async () => {
            const data = await listAdminTopicTypes()
            next.topicTypeTotal = data.totalCount
          })(),
        )
      }

      if (hasPermission(permissions, 'role:manage')) {
        tasks.push(
          (async () => {
            const data = await listAdminRoles()
            next.roleTotal = data.totalCount
          })(),
        )
      }

      if (hasPermission(permissions, 'audit:view')) {
        tasks.push(
          (async () => {
            const data = await listAdminAuditLogs({ page: 1, pageSize: 1 })
            next.recentAudit = data.totalCount
          })(),
        )
      }

      const results = await Promise.allSettled(tasks)
      if (cancelled) return

      const failed = results.filter((item) => item.status === 'rejected').length
      if (failed > 0 && failed === results.length) {
        setError('数据中心加载失败，请检查权限或稍后重试')
      } else if (failed > 0) {
        setError(`部分指标加载失败（${failed}/${results.length}），已展示可用数据`)
      }
      setStats({ ...next })
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [permissions])

  const hasCharts = useMemo(
    () => stats.tokenByDay.some((d) => d.tokens > 0) || stats.tokenByPurpose.length > 0 || stats.vipDistribution.length > 0,
    [stats],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        title="数据中心"
        description="系统核心运营指标总览（按你当前权限聚合现有管理接口）"
      />
      <AdminPageBody>
        {error ? (
          <div className="mb-4">
            <AdminError message={error} />
          </div>
        ) : null}

        {loading ? (
          <AdminCard>
            <AdminEmpty message="正在汇总数据中心…" />
          </AdminCard>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="注册用户"
                value={formatCount(stats.userTotal)}
                hint={
                  stats.bannedTotal != null
                    ? `封禁 ${stats.bannedTotal.toLocaleString('zh-CN')}`
                    : undefined
                }
                icon={Users}
              />
              <StatCard
                label="样本用户写作量"
                value={formatCount(stats.writingsOnSample)}
                hint={
                  stats.sampleUserCount > 0
                    ? `取自最近 ${stats.sampleUserCount} 名用户合计`
                    : '需 user:list 权限'
                }
                icon={PenLine}
              />
              <StatCard
                label="Token 总消耗"
                value={formatCount(stats.tokenTotal)}
                hint={
                  stats.tokenCalls != null
                    ? `${stats.tokenCalls.toLocaleString('zh-CN')} 次调用`
                    : undefined
                }
                icon={Gauge}
              />
              <StatCard
                label="已封禁用户"
                value={formatCount(stats.bannedTotal)}
                hint={
                  stats.vipTotal != null
                    ? `样本 VIP ${stats.vipTotal.toLocaleString('zh-CN')}`
                    : undefined
                }
                icon={Ban}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="公告"
                value={formatCount(stats.announcementTotal)}
                hint={
                  stats.publishedAnnouncements != null
                    ? `已发布 ${stats.publishedAnnouncements}`
                    : undefined
                }
                icon={Bell}
              />
              <StatCard
                label="模型供应商"
                value={formatCount(stats.providerTotal)}
                hint={
                  stats.modelTotal != null
                    ? `${stats.modelTotal} 个模型`
                    : undefined
                }
                icon={Cpu}
              />
              <StatCard
                label="题目类型"
                value={formatCount(stats.topicTypeTotal)}
                icon={FileText}
              />
              <StatCard
                label="角色 / 审计"
                value={
                  stats.roleTotal != null || stats.recentAudit != null
                    ? `${formatCount(stats.roleTotal)} / ${formatCount(stats.recentAudit)}`
                    : '—'
                }
                hint="角色数 / 审计条数"
                icon={Shield}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
              <AdminCard className="lg:col-span-3">
                <h3 className="font-sans text-sm font-medium text-neutral-900">近 7 日 Token 消耗</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  基于近期用量明细抽样（最多 100 条）按日聚合
                </p>
                {stats.tokenByDay.some((d) => d.tokens > 0) ? (
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.tokenByDay}>
                        <defs>
                          <linearGradient id="tokenFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#171717" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="#171717" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: '1px solid #e5e5e5',
                            boxShadow: 'none',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="tokens"
                          name="Tokens"
                          stroke="#171717"
                          fill="url(#tokenFill)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <AdminEmpty message="暂无 Token 趋势数据或缺少用量权限" />
                )}
              </AdminCard>

              <AdminCard className="lg:col-span-2">
                <h3 className="font-sans text-sm font-medium text-neutral-900">用途分布</h3>
                <p className="mt-1 text-xs text-neutral-400">近期调用按 purpose 汇总</p>
                {stats.tokenByPurpose.length > 0 ? (
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.tokenByPurpose}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={52}
                          outerRadius={84}
                          paddingAngle={2}
                        >
                          {stats.tokenByPurpose.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={CHART_NEUTRALS[index % CHART_NEUTRALS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: '1px solid #e5e5e5',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <AdminEmpty message="暂无用途分布数据" />
                )}
              </AdminCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <AdminCard>
                <h3 className="font-sans text-sm font-medium text-neutral-900">用户 VIP 分布（样本）</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  来自用户列表最近一页，非全量统计
                </p>
                {stats.vipDistribution.length > 0 ? (
                  <div className="mt-4 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.vipDistribution}>
                        <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: '1px solid #e5e5e5',
                          }}
                        />
                        <Bar dataKey="value" name="人数" fill="#171717" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <AdminEmpty message="暂无用户分布数据" />
                )}
              </AdminCard>

              <AdminCard>
                <h3 className="font-sans text-sm font-medium text-neutral-900">快捷入口</h3>
                <p className="mt-1 text-sm text-neutral-400">仅展示当前角色可管理的模块</p>
                {links.length === 0 ? (
                  <AdminEmpty message="当前账号没有任何可管理的模块权限" />
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {links.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                      >
                        <p className="font-medium text-neutral-900">{item.label}</p>
                        <p className="mt-1 text-xs text-neutral-400">{item.path}</p>
                      </Link>
                    ))}
                  </div>
                )}
                {!hasCharts ? (
                  <p className="mt-4 text-xs text-neutral-400">
                    提示：后续若后端提供统一 dashboard 接口，可补全全站提交量、日活、留存等准确指标。
                  </p>
                ) : null}
              </AdminCard>
            </div>
          </div>
        )}
      </AdminPageBody>
    </div>
  )
}
