import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import * as echarts from 'echarts/core'
import { MapChart } from 'echarts/charts'
import { TooltipComponent, VisualMapComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Maximize2, X } from 'lucide-react'
import type { AdminAccessLogGeo } from '../../api/admin'
import { AdminEmpty } from './AdminUi'

echarts.use([MapChart, TooltipComponent, VisualMapComponent, CanvasRenderer])

type HeatMapKind = 'country' | 'province'

type GeoFeatureCollection = {
  type: string
  features: Array<{
    type: string
    properties: Record<string, unknown>
    geometry: unknown
  }>
}

/** 使用本地静态资源，避免第三方 GeoJSON CDN 403 / 跨域限制 */
const GEO_URL: Record<HeatMapKind, string> = {
  province: '/geo/china.json',
  country: '/geo/world.json',
}

const REGISTERED = new Set<string>()

/** 后端短名 → 世界地图英文名（常见国家） */
const COUNTRY_NAME_MAP: Record<string, string> = {
  中国: 'China',
  中华人民共和国: 'China',
  美国: 'United States',
  日本: 'Japan',
  韩国: 'Korea',
  朝鲜: 'Dem. Rep. Korea',
  英国: 'United Kingdom',
  法国: 'France',
  德国: 'Germany',
  俄罗斯: 'Russia',
  加拿大: 'Canada',
  澳大利亚: 'Australia',
  印度: 'India',
  新加坡: 'Singapore',
  马来西亚: 'Malaysia',
  泰国: 'Thailand',
  越南: 'Vietnam',
  菲律宾: 'Philippines',
  印度尼西亚: 'Indonesia',
  意大利: 'Italy',
  西班牙: 'Spain',
  巴西: 'Brazil',
  墨西哥: 'Mexico',
  香港: 'China',
  澳门: 'China',
  台湾: 'Taiwan',
}

const PROVINCE_SUFFIXES = [
  '特别行政区',
  '维吾尔自治区',
  '壮族自治区',
  '回族自治区',
  '自治区',
  '省',
  '市',
]

function toProvinceShortName(raw: string): string {
  let name = raw.trim()
  for (const suffix of PROVINCE_SUFFIXES) {
    if (name.endsWith(suffix) && name.length > suffix.length) {
      name = name.slice(0, -suffix.length)
      break
    }
  }
  return name
}

async function ensureMapRegistered(kind: HeatMapKind): Promise<string> {
  const mapName = kind === 'province' ? 'access-china' : 'access-world'
  if (REGISTERED.has(mapName)) return mapName

  const resp = await fetch(GEO_URL[kind])
  if (!resp.ok) throw new Error(`加载地图失败（${resp.status}）`)
  const geoJson = (await resp.json()) as GeoFeatureCollection

  if (kind === 'province') {
    for (const feature of geoJson.features) {
      const props = feature.properties
      const rawName = String(props.name ?? '')
      props.name = toProvinceShortName(rawName)
    }
  }

  echarts.registerMap(mapName, geoJson as Parameters<typeof echarts.registerMap>[1])
  REGISTERED.add(mapName)
  return mapName
}

