import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Globe2, MonitorSmartphone, ShieldAlert, Users } from 'lucide-react'
import {
  getAdminAccessLog,
  getAdminAccessLogDevices,
  getAdminAccessLogGeo,
  getAdminAccessLogOverview,
  getAdminAccessLogTrend,
  listAdminAccessLogs,
  type AccessLogRange,
  type AdminAccessLogDevices,
  type AdminAccessLogGeo,
  type AdminAccessLogItem,
  type AdminAccessLogOverview,
  type AdminAccessLogTrend,
} from '../../../api/admin'
import { useReportReady } from '../../../hooks/useReportReady'
import { AccessLogGeoHeatMap } from '../AccessLogGeoHeatMap'
import {
  AdminCard,
  AdminEmpty,
  AdminError,
  AdminField,
  AdminGhostButton,
  AdminModal,
  AdminPageBody,
  AdminPageHeader,
  AdminPrimaryButton,
  adminInputClass,
} from '../AdminUi'

const RANGES: { id: AccessLogRange; label: string }[] = [
  { id: '7d', label: '近 7 天' },
  { id: '15d', label: '近 15 天' },
  { id: '1m', label: '近 1 月' },
  { id: '3m', label: '近 3 月' },
  { id: '6m', label: '近 6 月' },
]

const CHART_NEUTRALS = ['#171717', '#404040', '#525252', '#737373', '#a3a3a3', '#d4d4d4']

const DEVICE_LABEL: Record<string, string> = {
  desktop: '桌面',
  mobile: '手机',
  tablet: '平板',
  unknown: '未知',
}

const EVENT_LABEL: Record<string, string> = {
  login: '登录',
  page_view: '页面',
  api_call: '接口',
}

function formatCount(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toLocaleString('zh-CN')
}

function shortTime(value: string): string {
  if (value.length >= 16) return value.slice(5, 16)
  if (value.length >= 10) return value.slice(5)
  return value
}

function locationText(item: Pick<AdminAccessLogItem, 'country' | 'region' | 'city'>): string {
  return [item.country, item.region, item.city].filter(Boolean).join(' · ') || '—'
}

function deviceLabel(type: string | null | undefined): string {
  if (!type) return '—'
  return DEVICE_LABEL[type] ?? type
}

