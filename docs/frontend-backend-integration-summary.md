# EverydayWriting 前后端对接完成总结

> 文档日期：2026-07-13  
> 前端分支：`feature`  
> 后端仓库：`EverydayWritingServer`（`master`）  
> API 前缀：`/api/v1`

---

## 1. 概述

本次工作在不修改后端代码的前提下，将 EverydayWritingServer 已实现的 REST API 与前端 `feature` 分支完成对接。对接原则：

- **有 UI 且后端已实现** → 接入真实 API
- **无对应 UI 设计** → 仅列出，暂不对接
- **AI / 管理后台等占位功能** → 保留现状，待 UI 完善后再接

前端统一通过 `src/api/request.ts`（原生 `fetch`）发起请求，开发环境经 Vite 代理至后端（默认 `http://localhost:5000`）。

---

## 2. 后端接口清单（按模块）

### 2.1 认证与用户

| 方法 | 路径 | 用途 | 前端状态 |
|------|------|------|----------|
| POST | `/auth/send-code` | 发送邮箱验证码（注册/重置/登录验证码） | ✅ 已对接 |
| GET | `/auth/send-graphcode` | 获取图形验证码（密码错误 5 次后） | ⏸ 暂无 UI |
| POST | `/auth/register` | 用户注册 | ✅ 已对接 |
| POST | `/auth/login` | 用户登录 | ✅ 已对接 |
| POST | `/auth/refresh` | 刷新 Token | ✅ 已对接（`request.ts` 自动处理） |
| POST | `/auth/logout` | 退出当前设备 | ✅ 已对接 |
| POST | `/auth/logout-all` | 退出所有设备 | ⏸ 暂无 UI |
| POST | `/auth/reset-password` | 忘记密码重置 | ✅ 已对接 |
| GET | `/user/profile` | 获取用户资料与统计 | ✅ 已对接 |
| PUT | `/user/profile` | 修改昵称/头像 | ⏸ 暂无 UI |
| PUT | `/user/password` | 修改密码 | ✅ 已对接 |
| POST | `/files/upload` | 上传头像/图片 | ⏸ 暂无 UI |

**对接页面：** 登录、注册、忘记密码、强制改密、用户中心（展示资料）

---

### 2.2 题目

| 方法 | 路径 | 用途 | 前端状态 |
|------|------|------|----------|
| GET | `/topics/random` | 随机获取写作题目 | ✅ 已对接 |
| GET | `/topics/types` | 获取可用题目类型列表 | ✅ **本次新增对接** |

**对接页面：** 开始写作（换题、类型筛选）

---

### 2.3 写作草稿

| 方法 | 路径 | 用途 | 前端状态 |
|------|------|------|----------|
| POST | `/writings/drafts` | 创建草稿 | ✅ 已对接 |
| PUT | `/writings/drafts/{id}` | 更新草稿（含乐观锁 409） | ✅ 已对接 |
| GET | `/writings/drafts/latest` | 获取最新草稿 | ✅ 已对接 |
| GET | `/writings/drafts/{id}` | 按 ID 获取草稿详情 | ✅ **本次新增对接** |
| GET | `/writings/drafts` | 草稿列表（分页） | ✅ 已对接 |
| DELETE | `/writings/drafts/{id}` | 删除草稿 | ✅ 已对接 |

**对接页面：** 开始写作（自动恢复/指定草稿编辑）、写作记录（草稿列表/预览/继续编辑）

---

### 2.4 正式提交

| 方法 | 路径 | 用途 | 前端状态 |
|------|------|------|----------|
| POST | `/writings/submits` | 正式提交作文 | ✅ 已对接 |
| GET | `/writings/submits` | 提交记录列表（搜索/筛选/排序） | ✅ 已对接 |
| GET | `/writings/submits/{id}` | 提交详情（含 AI 批改结果） | ✅ 已对接 |
| POST | `/writings/submits/{id}/iterate` | 基于已有提交迭代改进 | ⏸ 暂无 UI |
| DELETE | `/writings/submits/{id}` | 删除提交记录 | ✅ 已对接 |

**对接页面：** 开始写作（提交）、写作记录（提交列表/详情/删除）

---

### 2.5 AI 建议追问

| 方法 | 路径 | 用途 | 前端状态 |
|------|------|------|----------|
| POST | `/writings/submits/{submitId}/suggestions/{suggestionId}/chat` | 针对单条建议追问 | ⏸ 暂无 UI |
| GET | `/writings/submits/{submitId}/suggestions/{suggestionId}/chat` | 获取追问历史 | ⏸ 暂无 UI |

