import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BookOpen,
  CalendarDays,
  Gauge,
  PenLine,
  Users,
} from 'lucide-react'
import {
  getAdminDashboardOverview,
  type AdminDashboardOverview,
  type DashboardPeriod,
} from '../../../api/admin'
import { getVisibleAdminRoutes } from '../../../config/adminRoutes'
import { useAuth } from '../../../context/AuthContext'
import { hasPermission } from '../../../utils/roles'
import {
  AdminCard,
  AdminEmpty,
  AdminError,
  AdminGhostButton,
  AdminPageBody,
  AdminPageHeader,
} from '../AdminUi'

const PERIODS: { id: DashboardPeriod; label: string }[] = [
  { id: '7d', label: '近 7 天' },
  { id: '30d', label: '近 30 天' },
  { id: '90d', label: '近 90 天' },
  { id: 'all', label: '全部' },
]

const CHART_NEUTRALS = ['#171717', '#404040', '#525252', '#737373', '#a3a3a3', '#d4d4d4']

function formatCount(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toLocaleString('zh-CN')
}

function shortDate(date: string): string {
  return date.length >= 10 ? date.slice(5) : date
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

export function AdminDashboardPage() {
  const { permissions } = useAuth()
  const canView = hasPermission(permissions, 'dashboard:view')
  const links = getVisibleAdminRoutes(permissions).filter(
    (route) => route.path !== '/admin' && route.path !== '/admin/system',
  )

  const [period, setPeriod] = useState<DashboardPeriod>('7d')
  const [data, setData] = useState<AdminDashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!canView) {
      setLoading(false)
      setData(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    getAdminDashboardOverview(period)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载运营看板失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [canView, period])

  const vipChart = useMemo(
    () =>
      (data?.users.vipDistribution ?? []).map((item) => ({
        name: item.vipLevel > 0 ? `VIP ${item.vipLevel}` : '普通',
        value: item.count,
      })),
    [data],
  )

  const scoreChart = useMemo(
    () =>
      Object.entries(data?.writing.scoreDistribution ?? {}).map(([name, value]) => ({
        name,
        value,
      })),
    [data],
  )

  const topicChart = useMemo(
    () =>
      (data?.writing.topicDistribution ?? []).map((item) => ({
        name: item.type || '未知',
        value: item.count,
      })),
    [data],
  )

  const purposeChart = useMemo(
    () =>
      (data?.tokenUsage.byPurpose ?? []).map((item) => ({
        name: item.purpose || 'other',
        value: item.tokens,
      })),
    [data],
  )

  const trendChart = useMemo(
    () =>
      (data?.trends.registration ?? []).map((item, index) => ({
        date: shortDate(item.date),
        注册: item.count,
        提交: data?.trends.submits[index]?.count ?? 0,
        打卡: data?.trends.checkIns[index]?.count ?? 0,
        DAU: data?.trends.dau[index]?.count ?? 0,
        Tokens: data?.trends.tokens[index]?.tokens ?? 0,
      })),
    [data],
  )

  if (!canView) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <AdminPageHeader title="数据中心" description="需要 dashboard:view 权限" />
        <AdminPageBody>
          <AdminCard>
            <AdminEmpty message="当前账号没有运营看板权限" />
            {links.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {links.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 hover:bg-white"
                  >
                    <p className="font-medium text-neutral-900">{item.label}</p>
                  </Link>
                ))}
              </div>
            ) : null}
          </AdminCard>
        </AdminPageBody>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        title="数据中心"
        description={
          data
            ? `业务总览 · 更新于 ${new Date(data.generatedAt).toLocaleString('zh-CN')}`
            : '全站用户、写作、活跃与 Token 运营指标'
        }
        actions={
          <div className="flex flex-wrap gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
            {PERIODS.map((item) => (
              <AdminGhostButton
                key={item.id}
                className={
                  period === item.id
                    ? 'border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800'
                    : 'border-transparent'
                }
                onClick={() => setPeriod(item.id)}
              >
                {item.label}
              </AdminGhostButton>
            ))}
          </div>
        }
      />
      <AdminPageBody>
        {error ? (
          <div className="mb-4">
            <AdminError message={error} />
          </div>
        ) : null}

        {loading || !data ? (
          <AdminCard>
            <AdminEmpty message={loading ? '正在加载运营数据…' : '暂无数据'} />
          </AdminCard>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="注册用户"
                value={formatCount(data.users.total)}
                hint={`今日新增 ${formatCount(data.users.todayNew)} · 周期新增 ${formatCount(data.users.periodNew)}`}
                icon={Users}
              />
              <StatCard
                label="写作提交"
                value={formatCount(data.writing.totalWritings)}
                hint={`今日 ${formatCount(data.writing.todayWritings)} · 周期 ${formatCount(data.writing.periodWritings)}`}
                icon={PenLine}
              />
              <StatCard
                label="今日活跃"
                value={formatCount(data.activity.todayDau)}
                hint={`登录 ${formatCount(data.activity.todayLogins)} · 会话 ${formatCount(data.activity.activeSessions)}`}
                icon={CalendarDays}
              />
              <StatCard
                label="周期 Token"
                value={formatCount(data.tokenUsage.periodTokens)}
                hint={`本月 ${formatCount(data.tokenUsage.monthTokens)}`}
                icon={Gauge}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="总字数"
                value={formatCount(data.writing.totalWords)}
                hint={`平均分 ${data.writing.averageScore}`}
                icon={BookOpen}
              />
              <StatCard
                label="词库词条"
                value={formatCount(data.vocabulary.total)}
                hint={`周期新增 ${formatCount(data.vocabulary.periodAdded)}`}
                icon={BookOpen}
              />
              <StatCard
                label="今日打卡"
                value={formatCount(data.checkIn.todayCheckIns)}
                icon={CalendarDays}
              />
              <StatCard
                label="封禁用户"
                value={formatCount(data.users.banned)}
                icon={Users}
              />
            </div>

            <AdminCard>
              <h3 className="font-sans text-sm font-medium text-neutral-900">运营趋势</h3>
              <p className="mt-1 text-xs text-neutral-400">注册 / 提交 / 打卡 / DAU（Tokens 见右侧坐标量级不同，单独卡片展示）</p>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendChart}>
                    <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5' }} />
                    <Legend />
                    <Line type="monotone" dataKey="注册" stroke="#171717" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="提交" stroke="#525252" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="打卡" stroke="#737373" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="DAU" stroke="#a3a3a3" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </AdminCard>

            <div className="grid gap-4 lg:grid-cols-5">
              <AdminCard className="lg:col-span-3">
                <h3 className="font-sans text-sm font-medium text-neutral-900">Token 消耗趋势</h3>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendChart}>
                      <defs>
                        <linearGradient id="dashTokenFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#171717" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#171717" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5' }} />
                      <Area type="monotone" dataKey="Tokens" stroke="#171717" fill="url(#dashTokenFill)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </AdminCard>

              <AdminCard className="lg:col-span-2">
                <h3 className="font-sans text-sm font-medium text-neutral-900">用途分布</h3>
                {purposeChart.length > 0 ? (
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={purposeChart} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>
                          {purposeChart.map((entry, index) => (
                            <Cell key={entry.name} fill={CHART_NEUTRALS[index % CHART_NEUTRALS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <AdminEmpty message="暂无用途数据" />
                )}
              </AdminCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <AdminCard>
                <h3 className="font-sans text-sm font-medium text-neutral-900">VIP 分布</h3>
                <div className="mt-4 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vipChart}>
                      <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5' }} />
                      <Bar dataKey="value" name="人数" fill="#171717" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </AdminCard>

              <AdminCard>
                <h3 className="font-sans text-sm font-medium text-neutral-900">分数分布</h3>
                <div className="mt-4 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreChart}>
                      <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#a3a3a3', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5' }} />
                      <Bar dataKey="value" name="篇数" fill="#525252" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </AdminCard>

              <AdminCard>
                <h3 className="font-sans text-sm font-medium text-neutral-900">题型分布</h3>
                {topicChart.length > 0 ? (
                  <div className="mt-4 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={topicChart} dataKey="value" nameKey="name" outerRadius={78}>
                          {topicChart.map((entry, index) => (
                            <Cell key={entry.name} fill={CHART_NEUTRALS[index % CHART_NEUTRALS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <AdminEmpty message="暂无题型数据" />
                )}
              </AdminCard>
            </div>

            {links.length > 0 ? (
              <AdminCard>
                <h3 className="font-sans text-sm font-medium text-neutral-900">快捷入口</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              </AdminCard>
            ) : null}
          </div>
        )}
      </AdminPageBody>
    </div>
  )
}
