import { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts/core'
import { MapChart } from 'echarts/charts'
import { TooltipComponent, VisualMapComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
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

export function AccessLogGeoHeatMap({
  kind,
  geo,
  loading,
}: {
  kind: HeatMapKind
  geo: AdminAccessLogGeo | null
  loading?: boolean
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<echarts.EChartsType | null>(null)
  const [mapError, setMapError] = useState('')
  const [mapReady, setMapReady] = useState(false)

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

  // 容器始终挂载；等地图数据就绪后再 init，避免 loading 阶段卸载导致图表永不创建
  useEffect(() => {
    const el = hostRef.current
    if (!el || !mapReady || loading || mapError) return

    const chart = echarts.init(el)
    chartRef.current = chart

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    // 布局稳定后再量一次，防止父级从 hidden/空态切过来时宽高为 0
    const raf = window.requestAnimationFrame(() => chart.resize())

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      chart.dispose()
      chartRef.current = null
    }
  }, [kind, mapReady, loading, mapError])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !mapReady || loading || mapError) return

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
          itemHeight: 72,
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
  }, [kind, geo, mapReady, loading, mapError])

  const emptyData = !loading && (geo?.items.length ?? 0) === 0

  return (
    <div className="relative mt-2 h-72 w-full sm:h-80">
      <div ref={hostRef} className="h-full w-full" />
      {loading || !mapReady ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <AdminEmpty message="加载中…" />
        </div>
      ) : null}
      {mapError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <AdminEmpty message={mapError} />
        </div>
      ) : null}
      {!mapError && emptyData ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <AdminEmpty message="暂无地域数据" />
        </div>
      ) : null}
    </div>
  )
}