**说明：** 写作记录页已展示语法/词汇建议列表，但未设计追问对话 UI。

---

### 2.6 AI 代理

| 方法 | 路径 | 用途 | 前端状态 |
|------|------|------|----------|
| GET | `/ai/config` | 获取 AI Provider/模型配置 | ⏸ UI 占位（即将上线） |
| POST | `/ai/key` | 加密保存用户 LLM Key | ⏸ UI 占位 |
| POST | `/ai/proxy/{purpose}` | AI 代理调用（structure/grammar/evaluation 等 8 种 purpose） | ⏸ UI 占位 |

**说明：** `WritingAiAssist` 组件仅有开关预览，按钮为 disabled 状态。

---

### 2.7 个人词库

| 方法 | 路径 | 用途 | 前端状态 |
|------|------|------|----------|
| POST | `/vocabulary` | 添加词条 | ✅ 已对接 |
| GET | `/vocabulary` | 词库列表（分页/类型/排序） | ✅ 已对接 |
| DELETE | `/vocabulary/{id}` | 删除词条 | ✅ 已对接 |
| GET | `/vocabulary/search` | 快速搜索词库 | ⏸ 暂无搜索 UI |

**对接页面：** 个人词库

---

### 2.8 个人测评

| 方法 | 路径 | 用途 | 前端状态 |
|------|------|------|----------|
| GET | `/assessment/stats` | 综合评测统计（7d/30d/90d/all） | ✅ 已对接 |

**对接页面：** 个人测评

---

### 2.9 每日打卡

| 方法 | 路径 | 用途 | 前端状态 |
|------|------|------|----------|
| GET | `/checkin/status` | 今日打卡状态、连续天数、段位、语录 | ✅ 已对接 |
| GET | `/checkin/calendar` | 月度打卡日历 | ✅ 已对接 |

**对接页面：** 用户中心 → 写作打卡面板

---

### 2.10 用户协议

| 方法 | 路径 | 用途 | 前端状态 |
|------|------|------|----------|
| GET | `/agreements/latest` | 获取最新协议（公开） | ✅ **本次新增对接** |
| POST | `/agreements/{id}/accept` | 用户接受协议 | ✅ **本次新增对接** |
| GET | `/agreements/status` | 获取用户协议接受状态 | ⏸ 暂未使用 |
| GET | `/agreements/history` | 协议历史版本 | ⏸ 暂无 UI |

**对接页面：** 登录/注册 → 隐私协议弹窗（优先展示后端内容，失败时降级本地静态文案）

---

### 2.11 系统公告（用户端）

| 方法 | 路径 | 用途 | 前端状态 |
|------|------|------|----------|
| GET | `/announcements` | 有效公告列表（含未读状态） | ⏸ 暂无 UI |
| POST | `/announcements/{id}/read` | 标记公告已读 | ⏸ 暂无 UI |

---

### 2.12 LLM Token 用量

| 方法 | 路径 | 用途 | 前端状态 |
|------|------|------|----------|
| POST | `/usage/report` | 上报 Token 用量 | ⏸ 暂无 UI |
| GET | `/usage/summary` | 用量汇总 | ⏸ 暂无 UI |
| GET | `/usage/details` | 用量明细 | ⏸ 暂无 UI |
| GET | `/usage/budget` | 预算状态 | ⏸ 暂无 UI |
| PUT | `/usage/budget` | 设置个人预算 | ⏸ 暂无 UI |

---

### 2.13 隐私

| 方法 | 路径 | 用途 | 前端状态 |
|------|------|------|----------|
| DELETE | `/ai-memory` | 删除 AI 对话记忆 | ⏸ 暂无 UI |

---

### 2.14 健康检查

| 方法 | 路径 | 用途 | 前端状态 |
|------|------|------|----------|
| GET | `/health` | 存活探活 | ⏸ 运维用途，前端未接 |
| GET | `/health/ready` | 就绪检查（含 DB） | ⏸ 运维用途，前端未接 |

---

### 2.15 管理后台（Admin）

共 40+ 个端点，涵盖用户管理、角色权限、Provider/模型、审计日志、系统配置、励志语录、打卡段位、题目类型、Token 用量概览、公告管理、协议管理等。

**前端状态：** ⏸ 全部暂无管理后台 UI，暂不对接。

---

## 3. 本次新增/修复的前端改动

