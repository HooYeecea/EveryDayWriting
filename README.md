# Everyday Writing · 每日英语写作

面向英语写作练习的前端 Web 应用。支持题目写作、草稿保存、正式提交、写作记录查看、写作辅助工具、坚持打卡与用户登录注册。布局已适配手机、平板与桌面端。

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 8 |
| 样式 | Tailwind CSS 4 |
| 路由 | React Router 7 |
| 富文本编辑器 | Tiptap（Notion 风格） |
| 本地 API | Express 5（读写 JSON 文件） |
| 代码检查 | Oxlint |

## 功能概览

### 已实现

#### 开始写作

- 顶部题目栏：题目、题型、题目框、「换一个题目」（桌面端同一行；手机端题目/题型与换题按钮两端对齐）
- 长题目省略显示，支持弹窗查看全文
- 自定义标题（有内容时居中显示）
- Notion 风格富文本编辑器
- 保存 / 提交（需登录）；登录后自动恢复最近草稿；支持从写作记录继续编辑（`/writing?draftId=xxx`）

**写作辅助面板**（桌面右侧窄条 / 手机浮动入口）

- 功能列表 → 详情导航，便于后续扩展
- **写作计时**：预设 / 自定义 / 不限时；时/分/秒拨盘；倒计时 / 正计时；到点提醒；开始 / 停止 / 重置
- **AI 助手**：UI 占位（保存开关与能力说明），尚未对接真实 AI
- 桌面端：侧栏可展开 / 收起，状态持久化至 `localStorage`；计时中收起仍显示时间
- 手机端：「辅助」浮动按钮与打开后的面板均可在页面内自由拖动；点击打开、按住拖动

#### 写作记录

- 「保存记录」「提交记录」双 Tab 列表
- 点击记录查看详情（题目、标题、时间、正文 HTML）
- 保存记录支持「继续编辑」
- 搜索栏 UI：关键字输入、检索范围多选（题目 / 标题 / 内容 / 时间）；**搜索逻辑尚未实现**
- 响应式：桌面双栏；手机列表 / 详情主从切换

#### 用户中心

- 个人信息与学习概览（累计写作、累计字数、连续打卡等演示数据）
- **坚持写作打卡**（演示数据 + 本地追加）
  - 「今日打卡」按钮（同日不可重复打卡）
  - 累计 / 连续 / 最长 / 本月打卡统计
  - 月历展示已打卡日期，支持切换月份
  - 当月打卡记录列表
- 退出登录

#### 用户系统

- 登录 / 注册 / 忘记密码（验证码演示模式，数据存于浏览器 `localStorage`）
- 未登录时无法保存、提交与查看写作记录，会引导登录
- 侧边栏 / 底部导航：未登录显示「登录」，已登录入口为「我的 / 用户中心」

#### 布局与交互

- 响应式布局：`lg`（1024px）区分桌面与移动
- 桌面：左侧可折叠侧边栏 + 主内容区
- 移动 / 平板：抽屉菜单 + 底部导航栏
- 切换菜单时页面组件保持挂载，写作内容不会丢失

#### 数据持久化

| 数据 | 存储方式 |
|------|----------|
| 写作保存 / 提交 | `data/writing-saves.json`、`data/writing-submits.json`，经 Express API（3001）读写 |
| 用户账号 / 会话 | 浏览器 `localStorage` |
| 打卡记录（演示） | 静态 mock + 本地 `localStorage` 追加 |
| 辅助面板折叠状态 | 浏览器 `localStorage` |
| 手机「辅助」按钮位置 | 浏览器 `sessionStorage` |

### 占位 / 部分实现（待开发）

| 模块 | 状态 |
|------|------|
| 个人词库 | 占位页 |
| 个人测评 | 占位页 |
| AI 助手真实能力 | UI 占位 |
| 写作记录搜索过滤 | UI 占位 |
| 打卡后端接口 | 前端 mock，见 `src/api/checkIn.ts` |
| 题目接口 | 静态 mock，见 `src/data/mockTopics.ts` |
| 真实后端与数据库 | 规划见 [API.md](./API.md) |

