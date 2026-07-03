/** 与侧边栏同宽（lg: w-56） */
export const SIDE_PANEL_WIDTH_CLASS = 'lg:w-56'

/** 与侧边栏品牌区一致的内边距与高度，保证左右 header 底部分割线对齐 */
export const PANEL_HEADER_CLASS =
  'flex min-h-[5.25rem] items-center border-b border-neutral-200 px-4 sm:min-h-[5.5rem] sm:px-5'

/** 开始写作题目栏：与侧边栏品牌区共用同一套 header 规格 */
export const PANEL_TOPIC_HEADER_CLASS = `bg-white ${PANEL_HEADER_CLASS}`
/** 头部行内容：与侧边栏品牌区同高（标题 + 单行副标题） */
export const PANEL_HEADER_ROW_CLASS = 'flex w-full items-center justify-between gap-3'

/** 主内容区与侧边栏品牌区一致的水平内边距 */
export const MAIN_CONTENT_X_CLASS = 'px-4 sm:px-5'

/** 与侧边栏底部操作区一致，保证左右 footer 分割线对齐（桌面端固定 56px） */
export const PANEL_FOOTER_CLASS =
  'flex shrink-0 items-center border-t border-neutral-200 bg-white py-3 lg:h-14 lg:py-0'

/** 主内容区 footer 内边距 */
export const PANEL_FOOTER_INNER_CLASS =
  'flex h-full w-full items-center justify-between gap-3 px-4 sm:px-5'

/** 侧边栏 footer 内边距 */
export const SIDEBAR_FOOTER_INNER_CLASS = 'flex h-full w-full items-center px-2'

/** 与侧边栏品牌标题一致 */
export const PANEL_TITLE_CLASS = 'text-base font-semibold tracking-tight text-neutral-900'

/** 与侧边栏副标题一致 */
export const PANEL_SUBTITLE_CLASS = 'mt-0.5 text-xs text-neutral-400'
