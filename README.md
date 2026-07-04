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
| 后端 API | ASP.NET Core `/api/v1`（JWT 鉴权） |
| 代码检查 | Oxlint |

## 功能概览

### 已实现

#### 开始写作

- 顶部题目栏：题目、题型、题目框、「换一个题目」（桌面端同一行；手机端题目/题型与换题按钮两端对齐）
- 长题目省略显示，支持弹窗查看全文
- 自定义标题（有内容时居中显示）
- Notion 风格富文本编辑器
- 保存 / 提交（需登录，对接 `POST/PUT /api/v1/writings/drafts` 与 `POST /api/v1/writings/submits`）；登录后自动恢复最近草稿
- 题目来自 `GET /api/v1/topics/random`（未登录时 fallback 本地 mock 题目）

**写作辅助面板**（桌面右侧窄条 / 手机浮动入口）

- 功能列表 → 详情导航，便于后续扩展
- **写作计时**：预设 / 自定义 / 不限时；时/分/秒拨盘；倒计时 / 正计时；到点提醒；开始 / 停止 / 重置
- **AI 助手**：UI 占位（保存开关与能力说明），尚未对接真实 AI
- 桌面端：侧栏可展开 / 收起，状态持久化至 `localStorage`；计时中收起仍显示时间
- 手机端：「辅助」浮动按钮与打开后的面板均可在页面内自由拖动；点击打开、按住拖动

#### 写作记录

- 「草稿」「提交记录」双 Tab 列表（分页接口）
- 提交记录支持关键字搜索（`GET /api/v1/writings/submits?keyword=`）
- 提交详情展示 AI 评分与批改内容
- 草稿支持「继续编辑」（`/writing?draftId=xxx`）
- 响应式：桌面双栏；手机列表 / 详情主从切换

#### 用户中心

- 个人信息来自 `GET /api/v1/user/profile`
- **坚持写作打卡**（`GET /api/v1/checkin/status`、`/checkin/calendar`）
  - 每日首次**提交作文**自动打卡
  - 连续 / 累计打卡、段位、励志语录、月历
- 退出登录（`POST /api/v1/auth/logout`）

#### 用户系统

- 登录 / 注册 / 忘记密码（邮箱验证码，对接 `/api/v1/auth/*`）
- JWT + Refresh Token 存储于浏览器 `localStorage`
- 密码规则：至少 8 位，含大小写字母和数字
- 登录失败 5 次后需邮箱验证码

#### 布局与交互

- 响应式布局：`lg`（1024px）区分桌面与移动
- 桌面：左侧可折叠侧边栏 + 主内容区
- 移动 / 平板：抽屉菜单 + 底部导航栏
- 切换菜单时页面组件保持挂载，写作内容不会丢失

#### 数据持久化

| 数据 | 存储方式 |
|------|----------|
| 写作草稿 / 提交 | 后端 PostgreSQL，经 `/api/v1/writings/*` |
| 用户 / 打卡 | 后端数据库 |
| Access / Refresh Token | 浏览器 `localStorage` |
| 辅助面板折叠状态 | 浏览器 `localStorage` |
| 手机「辅助」按钮位置 | 浏览器 `sessionStorage` |

### 占位 / 部分实现（待开发）

| 模块 | 状态 |
|------|------|
| 个人词库 | 占位页 |
| 个人测评 | 占位页 |
| AI 助手 / 代理调用 | UI 占位，待接 `/api/v1/ai/proxy/{purpose}` |
| 草稿按 ID 拉取详情 | 后端暂无 GET `/drafts/{id}`，仅 latest + 列表 |
| 用户协议 / 公告 | 待接模块九、十三 |

## 演示账号

由后端 Seed 数据决定。本地开发请先启动 ASP.NET Core 后端并执行数据库迁移。

## 环境配置

复制 `.env.example` 为 `.env`（首次克隆后执行一次即可）：

```bash
cp .env.example .env
```

| 场景 | `.env` 配置 | 请求方式 |
|------|-------------|----------|
| **本地开发（默认）** | 不设置 `VITE_API_BASE_URL` | 浏览器请求 `/api/v1/...`，Vite 代理到 `http://localhost:5000` |
| **直连联调** | `VITE_API_BASE_URL=http://localhost:5000` | 浏览器直连后端（需后端开启 CORS） |
| **生产构建** | 在 `.env.production` 或 CI 中设置真实 API 域名 | 打包时写入静态资源 |

后端端口非 5000 且仍走代理时，在 `.env` 中设置 `DEV_API_PROXY_TARGET=http://localhost:5001`（仅 `vite.config.ts` 读取，不影响前端）。

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

**先启动后端**（ASP.NET Core，默认 `http://localhost:5000`），再启动前端：

```bash
npm run dev
```

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端（Vite） | http://localhost:5173 | 页面 UI |
| 后端 API | http://localhost:5000/api/v1 | 见 API 文档 |

未配置 `VITE_API_BASE_URL` 时，Vite 将 `/api/v1` 代理到 `http://localhost:5000`（可在 `.env` 中设置 `VITE_API_BASE_URL` 修改代理目标）。

> 仓库内 `server/index.js` 为旧版 JSON 文件演示服务，**已不再被前端默认使用**。

## 打包构建

生产环境请先配置 API 地址，例如创建 `.env.production`：

```bash
VITE_API_BASE_URL=https://api.yourdomain.com
```

然后执行：

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