## 演示账号

| 邮箱 | 密码 | 说明 |
|------|------|------|
| `alex.chen@example.com` | `123456` | 较多写作与打卡演示数据 |
| `demo@example.com` | `demo123` | 新手演示账号 |

也支持在注册页创建新账号。忘记密码流程为演示模式（验证码会展示在页面上）。

## 路由说明

| 路径 | 页面 |
|------|------|
| `/writing` | 开始写作（默认首页） |
| `/user-center` | 用户中心 |
| `/records` | 写作记录 |
| `/vocabulary` | 个人词库（占位） |
| `/assessment` | 个人测评（占位） |
| `/login` | 登录 |
| `/register` | 注册 |
| `/forgot-password` | 忘记密码 |

## 项目结构

```
everydayWriting/
├── data/                          # 写作数据（JSON 文件）
│   ├── writing-saves.json         # 保存（草稿）
│   └── writing-submits.json       # 提交（正式）
├── server/
│   └── index.js                   # 本地 Express API
├── src/
│   ├── api/                       # 接口封装（写作、认证、打卡等）
│   ├── components/
│   │   ├── auth/                  # 登录注册、协议、弹窗
│   │   ├── editor/                # Tiptap 编辑器
│   │   ├── layout/                # 布局、侧边栏、底部导航
│   │   ├── user/                  # 用户中心子模块（打卡等）
│   │   ├── views/                 # 各页面组件
│   │   └── writing/               # 题目框、辅助面板、计时、搜索栏
│   ├── config/routes.tsx          # 应用路由配置
│   ├── context/                   # AuthContext
│   ├── data/                      # 静态 mock（题目、用户、打卡）
│   ├── storage/                   # 浏览器本地存储
│   └── types/                     # TypeScript 类型
├── API.md                         # 后端 API 规划文档（待对接）
├── index.html
├── package.json
└── vite.config.ts
```

## 环境要求

- Node.js 18+
- npm 9+

## 安装依赖

```bash
npm install
```

## 启动开发环境

项目包含**两个服务**，推荐一键启动：

```bash
npm run dev
```

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端（Vite） | http://localhost:5173 | 页面 UI |
| API（Express） | http://localhost:3001 | 读写 JSON 写作数据 |

Vite 会将 `/api` 请求代理到 3001 端口。环境变量示例见 `.env.example`。

### 分别启动（可选）

```bash
# 仅前端（保存/提交/写作记录不可用）
npm run dev:web

# 仅 API 服务
npm run dev:server
```

> 完整写作持久化功能（保存、提交、写作记录列表）需要 API 服务同时运行。用户、打卡等演示数据可在仅前端模式下体验。

## 打包构建

```bash
npm run build
```

构建产物输出至 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

预览地址默认为 http://localhost:4173。

> `preview` 仅提供前端静态文件预览，**不包含 API 服务**。若要验证保存/提交等功能，需另行启动 `npm run dev:server`，并在部署时配置 API 反向代理。

## 数据格式

### 写作记录

每条保存 / 提交记录包含以下字段：

```json
{
  "id": "uuid",
  "userId": "user-001",
  "topicId": 1,
  "topic": "写作题目正文",
  "topicType": "Argumentative Essay",
  "title": "自定义标题",
  "content": "<p>编辑器 HTML 内容</p>",
  "time": "2026-07-01T10:30:00.000Z"
}
```

### 打卡记录（前端演示）

```json
{
  "id": "local-checkin-uuid",
  "userId": "user-001",
  "date": "2026-07-03",
  "checkedInAt": "2026-07-03T02:30:00.000Z"
}
```

## 其他命令

```bash
npm run lint    # 代码检查（Oxlint）
```

## 后续规划

- 按 [API.md](./API.md) 对接真实后端（认证、题目、AI、打卡、词库、测评等）
- 写作记录搜索与 AI 助手、AI 批改等能力落地
- 题目与用户数据改为接口驱动
- 生产环境部署与 DevOps 流水线
