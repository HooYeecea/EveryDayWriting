# CLAUDE.md — Everyday Writing · 每日英语写作

## 项目概览

面向英语写作练习的前端 Web 应用，支持题目写作、草稿保存、正式提交、写作记录查看、写作辅助工具、坚持打卡与用户登录注册。

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 8 |
| 样式 | Tailwind CSS 4 |
| 路由 | React Router 7 |
| 富文本编辑器 | Tiptap（Notion 风格） |
| 后端 API | ASP.NET Core `/api/v1`（JWT 鉴权） |
| 代码检查 | Oxlint |

## 项目结构

```
src/
├── api/          # API 请求层
├── components/
│   ├── auth/     # 登录/注册/隐私协议组件
│   ├── common/   # ConfirmDialog 等通用组件
│   ├── editor/   # NotionEditor (Tiptap)
│   ├── layout/   # Layout, Sidebar, MobileBottomNav, AuthLayout
│   ├── user/     # 用户中心子面板 (ProfileEditor, CheckIn, Token, Privacy, Announcements)
│   ├── views/    # 页面级组件 (StartWriting, WritingRecords, UserCenter, Login, Register 等)
│   ├── vocabulary/ # 词库相关组件
│   └── writing/  # 写作辅助 (Timer, AI, Topic, SubmitNav 等)
├── config/       # routes.tsx
├── context/      # AuthContext
├── storage/      # localStorage 封装
├── types/        # TypeScript 类型
└── utils/        # 工具函数
```

## 后端配置

- **生产后端**: `https://kefumiao.top`
- 配置文件: `.env.remote` → `DEV_API_PROXY_TARGET=https://kefumiao.top`
- 开发命令: `npm run dev` (Vite + Express) 或 `npm run dev:remote` (仅 Vite)
- Vite 代理将 `/api/v1/*` 转发到 `DEV_API_PROXY_TARGET`
- 前端端口: `5173`, Express 中间层: `3001`

## 设计风格

### 字体
- **正文/编辑器**: Merriweather (serif) — 通过 `var(--font-serif)` 和 Tailwind `font-sans` 令牌
- **UI/导航/标题**: Montserrat (sans-serif) — `var(--font-sans)`
- **代码**: Inconsolata (mono) — `var(--font-mono)`
- 字体通过 `index.html` 中 Google Fonts `<link>` 加载
- Tailwind `@theme` 在 `src/index.css` 中覆盖了 `--font-sans` / `--font-serif` / `--font-mono`

### 配色
- 保留原始 Tailwind neutral 色阶，不做全局颜色覆盖
- 背景 `#fafafa`，正文 `#37352f`
- 无蓝/紫色系

### AuthLayout 卡片设计
- 表单卡片垂直居中 (`items-center justify-center`)
- 品牌名在卡片上方独立展示
- 卡片顶部 4px 黑线 (`border-t-4 border-neutral-900`)
- 标题居中大字，标签使用 Montserrat 小号大写字母
- 输入框浅灰底 (`bg-neutral-50`)，聚焦变白
- 提交按钮黑底白字大写，hover 变 `neutral-800`

### 编辑器排版
- `.notion-editor .tiptap` — Merriweather 字体，line-height 1.75
- h1-h3 使用 Montserrat + 900 字重 + 宽松间距
- blockquote 左边 4px 黑线 + 斜体 + 较大字号
- 段落间距 `1.75em`

## 用户中心结构 (2026-07-13 重构)

四大标签页，共享顶部资料卡：

| 标签 | 内容 |
|------|------|
| 概览 | AnnouncementsPanel (系统公告) |
| 打卡 | WritingCheckInPanel (打卡日历) |
| 用量 | TokenUsagePanel (Token 统计与预算) |
| 设置 | UserProfileEditor + PrivacySettingsPanel |

页面顶部 sticky header 包含用户名/VIP等级/退出按钮。资料卡+统计数字始终可见，不受标签切换影响。

## 关键交互细节

- 侧栏激活态: `bg-neutral-100 font-medium text-neutral-900`
- 页面切换时组件保持挂载 (hidden 而非 unmount)，写作内容不丢失
- 写作辅助面板桌面右侧窄条，手机浮动拖动
- 版本翻页动效使用 3D transform + cubic-bezier
- 打卡日历视图切换由 JS 控制高度缓动

## 设计铁律 · 反主流美学

### 绝对禁止项

#### 配色禁止
- 紫色/靛蓝色/蓝紫渐变（`#6366F1`、`#8B5CF6` 及其同类色）
- 纯平背景色（必须有噪点纹理或渐变）
- Tailwind 默认色板（全部自定义）

#### 布局禁止
- Hero + 三卡片布局
- 完美居中对齐
- 等宽多栏（必须不对称）

#### 组件禁止
- Shadcn/Material UI 默认组件（必须深度定制）
- Emoji 作为功能图标
- 线性动画（`ease-in-out`）

### 图片与图标系统

| 用途 | 来源 |
|------|------|
| 图标 | lucide-react (当前) / Iconify (推荐) |
| 占位图 | Picsum Photos |
| 真实图片 | Pexels |
| 插画 | unDraw |