function eventLabel(type: string | null | undefined): string {
  if (!type) return '—'
  return EVENT_LABEL[type] ?? type
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

type Filters = {
  ip: string
  country: string
  deviceType: string
  eventType: string
  path: string
}

const EMPTY_FILTERS: Filters = {
  ip: '',
  country: '',
  deviceType: '',
  eventType: '',
  path: '',
}

export function AdminAccessLogsPage({ onReady }: { onReady?: () => void } = {}) {
  const [range, setRange] = useState<AccessLogRange>('7d')
  const [overview, setOverview] = useState<AdminAccessLogOverview | null>(null)
  const [trend, setTrend] = useState<AdminAccessLogTrend | null>(null)
  const [countryGeo, setCountryGeo] = useState<AdminAccessLogGeo | null>(null)
  const [provinceGeo, setProvinceGeo] = useState<AdminAccessLogGeo | null>(null)
  const [devices, setDevices] = useState<AdminAccessLogDevices | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS)
  const [items, setItems] = useState<AdminAccessLogItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')

  const [detail, setDetail] = useState<AdminAccessLogItem | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    setStatsError('')
    try {
      const [overviewData, trendData, countryData, provinceData, devicesData] = await Promise.all([
        getAdminAccessLogOverview({ range }),
        getAdminAccessLogTrend({ range, granularity: 'day' }),
        getAdminAccessLogGeo({ range, level: 'country' }),
        getAdminAccessLogGeo({ range, level: 'province', country: '中国' }),
        getAdminAccessLogDevices({ range }),
      ])
      setOverview(overviewData)
      setTrend(trendData)
      setCountryGeo(countryData)
      setProvinceGeo(provinceData)
      setDevices(devicesData)
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : '加载访问统计失败')
    } finally {
      setStatsLoading(false)
    }
  }, [range])

  const loadList = useCallback(async () => {
    setListLoading(true)
    setListError('')
    try {
      const data = await listAdminAccessLogs({
        page,
        pageSize: 20,
        ip: applied.ip || undefined,
        country: applied.country || undefined,
        deviceType: applied.deviceType || undefined,
        eventType: applied.eventType || undefined,
        path: applied.path || undefined,
      })
      setItems(data.items)
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.totalCount || 0)
    } catch (err) {
      setListError(err instanceof Error ? err.message : '加载访问明细失败')
    } finally {
      setListLoading(false)
    }
  }, [page, applied])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useReportReady(!statsLoading && !listLoading, onReady)

  const trendChart = useMemo(
    () =>
      (trend?.points ?? []).map((point) => ({
        time: shortTime(point.time),
        总量: point.total,
        登录用户: point.authenticated,
        游客: point.guest,
        登录事件: point.login,
      })),
    [trend],
  )

  const deviceChart = useMemo(
    () =>
      (devices?.byDevice ?? []).map((item) => ({
        name: deviceLabel(item.name),
        value: item.count,
      })),
    [devices],
  )

  const browserChart = useMemo(
    () =>
      (devices?.byBrowser ?? []).slice(0, 8).map((item) => ({
        name: item.name,
        value: item.count,
      })),
    [devices],
  )

  const openDetail = async (id: string) => {
    setDetailLoading(true)
    try {
      const data = await getAdminAccessLog(id)
      setDetail({
        ...data,
        browser:
          data.browser ??
          (data.browserName
            ? data.browserVersion
              ? `${data.browserName} ${data.browserVersion}`
              : data.browserName
            : null),
        os:
          data.os ??
          (data.osName
            ? data.osVersion
              ? `${data.osName} ${data.osVersion}`
              : data.osName
            : null),
      })
    } catch (err) {
      setListError(err instanceof Error ? err.message : '加载详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const applyFilters = () => {
    setPage(1)
    setApplied({
      ip: filters.ip.trim(),
      country: filters.country.trim(),
      deviceType: filters.deviceType,
      eventType: filters.eventType,
      path: filters.path.trim(),
    })
  }

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
    setApplied(EMPTY_FILTERS)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        title="访问记录"
        description="查看系统访问 IP、归属地、设备与趋势"
        actions={
          <div className="flex flex-wrap gap-1.5">
            {RANGES.map((item) => (
              <AdminGhostButton
                key={item.id}
                className={range === item.id ? 'border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800' : ''}
                onClick={() => setRange(item.id)}
              >
                {item.label}
              </AdminGhostButton>
            ))}
          </div>
        }
      />
      <AdminPageBody>
        {statsError ? (
          <div className="mb-4">
            <AdminError message={statsError} />
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="周期访问量"
            value={statsLoading ? '…' : formatCount(overview?.total)}
            hint={`今日 ${formatCount(overview?.todayTotal)}`}
            icon={MonitorSmartphone}
          />
          <StatCard
            label="独立 IP"
            value={statsLoading ? '…' : formatCount(overview?.uniqueIps)}
            hint={`登录 ${formatCount(overview?.loginCount)} 次`}
            icon={Globe2}
          />
          <StatCard
            label="访问用户"
            value={statsLoading ? '…' : formatCount(overview?.uniqueUsers)}
            hint={`游客 ${formatCount(overview?.uniqueGuests)}`}
            icon={Users}
          />
          <StatCard
            label="错误请求"
            value={statsLoading ? '…' : formatCount(overview?.errorCount)}
            hint={
              overview
                ? `错误率 ${(overview.errorRate * 100).toFixed(2)}% · 均耗时 ${overview.avgDurationMs}ms`
                : undefined
            }
            icon={ShieldAlert}
          />
        </div>

        <div className="mt-4">
          <AdminCard>
            <p className="text-sm font-medium text-neutral-800">访问趋势</p>
            <p className="mt-1 text-xs text-neutral-400">按日汇总请求量、登录用户与游客</p>
            {statsLoading ? (
              <AdminEmpty message="加载中…" />
            ) : trendChart.length === 0 ? (
              <AdminEmpty message="暂无趋势数据" />
            ) : (
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#a3a3a3' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#a3a3a3' }} allowDecimals={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="总量"
                      stroke="#171717"
                      fill="#d4d4d4"
                      fillOpacity={0.45}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="登录用户"
                      stroke="#525252"
                      fill="transparent"
                      strokeWidth={1.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="游客"
                      stroke="#a3a3a3"
                      fill="transparent"
                      strokeWidth={1.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </AdminCard>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <AdminCard>
            <p className="text-sm font-medium text-neutral-800">设备分布</p>
            <p className="mt-1 text-xs text-neutral-400">桌面 / 手机 / 平板</p>
            {statsLoading ? (
              <AdminEmpty message="加载中…" />
            ) : deviceChart.length === 0 ? (
              <AdminEmpty message="暂无设备数据" />
            ) : (
              <div className="mt-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceChart}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={2}
                    >
                      {deviceChart.map((_, index) => (
                        <Cell key={index} fill={CHART_NEUTRALS[index % CHART_NEUTRALS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-1 flex flex-wrap justify-center gap-3 text-xs text-neutral-500">
                  {deviceChart.map((item, index) => (
                    <span key={item.name} className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2 rounded-sm"
                        style={{ background: CHART_NEUTRALS[index % CHART_NEUTRALS.length] }}
                      />
                      {item.name} {item.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </AdminCard>

          <AdminCard>
            <p className="text-sm font-medium text-neutral-800">浏览器分布</p>
            <p className="mt-1 text-xs text-neutral-400">按浏览器占比</p>
            {statsLoading ? (
              <AdminEmpty message="加载中…" />
            ) : browserChart.length === 0 ? (
              <AdminEmpty message="暂无浏览器数据" />
            ) : (
              <div className="mt-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={browserChart}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={2}
                    >
                      {browserChart.map((_, index) => (
                        <Cell key={index} fill={CHART_NEUTRALS[index % CHART_NEUTRALS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-1 flex flex-wrap justify-center gap-3 text-xs text-neutral-500">
                  {browserChart.map((item, index) => (
                    <span key={item.name} className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2 rounded-sm"
                        style={{ background: CHART_NEUTRALS[index % CHART_NEUTRALS.length] }}
                      />
                      {item.name} {item.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </AdminCard>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <AdminCard>
            <p className="text-sm font-medium text-neutral-800">国家热力图</p>
            <p className="mt-1 text-xs text-neutral-400">颜色越深访问越多，悬停查看数值</p>
            <AccessLogGeoHeatMap kind="country" geo={countryGeo} loading={statsLoading} />
          </AdminCard>

          <AdminCard>
            <p className="text-sm font-medium text-neutral-800">省热力图</p>
            <p className="mt-1 text-xs text-neutral-400">中国各省访问热度（排除内网）</p>
            <AccessLogGeoHeatMap kind="province" geo={provinceGeo} loading={statsLoading} />
          </AdminCard>
        </div>

        <AdminCard className="mt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-800">访问明细</p>
              <p className="mt-1 text-xs text-neutral-400">共 {formatCount(totalCount)} 条</p>
            </div>
            <div className="flex gap-2">
              <AdminGhostButton onClick={resetFilters}>重置</AdminGhostButton>
              <AdminPrimaryButton onClick={applyFilters}>筛选</AdminPrimaryButton>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <AdminField label="IP">
              <input
                className={adminInputClass}
                value={filters.ip}
                placeholder="如 123.45"
                onChange={(e) => setFilters((prev) => ({ ...prev, ip: e.target.value }))}
              />
            </AdminField>
            <AdminField label="国家/地区">
              <input
                className={adminInputClass}
                value={filters.country}
                placeholder="如 中国"
                onChange={(e) => setFilters((prev) => ({ ...prev, country: e.target.value }))}
              />
            </AdminField>
            <AdminField label="设备">
              <select
                className={adminInputClass}
                value={filters.deviceType}
                onChange={(e) => setFilters((prev) => ({ ...prev, deviceType: e.target.value }))}
              >
                <option value="">全部</option>
                <option value="desktop">桌面</option>
                <option value="mobile">手机</option>
                <option value="tablet">平板</option>
                <option value="unknown">未知</option>
              </select>
            </AdminField>
            <AdminField label="事件">
              <select
                className={adminInputClass}
                value={filters.eventType}
                onChange={(e) => setFilters((prev) => ({ ...prev, eventType: e.target.value }))}
              >
                <option value="">全部</option>
                <option value="login">登录</option>
                <option value="api_call">接口</option>
                <option value="page_view">页面</option>
              </select>
            </AdminField>
            <AdminField label="路径">
              <input
                className={adminInputClass}
                value={filters.path}
                placeholder="/api/v1/..."
                onChange={(e) => setFilters((prev) => ({ ...prev, path: e.target.value }))}
              />
            </AdminField>
          </div>
        </AdminCard>

        {listError ? (
          <div className="mt-4">
            <AdminError message={listError} />
          </div>
        ) : null}

        <AdminCard className="mt-4 overflow-hidden p-0 sm:p-0">
          {listLoading ? (
            <AdminEmpty message="加载中…" />
          ) : items.length === 0 ? (
            <AdminEmpty message="暂无访问记录" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">时间</th>
                    <th className="px-4 py-3 font-medium">访问人</th>
                    <th className="px-4 py-3 font-medium">IP / 归属地</th>
                    <th className="px-4 py-3 font-medium">设备</th>
                    <th className="px-4 py-3 font-medium">事件</th>
                    <th className="px-4 py-3 font-medium">路径</th>
                    <th className="px-4 py-3 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                      onClick={() => void openDetail(item.id)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
                        {new Date(item.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-neutral-800">{item.displayName || item.userEmail || '游客'}</p>
                        {item.userEmail && item.displayName ? (
                          <p className="text-xs text-neutral-400">{item.userEmail}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-neutral-700">{item.ip}</p>
                        <p className="text-xs text-neutral-400">{locationText(item)}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-600">
                        <p>{deviceLabel(item.deviceType)}</p>
                        <p className="text-neutral-400">{item.os || item.browser || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                          {eventLabel(item.eventType)}
                        </span>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-neutral-500">
                        {item.method ? `${item.method} ` : ''}
                        {item.path || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500">
                        {item.statusCode ?? '—'}
                        {item.durationMs != null ? ` · ${item.durationMs}ms` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
          <span>
            第 {page} / {totalPages} 页
          </span>
          <div className="flex gap-2">
            <AdminGhostButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              上一页
            </AdminGhostButton>
            <AdminGhostButton
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              下一页
            </AdminGhostButton>
          </div>
        </div>
      </AdminPageBody>

      <AdminModal
        open={Boolean(detail) || detailLoading}
        title="访问详情"
        onClose={() => setDetail(null)}
        size="lg"
      >
        {detailLoading && !detail ? (
          <AdminEmpty message="加载中…" />
        ) : detail ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ['时间', new Date(detail.createdAt).toLocaleString('zh-CN')],
              ['访问人', detail.displayName || detail.userEmail || '游客'],
              ['邮箱', detail.userEmail || '—'],
              ['IP', detail.ip],
              ['归属地', locationText(detail)],
              ['ISP', detail.isp || '—'],
              ['设备', deviceLabel(detail.deviceType)],
              ['系统', detail.os || '—'],
              ['浏览器', detail.browser || '—'],
              ['事件', eventLabel(detail.eventType)],
              ['方法', detail.method || '—'],
              ['路径', detail.path || '—'],
              ['状态码', detail.statusCode?.toString() || '—'],
              ['耗时', detail.durationMs != null ? `${detail.durationMs} ms` : '—'],
              ['Referer', detail.referer || '—'],
              ['Session', detail.sessionId || '—'],
              ['AnonymousId', detail.anonymousId || '—'],
              ['User-Agent', detail.userAgent || '—'],
            ].map(([label, value]) => (
              <div key={label} className={label === 'User-Agent' ? 'sm:col-span-2' : ''}>
                <dt className="text-xs uppercase tracking-wide text-neutral-400">{label}</dt>
                <dd className="mt-1 break-all text-sm text-neutral-800">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </AdminModal>
    </div>
  )
}