function buildSeriesData(kind: HeatMapKind, geo: AdminAccessLogGeo | null) {
  const items = geo?.items ?? []
  return items
    .map((item: AdminAccessLogGeo['items'][number]) => {
      const rawName = item.name?.trim()
      if (!rawName || !item.count) return null

      if (kind === 'province') {
        return {
          name: toProvinceShortName(rawName),
          value: item.count,
        }
      }

      return {
        name: COUNTRY_NAME_MAP[rawName] ?? rawName,
        value: item.count,
        labelName: rawName,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
}

function applyChartOption(
  chart: echarts.EChartsType,
  kind: HeatMapKind,
  geo: AdminAccessLogGeo | null,
  fullscreen: boolean,
) {
  const mapName = kind === 'province' ? 'access-china' : 'access-world'
  const data = buildSeriesData(kind, geo)
  const max = Math.max(...data.map((d: { value: number }) => d.value), 1)

  chart.setOption(
    {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as {
            name?: string
            value?: number | number[]
            data?: { labelName?: string; value?: number }
          }
          const label = p.data?.labelName || p.name || '未知'
          const value = Array.isArray(p.value) ? p.value[2] : p.value
          if (value == null || Number.isNaN(Number(value))) {
            return `${label}<br/>暂无访问`
          }
          return `${label}<br/>访问量：${Number(value).toLocaleString('zh-CN')}`
        },
      },
      visualMap: {
        min: 0,
        max,
        left: 8,
        bottom: 8,
        text: ['高', '低'],
        calculable: false,
        inRange: {
          color: ['#f5f5f5', '#d4d4d4', '#737373', '#404040', '#171717'],
        },
        textStyle: { color: '#737373', fontSize: 11 },
        itemWidth: 10,
        itemHeight: fullscreen ? 120 : 72,
      },
      series: [
        {
          name: '访问量',
          type: 'map',
          map: mapName,
          roam: true,
          scaleLimit: { min: 0.8, max: 8 },
          emphasis: {
            label: { show: true, color: '#171717', fontSize: 11 },
            itemStyle: { areaColor: '#a3a3a3' },
          },
          itemStyle: {
            borderColor: '#e5e5e5',
            borderWidth: 0.8,
            areaColor: '#fafafa',
          },
          data,
        },
      ],
    },
    { notMerge: true },
  )
  chart.resize()
}

export function AccessLogGeoHeatMap({
  kind,
  geo,
  loading,
  title,
  description,
}: {
  kind: HeatMapKind
  geo: AdminAccessLogGeo | null
  loading?: boolean
  title: string
  description?: string
}) {
  const titleId = useId()
  const inlineHostRef = useRef<HTMLDivElement | null>(null)
  const fullscreenHostRef = useRef<HTMLDivElement | null>(null)
  const inlineChartRef = useRef<echarts.EChartsType | null>(null)
  const fullscreenChartRef = useRef<echarts.EChartsType | null>(null)
  const [mapError, setMapError] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    let disposed = false
    setMapReady(false)
    void (async () => {
      try {
        await ensureMapRegistered(kind)
        if (!disposed) {
          setMapError('')
          setMapReady(true)
        }
      } catch (err) {
        if (!disposed) {
          setMapError(err instanceof Error ? err.message : '地图加载失败')
          setMapReady(false)
        }
      }
    })()
    return () => {
      disposed = true
    }
  }, [kind])

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setFullscreen(false)
      }
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [fullscreen])

  // 卡片内地图
  useEffect(() => {
    const el = inlineHostRef.current
    if (!el || !mapReady || loading || mapError || fullscreen) return

    const chart = echarts.init(el)
    inlineChartRef.current = chart
    applyChartOption(chart, kind, geo, false)

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    const raf = window.requestAnimationFrame(() => chart.resize())

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      chart.dispose()
      inlineChartRef.current = null
    }
  }, [kind, geo, mapReady, loading, mapError, fullscreen])

  // 全屏地图：挂到 body，避开页面 transform/overflow 对 fixed 的限制
  useEffect(() => {
    const el = fullscreenHostRef.current
    if (!el || !mapReady || loading || mapError || !fullscreen) return

    const chart = echarts.init(el)
    fullscreenChartRef.current = chart
    applyChartOption(chart, kind, geo, true)

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    const raf = window.requestAnimationFrame(() => chart.resize())
    const t = window.setTimeout(() => chart.resize(), 50)

    return () => {
      window.cancelAnimationFrame(raf)
      window.clearTimeout(t)
      window.removeEventListener('resize', onResize)
      chart.dispose()
      fullscreenChartRef.current = null
    }
  }, [kind, geo, mapReady, loading, mapError, fullscreen])

  const emptyData = !loading && (geo?.items.length ?? 0) === 0
  const canFullscreen = !loading && !mapError && !emptyData && mapReady

  const statusOverlay =
    loading || !mapReady ? (
      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
        <AdminEmpty message="加载中…" />
      </div>
    ) : mapError ? (
      <div className="absolute inset-0 flex items-center justify-center bg-white">
        <AdminEmpty message={mapError} />
      </div>
    ) : emptyData ? (
      <div className="absolute inset-0 flex items-center justify-center bg-white">
        <AdminEmpty message="暂无地域数据" />
      </div>
    ) : null

  const fullscreenLayer =
    fullscreen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex flex-col bg-white"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <h3 id={titleId} className="font-sans text-sm font-semibold text-neutral-900">
                  {title}
                </h3>
                {description ? (
                  <p className="mt-0.5 text-xs text-neutral-400">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
              >
                <X size={14} strokeWidth={1.75} />
                退出全屏
              </button>
            </div>
            <div className="relative min-h-0 flex-1 bg-white">
              <div ref={fullscreenHostRef} className="absolute inset-0" />
              {statusOverlay}
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-800">{title}</p>
          {description ? (
            <p className="mt-1 text-xs text-neutral-400">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={!canFullscreen}
          onClick={() => setFullscreen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="全屏查看"
        >
          <Maximize2 size={14} strokeWidth={1.75} />
          全屏
        </button>
      </div>

      <div className="relative mt-2 h-72 w-full sm:h-80">
        {!fullscreen ? <div ref={inlineHostRef} className="h-full w-full" /> : null}
        {fullscreen ? (
          <div className="flex h-full items-center justify-center text-xs text-neutral-400">
            全屏查看中…
          </div>
        ) : (
          statusOverlay
        )}
      </div>

      {fullscreenLayer}
    </div>
  )
}