| 文件 | 改动说明 |
|------|----------|
| `src/api/config.ts` | 新增 `topics.types`、`agreements` 路径配置 |
| `src/api/writing.ts` | `loadDraftById` 改为调用 `GET /writings/drafts/{id}` |
| `src/api/topics.ts` | 新增 `getTopicTypes()`；题目 type 参数改为动态字符串 |
| `src/api/agreements.ts` | **新建** 协议 API 模块 |
| `src/components/views/StartWriting.tsx` | 支持通过 `?draftId=` 加载指定草稿 |
| `src/components/views/WritingRecords.tsx` | 草稿详情预览、任意草稿继续编辑 |
| `src/components/writing/TopicTypeSelect.tsx` | 从后端动态拉取题目类型，失败时降级本地选项 |
| `src/components/auth/PrivacyAgreementModal.tsx` | 从后端拉取隐私协议内容 |
| `src/components/auth/PrivacyAgreementField.tsx` | 传递协议 ID 给登录/注册页 |
| `src/components/views/Login.tsx` | 登录成功后上报协议接受记录 |
| `src/components/views/Register.tsx` | 注册成功后上报协议接受记录 |

---

## 4. 已对接功能与页面对照

| 前端页面/功能 | 使用的后端模块 |
|---------------|----------------|
| 登录 / 注册 / 忘记密码 / 强制改密 | 认证、用户、协议 |
| 开始写作（编辑、保存、提交、换题、类型筛选） | 题目、草稿、提交 |
| 写作记录（草稿/提交列表、详情、删除、继续编辑） | 草稿、提交 |
| 用户中心（资料展示、退出） | 用户、打卡 |
| 写作打卡日历（年/月/周视图） | 打卡 |
| 个人词库（增删查） | 词库 |
| 个人测评（统计图表） | 测评 |

---

## 5. 暂未对接接口汇总（无对应 UI）

以下接口后端已实现，但前端暂无对应交互设计，**本次未对接**：

### 用户侧

1. `GET /auth/send-graphcode` — 图形验证码
2. `POST /auth/logout-all` — 退出所有设备
3. `PUT /user/profile` — 编辑昵称/头像
4. `POST /files/upload` — 头像上传
5. `POST /writings/submits/{id}/iterate` — 提交迭代改进
6. `POST/GET .../suggestions/.../chat` — AI 建议追问
7. `GET /vocabulary/search` — 词库搜索
8. `GET /ai/config`、`POST /ai/key`、`POST /ai/proxy/{purpose}` — AI 全套能力
9. `GET /announcements`、`POST /announcements/{id}/read` — 系统公告
10. `GET/PUT /usage/*` — Token 用量与预算
11. `DELETE /ai-memory` — 清除 AI 记忆
12. `GET /agreements/status`、`GET /agreements/history` — 协议状态/历史

### 管理后台

全部 `/admin/*` 端点（用户封禁、角色权限、Provider 管理、审计日志、系统配置、语录/段位/题目类型管理、公告/协议管理等）。

---

## 6. 本地联调说明

```bash
# 1. 启动后端（EverydayWritingServer，默认端口 5000）
cd EverydayWritingServer
dotnet run --project EverydayWriting.Api

# 2. 启动前端（代理到本地后端）
cd ..
npm run dev:local

# 或代理到远端后端
npm run dev:remote
```

环境变量见 `.env.localhost` / `.env.remote`，生产构建使用 `VITE_API_BASE_URL` 直连后端。

---

## 7. 统计

| 类别 | 数量 |
|------|------|
| 后端用户侧接口（不含 Admin） | 约 45 个 |
| 已对接 | **28 个** |
| 本次新增对接 | **4 个**（drafts/{id}、topics/types、agreements/latest、agreements/accept） |
| 暂未对接（无 UI） | **17 个** |
| 管理后台接口 | 40+ 个（全部暂未对接） |

---

## 8. 后续建议

1. **AI 模块**：完善 `WritingAiAssist` 交互后，依次接入 `/ai/config` → `/ai/key` → `/ai/proxy/{purpose}`。
2. **提交迭代**：在写作记录详情页增加「基于此稿重写」按钮，对接 `POST /writings/submits/{id}/iterate`。
3. **词库搜索**：在个人词库页增加搜索框，对接 `GET /vocabulary/search`。
4. **系统公告**：在 Layout 或用户中心增加公告入口，对接 `/announcements` 系列接口。
5. **用户资料编辑**：用户中心增加昵称/头像编辑，对接 `PUT /user/profile` + `POST /files/upload`。
6. **管理后台**：独立 Admin 前端项目或路由组，对接 `/admin/*` 全套接口。
