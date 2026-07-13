# 前端 UI 补全对接总结（Phase 2）

> 日期：2026-07-13  
> 分支：`feature`  
> 原则：仅改前端，不改后端

---

## 本次新增 UI 与接口对接

| 模块 | 接口 | 页面/组件 |
|------|------|-----------|
| 资料编辑 | `PUT /user/profile` | 用户中心 → `UserProfileEditor` |
| 头像上传 | `POST /files/upload` | 用户中心 → `UserProfileEditor` |
| 退出所有设备 | `POST /auth/logout-all` | 用户中心 → 退出所有设备按钮 |
| 系统公告 | `GET /announcements`、`POST /announcements/{id}/read` | 用户中心 → `AnnouncementsPanel` |
| Token 用量 | `GET /usage/summary`、`GET /usage/budget`、`PUT /usage/budget`、`GET /usage/details` | 用户中心 → `TokenUsagePanel` |
| 协议状态 | `GET /agreements/status` | 用户中心 → `PrivacySettingsPanel` |
| 清除 AI 记忆 | `DELETE /privacy/ai-memory` | 用户中心 → `PrivacySettingsPanel` |
| 词库搜索 | `GET /vocabulary/search` | 个人词库 → 搜索框 |
| 提交迭代 | `POST /writings/submits/{id}/iterate` | 写作记录 →「基于此稿重写」→ 写作页 `?iterateFrom=` |
| 建议追问 | `POST/GET .../suggestions/{id}/chat` | 写作记录详情 → `SuggestionChatBox` |
| AI 配置 | `GET /ai/config` | 开始写作 → `WritingAiAssist` |
| AI Key | `POST /ai/key` | 开始写作 → `WritingAiAssist` |
| AI 代理 | `POST /ai/proxy/{purpose}` | 提交成功后按开关自动调用 grammar/vocabulary |

---

## 新增/修改文件

### API 层
- `src/api/user.ts` — 资料更新、文件上传
- `src/api/announcements.ts` — 公告列表与已读
- `src/api/tokenUsage.ts` — Token 用量与预算
- `src/api/privacy.ts` — 清除 AI 记忆
- `src/api/ai.ts` — AI 配置、Key、Proxy、建议追问
- `src/api/auth.ts` — `logoutAll`
- `src/api/writing.ts` — `iterateSubmit`
- `src/api/config.ts` — 路径补全
- `src/api/request.ts` — FormData 上传支持
- `src/utils/assetUrl.ts` — 头像/上传资源 URL 解析
- `vite.config.ts` — `/uploads` 代理

### UI 组件
- `src/components/user/UserProfileEditor.tsx`
- `src/components/user/AnnouncementsPanel.tsx`
- `src/components/user/TokenUsagePanel.tsx`
- `src/components/user/PrivacySettingsPanel.tsx`
- `src/components/writing/SuggestionChatBox.tsx`
- `src/storage/aiSettingsStorage.ts`

### 页面更新
- `UserCenter.tsx` — 集成上述用户中心面板
- `PersonalVocabulary.tsx` — 搜索框
- `WritingRecords.tsx` — 迭代重写、版本链、建议追问
- `StartWriting.tsx` — 迭代模式、提交后 AI 调用
- `WritingAiAssist.tsx` — 完整 AI 配置 UI

---

## 仍未对接（刻意跳过）

| 类别 | 说明 |
|------|------|
| 管理后台 `/admin/*` | 无 Admin 前端，约 40+ 接口 |
| 健康检查 `/health/*` | 运维用途，无需用户 UI |
| `POST /usage/report` | 管理员补录用途，非用户场景 |
| `GET /agreements/history` | 暂无历史版本浏览 UI |
| AI purpose 全量 | dictionary/translation/brainstorm/structure/evaluation 等需独立交互设计，当前仅接入 grammar + vocabulary 提交后触发 |

---

## 统计

| 项目 | Phase 1 后 | Phase 2 后 |
|------|-----------|-----------|
| 用户侧已对接 | ~28 | **~42** |
| 仍有 UI 缺口 | ~17 | **~3**（history、usage/report、部分 AI purpose） |
| 管理后台 | 未对接 | 未对接 |
