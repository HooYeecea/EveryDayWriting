# Everyday Writing · 每日英语写作

面向英语写作练习的前端 Web 应用。支持题目写作、草稿保存、正式提交、写作记录查看，以及用户登录注册。

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 8 |
| 样式 | Tailwind CSS 4 |
| 路由 | React Router 7 |
| 富文本编辑器 | Tiptap（Notion 风格） |
| 本地 API | Express 5（读写 JSON 文件） |

## 功能概览

### 已实现

- **开始写作**
  - 顶部展示写作题目（静态模拟数据，支持「换一个题目」）
  - 自定义标题（输入后居中显示）
  - Notion 风格写作编辑器
  - 保存 / 提交（需登录）
  - 登录后自动恢复最近保存的草稿；支持从写作记录继续编辑

- **用户系统**
  - 登录 / 注册页面
  - 未登录时侧边栏显示「立即登录」，已登录显示「用户中心」
  - 未登录无法保存和提交，会跳转登录页
  - 用户中心展示个人信息（静态演示数据）与退出登录

- **写作记录**
  - 分「保存记录」「提交记录」两个 Tab
  - 按 ID 查看详情（题目、标题、时间、正文）
  - 保存记录支持「继续编辑」，跳转至 `/writing?draftId=xxx`

- **路由与状态**
  - URL 路由驱动页面切换
  - 切换菜单时页面组件保持挂载，写作内容不会丢失

- **数据持久化**
  - 保存数据写入 `data/writing-saves.json`
  - 提交数据写入 `data/writing-submits.json`
  - 通过本地 API 服务（端口 3001）读写文件

### 占位（待开发）

- 个人词库
- 个人测评

## 演示账号

| 邮箱 | 密码 |
|------|------|
| `alex.chen@example.com` | `123456` |
| `demo@example.com` | `demo123` |

也支持在注册页创建新账号（用户信息暂存于浏览器 localStorage）。

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

## 项目结构

```
everydayWriting/
├── data/                      # 写作数据（JSON 文件）
│   ├── writing-saves.json     # 保存（草稿）
│   └── writing-submits.json   # 提交（正式）
├── server/
│   └── index.js               # 本地 API 服务
├── src/
│   ├── api/                   # 接口封装（写作、认证）
│   ├── components/
│   │   ├── editor/            # Tiptap 编辑器
│   │   ├── layout/            # 布局、侧边栏
│   │   └── views/             # 各页面组件
│   ├── config/routes.tsx      # 路由配置
│   ├── context/               # AuthContext
│   ├── data/                  # 静态模拟数据（题目、用户）
│   ├── storage/               # 浏览器本地存储（会话）
│   └── types/                 # TypeScript 类型
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
| API（Express） | http://localhost:3001 | 读写 JSON 数据 |

Vite 会将 `/api` 请求代理到 3001 端口。

### 分别启动（可选）

```bash
# 仅前端（保存/提交/写作记录不可用）
npm run dev:web

# 仅 API 服务
npm run dev:server
```

> 完整功能（保存、提交、写作记录）需要 API 服务同时运行。

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

## 写作数据格式

每条记录包含以下字段：

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

## 其他命令

```bash
npm run lint    # 代码检查（Oxlint）
```

## 后续规划

- 对接真实后端与数据库（MongoDB / MySQL / PostgreSQL）
- 题目接口、AI 批改、个人词库、个人测评等功能
