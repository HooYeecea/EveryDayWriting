import { useEffect, useState } from 'react'
import { Activity, Database, HardDrive, MemoryStick, Server } from 'lucide-react'
import { getAdminSystemInfo, type AdminSystemInfo } from '../../../api/admin'
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

function formatUptime(seconds: number): string {
  if (!seconds || seconds < 0) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d} 天 ${h} 小时`
  if (h > 0) return `${h} 小时 ${m} 分`
  return `${m} 分钟`
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-3">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-neutral-900">{value}</p>
    </div>
  )
}

export function AdminSystemPage() {
  const { permissions } = useAuth()
  const canView = hasPermission(permissions, 'monitor:view')
  const [data, setData] = useState<AdminSystemInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    if (!canView) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      setData(await getAdminSystemInfo())
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载系统信息失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [canView])

  if (!canView) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <AdminPageHeader title="系统监控" description="需要 monitor:view 权限" />
        <AdminPageBody>
          <AdminCard>
            <AdminEmpty message="当前账号没有系统监控权限" />
          </AdminCard>
        </AdminPageBody>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        title="系统监控"
        description={
          data
            ? `运行环境快照 · ${new Date(data.generatedAt).toLocaleString('zh-CN')}`
            : '进程、内存、CPU、磁盘与数据库健康状态'
        }
        actions={
          <AdminGhostButton onClick={() => void load()} disabled={loading}>
            刷新
          </AdminGhostButton>
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
            <AdminEmpty message={loading ? '正在采集系统信息…' : '暂无数据'} />
          </AdminCard>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center gap-2 text-neutral-500">
                  <Database size={16} />
                  <span className="text-xs">数据库</span>
                </div>
                <p className="mt-2 text-xl font-semibold text-neutral-900">
                  {data.health.database === 'healthy' ? '健康' : '异常'}
                </p>
                <p className="mt-1 font-mono text-xs text-neutral-400">{data.health.database}</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center gap-2 text-neutral-500">
                  <Activity size={16} />
                  <span className="text-xs">进程 CPU</span>
                </div>
                <p className="mt-2 text-xl font-semibold text-neutral-900">
                  {data.cpu.processUsagePercent}%
                </p>
                <p className="mt-1 text-xs text-neutral-400">{data.cpu.logicalCores} 逻辑核心</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center gap-2 text-neutral-500">
                  <MemoryStick size={16} />
                  <span className="text-xs">工作集内存</span>
                </div>
                <p className="mt-2 text-xl font-semibold text-neutral-900">
                  {data.memory.workingSetMb} MB
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  托管 {data.memory.managedMemoryMb} MB
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center gap-2 text-neutral-500">
                  <Server size={16} />
                  <span className="text-xs">运行时长</span>
                </div>
                <p className="mt-2 text-xl font-semibold text-neutral-900">
                  {formatUptime(data.process.uptimeSeconds)}
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  PID {data.process.pid} · {data.process.threadCount} 线程
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <AdminCard>
                <h3 className="font-sans text-sm font-medium text-neutral-900">进程</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Metric label="进程名" value={data.process.name} />
                  <Metric label="线程数" value={String(data.process.threadCount)} />
                  <Metric
                    label="启动时间 (UTC)"
                    value={
                      data.process.startTimeUtc
                        ? new Date(data.process.startTimeUtc).toLocaleString('zh-CN')
                        : '—'
                    }
                  />
                  <Metric label="运行秒数" value={formatCount(data.process.uptimeSeconds)} />
                </div>
              </AdminCard>

              <AdminCard>
                <h3 className="font-sans text-sm font-medium text-neutral-900">内存 / GC</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Metric label="Working Set" value={`${data.memory.workingSetMb} MB`} />
                  <Metric label="Private Memory" value={`${data.memory.privateMemoryMb} MB`} />
                  <Metric label="Managed Heap" value={`${data.memory.managedMemoryMb} MB`} />
                  <Metric
                    label="GC (gen0/1/2)"
                    value={`${data.memory.gc.gen0Collections}/${data.memory.gc.gen1Collections}/${data.memory.gc.gen2Collections}`}
                  />
                  <Metric label="Server GC" value={data.memory.gc.isServerGC ? '是' : '否'} />
                </div>
              </AdminCard>
            </div>

            <AdminCard>
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-neutral-500" />
                <h3 className="font-sans text-sm font-medium text-neutral-900">磁盘</h3>
              </div>
              {data.disks.length === 0 ? (
                <AdminEmpty message="无法读取磁盘信息（宿主限制）" />
              ) : (
                <div className="mt-4 space-y-3">
                  {data.disks.map((disk) => (
                    <div key={disk.name} className="rounded-xl border border-neutral-100 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-neutral-800">
                          {disk.name}{' '}
                          <span className="text-xs font-normal text-neutral-400">
                            {disk.driveType} · {disk.format}
                          </span>
                        </p>
                        <p className="text-xs text-neutral-500">
                          {disk.usedGb} / {disk.totalGb} GB · {disk.usedPercent}%
                        </p>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-neutral-900"
                          style={{ width: `${Math.min(100, Math.max(0, disk.usedPercent))}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-neutral-400">剩余 {disk.freeGb} GB</p>
                    </div>
                  ))}
                </div>
              )}
            </AdminCard>

            <AdminCard>
              <h3 className="font-sans text-sm font-medium text-neutral-900">运行环境</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Metric label="主机" value={data.runtime.machineName} />
                <Metric label="操作系统" value={data.runtime.osDescription} />
                <Metric label="OS 架构" value={data.runtime.osArchitecture} />
                <Metric label="进程架构" value={data.runtime.processArchitecture} />
                <Metric label="运行时" value={data.runtime.frameworkDescription} />
                <Metric
                  label="系统时间 (UTC)"
                  value={new Date(data.runtime.systemUtcNow).toLocaleString('zh-CN')}
                />
              </div>
            </AdminCard>
          </div>
        )}
      </AdminPageBody>
    </div>
  )
}

function formatCount(value: number): string {
  return value.toLocaleString('zh-CN')
}
