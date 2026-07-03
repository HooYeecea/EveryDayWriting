# EverydayWriting 后端 API 接口文档

---

## 目录

1. [基础说明](#基础说明)
2. [架构总览与技术栈](#架构总览与技术栈)
3. [Swagger / Swashbuckle 集成](#swagger--swashbuckle-集成)
4. [DevOps & 部署策略](#devops--部署策略)
5. [数据库实体设计](#数据库实体设计)
6. [通用规约](#通用规约)
7. [模块一：用户与认证](#模块一用户与认证-auth--user)
   - [1.1 发送邮箱验证码](#11-发送邮箱验证码)
   - [1.2 用户注册](#12-用户注册)
   - [1.3 用户登录](#13-用户登录)
   - [1.4 获取个人信息](#14-获取个人信息)
   - [1.5 重置密码](#15-重置密码)
   - [1.6 刷新 Token](#16-刷新-token)
   - [1.7 修改个人信息](#17-修改个人信息)
   - [1.7 附：修改密码](#17-附修改密码)
   - [1.8 登录安全：错误次数限制与验证码](#18-登录安全错误次数限制与验证码)
   - [1.9 退出登录](#19-退出登录)
   - [1.9 附：退出所有设备](#19-附退出所有设备)
   - [1.10 文件上传](#110-文件上传)
   - [1.11 管理员初始密码机制](#111-管理员初始密码机制)
8. [模块二：写作题目与 AI 预设](#模块二写作题目与-ai-预设-topics--ai)
   - [2.1 获取随机题目](#21-获取随机题目)
   - [2.2 获取系统 Prompt 与模型配置](#22-获取系统-prompt-与模型配置)
   - [2.3 提交 API Key](#23-提交-api-key)
   - [2.4 AI 代理调用](#24-ai-代理调用)
9. [模块三：写作草稿管理](#模块三写作草稿管理-writings--drafts)
   - [3.1 创建新草稿](#31-创建新草稿)
   - [3.2 覆盖更新草稿](#32-覆盖更新草稿)
   - [3.3 获取最新草稿](#33-获取最新草稿)
   - [3.4 获取草稿列表](#34-获取草稿列表)
   - [3.5 删除草稿](#35-删除草稿)
10. [模块四：正式提交与 AI 批改](#模块四正式提交与-ai-批改-writings--submits)
   - [4.1 正式提交文章](#41-正式提交文章)
   - [4.2 获取提交记录列表](#42-获取提交记录列表)
   - [4.3 获取提交记录详情](#43-获取提交记录详情)
   - [4.4 删除提交记录](#44-删除提交记录)
11. [模块四之二：AI 建议互动问答](#模块四之二ai-建议互动问答-suggestion-chat)
12. [模块五：个人词库](#模块五个人词库-vocabulary)
   - [5.1 添加词条](#51-添加词条)
   - [5.2 获取词库列表](#52-获取词库列表)
   - [5.3 删除词条（斩词）](#53-删除词条斩词)
   - [5.4 获取今日复习批次](#54-获取今日复习批次)
   - [5.5 提交复习结果](#55-提交复习结果)
13. [模块六：个人测评统计](#模块六个人测评统计-assessment)
14. [模块七：系统健康检查](#模块七系统健康检查-health)
15. [模块八：管理员系统](#模块八管理员系统-admin)
   - [8.1 管理员权限模型（RBAC）](#81-管理员权限模型rbac)
   - [8.2 获取用户列表](#82-获取用户列表)
   - [8.3 获取用户详情](#83-获取用户详情)
   - [8.4 封禁用户](#84-封禁用户)
   - [8.5 解封用户](#85-解封用户)
   - [8.6 修改用户 VIP 等级](#86-修改用户-vip-等级)
   - [8.7 管理员操作日志](#87-管理员操作日志)
   - [8.8 管理大模型 Provider](#88-管理大模型-provider)
   - [8.9 管理角色与权限](#89-管理角色与权限)
   - [8.10 管理系统配置](#810-管理系统配置)
   - [8.11 管理励志语录](#811-管理励志语录)
   - [8.12 管理签到段位](#812-管理签到段位)
   - [8.13 查看 Token 用量统计](#813-查看-token-用量统计)
   - [8.14 管理系统公告](#814-管理系统公告)
16. [模块九：用户协议](#模块九用户协议-agreements)
17. [模块十：每日打卡](#模块十每日打卡-checkin)
18. [模块十一：LLM Token 用量追踪](#模块十一llm-token-用量追踪)
   - [11.1 上报 Token 用量（补录用途）](#111-上报-token-用量补录用途)
   - [11.2 获取用量汇总](#112-获取用量汇总)
   - [11.3 获取用量明细](#113-获取用量明细)
   - [11.4 获取预算状态](#114-获取预算状态)
   - [11.5 设置个人预算](#115-设置个人预算)
19. [模块十二：隐私与个人数据控制](#模块十二隐私与个人数据控制-privacy)
   - [12.1 删除 AI 对话记忆](#121-删除-ai-对话记忆)
20. [模块十三：系统公告](#模块十三系统公告-announcements)
21. [全局安全防御策略](#全局安全防御策略)

---

## 基础说明

| 项目           | 说明                                                              |
| ------------ | --------------------------------------------------------------- |
| **Base URL** | `/api/v1`                                                       |
| **数据格式**     | 请求与响应默认均采用 `application/json`                                   |
| **字符编码**     | UTF-8                                                           |
| **认证方式**     | JWT (JSON Web Token)，Header 中携带 `Authorization: Bearer <Token>` |
| **鉴权范围**     | 除登录、注册、发送验证码、重置密码、健康检查、获取最新/历史协议等公开接口外，其余接口均需鉴权（具体见各接口的"鉴权"说明） |

### API 版本策略

本项目采用 **URL 路径版本化**：所有接口路径以 `/api/v1/` 为前缀。`v1` 对应首个公开发布版本。

| 场景 | 处理方式 |
|------|----------|
| **非破坏性新增**（加字段、加接口） | 直接加入 `v1`，不升版本号 |
| **破坏性变更**（改字段类型、删字段、改接口语义） | 新建 `v2` 路径，`v1` 保留至少 6 个月过渡期并在响应头中加入 `Deprecation: true` + `Sunset` 日期 |
| **安全修复**（权限漏洞、数据泄露等） | 直接在 `v1` 修复，不视为破坏性变更，不升版本号 |

> **当前阶段：** 项目处于 `v1` 开发期，所有接口均为 `v1`。本文档所有路由均以 `/api/v1/` 为前缀，文中路径简写沿用 `/api/...` 仅为可读性，实际部署路由以 Base URL 为准。

---

## 架构总览与技术栈

本项目采用前后端分离架构，核心目标是提供高吞吐、高安全性的 Web API 服务，并妥善持久化前端与大模型交互产生的结构化数据。

| 层面       | 技术选型                      | 说明                         |
| -------- | ------------------------- | -------------------------- |
| **核心框架** | C# ASP.NET Core (Web API) | .NET 8+                    |
| **数据库**  | PostgreSQL                | 利用 `JSONB` 特性存储灵活的 AI 评测数据 |
| **ORM**  | Entity Framework Core     | Code-First 迁移              |
| **认证鉴权** | JWT + BCrypt              | `BCrypt.Net-Next` 强哈希加盐    |
| **限流**   | ASP.NET Core Rate Limiter | 内置中间件                      |
| **API 文档** | Swashbuckle (Swagger) | 自动生成 OpenAPI 规范文档，集成 Swagger UI |

---

## Swagger / Swashbuckle 集成

本项目使用 `Swashbuckle.AspNetCore` 自动生成 OpenAPI 规范文档，并提供 Swagger UI 交互式调试界面。

### NuGet 包

```xml
<PackageReference Include="Swashbuckle.AspNetCore" Version="6.*" />
```

### 注册与中间件配置

```csharp
// Program.cs
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EverydayWriting API",
        Version = "v1",
        Description = "AI 辅助英语写作平台后端接口"
    });

    // JWT 鉴权集成到 Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // 引入 XML 注释（需配合项目生成 XML 文档文件）
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
        options.IncludeXmlComments(xmlPath);
});

// ... 省略中间件顺序 ...

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "EverydayWriting API v1");
        options.RoutePrefix = "swagger"; // 访问路径: /swagger
    });
}
```

### 项目文件配置（生成 XML 注释）

```xml
<!-- .csproj -->
<PropertyGroup>
  <GenerateDocumentationFile>true</GenerateDocumentationFile>
  <NoWarn>$(NoWarn);1591</NoWarn>
</PropertyGroup>
```

### 访问地址

| 环境 | Swagger UI | OpenAPI JSON |
|------|------------|--------------|
| 本地开发 | `http://localhost:5000/swagger` | `http://localhost:5000/swagger/v1/swagger.json` |
| 内网穿透测试 | `https://your-tunnel-url/swagger` | 由穿透工具转发 |
| 生产环境 | 默认关闭，仅 Development 打开 | — |

> **安全提示：** 生产环境务必关闭 Swagger UI（`IsDevelopment()` 条件判断），或通过 VPN / IP 白名单限制访问，避免接口文档对外暴露。

### Swagger UI 使用流程

1. 启动项目后访问 `/swagger`
2. 先调用 `POST /api/auth/login` 获取 Token
3. 点击页面右上角 **Authorize** 按钮，输入 `Bearer <Token>`
4. 后续所有需要鉴权的接口将自动携带 Token

---

## DevOps & 部署策略

### 整体部署路线

```
本地开发 → Docker Compose 本地测试 → 内网穿透临时暴露 → 
  → 服务器 Docker + GitHub Actions 自动构建部署
```

### 阶段一：本地 Docker + 内网穿透测试

在本地通过 Docker Compose 编排后端 + 数据库，使用内网穿透工具将服务暴露给前端进行联调。

#### 1. Dockerfile

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["EverydayWriting.Api/EverydayWriting.Api.csproj", "EverydayWriting.Api/"]
RUN dotnet restore "EverydayWriting.Api/EverydayWriting.Api.csproj"
COPY . .
WORKDIR "/src/EverydayWriting.Api"
RUN dotnet build "EverydayWriting.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "EverydayWriting.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS="http://+:8080"
ENTRYPOINT ["dotnet", "EverydayWriting.Api.dll"]
```

#### 2. docker-compose.yml（本地测试）

```yaml
version: "3.8"

services:
  db:
    image: postgres:16-alpine
    container_name: ew-postgres
    environment:
      POSTGRES_DB: everydaywriting
      POSTGRES_USER: ew_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-dev_password}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ew_user -d everydaywriting"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: EverydayWriting.Api/Dockerfile
    container_name: ew-api
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=db;Database=everydaywriting;Username=ew_user;Password=${DB_PASSWORD:-dev_password}
      - Jwt__Secret=${JWT_SECRET:-local_dev_secret_change_me}
      - Jwt__Issuer=EverydayWriting
      - Jwt__Audience=EverydayWriting
    ports:
      - "5000:8080"
    depends_on:
      db:
        condition: service_healthy

volumes:
  pgdata:
```

#### 3. 启动命令

```bash
# 拉取镜像 + 构建 + 后台启动
docker compose up -d --build

# 查看日志
docker compose logs -f api

# 停止
docker compose down
```

#### 4. 内网穿透

使用 ngrok / frp / Cloudflare Tunnel 将本地的 `localhost:5000` 暴露为公网 HTTPS 地址，供前端联调：

```bash
# ngrok 示例
ngrok http 5000

# Cloudflare Tunnel 示例
cloudflared tunnel --url http://localhost:5000
```

> 穿透后获得公网域名（如 `https://abc.ngrok-free.app`），修改前端 API Base URL 指向该地址即可开始联调。

---

### 阶段二：服务器 Docker + GitHub Actions 自动构建部署

本地测试稳定后，切换到生产模式：代码推送到 GitHub → GitHub Actions 自动构建 Docker 镜像 → 推送到容器仓库 → 服务器拉取并重启。

#### 1. GitHub Actions 工作流

```yaml
# .github/workflows/deploy.yml
name: Build & Deploy

on:
  push:
    branches: [main]
    paths-ignore:
      - "**.md"
      - ".gitignore"

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository_owner }}/everydaywriting-api

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,format=short
            type=ref,event=branch
            type=raw,value=latest

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: EverydayWriting.Api/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy to Server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/everydaywriting
            echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
            docker compose pull api
            docker compose up -d --no-deps --force-recreate api
            docker image prune -f
```

#### 2. 服务器 docker-compose.yml（生产环境）

```yaml
version: "3.8"

services:
  db:
    image: postgres:16-alpine
    container_name: ew-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: everydaywriting
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - ew-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d everydaywriting"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    image: ghcr.io/${GITHUB_USER}/everydaywriting-api:latest
    container_name: ew-api
    restart: unless-stopped
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Host=db;Database=everydaywriting;Username=${DB_USER};Password=${DB_PASSWORD}
      - Jwt__Secret=${JWT_SECRET}
      - Jwt__Issuer=EverydayWriting
      - Jwt__Audience=EverydayWriting
    ports:
      - "5000:8080"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - ew-network

  # 可选：Nginx 反向代理 + HTTPS
  nginx:
    image: nginx:alpine
    container_name: ew-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    networks:
      - ew-network

volumes:
  pgdata:

networks:
  ew-network:
    driver: bridge
```

#### 3. GitHub Actions 连接腾讯云服务器（SSH 配置）

GitHub Actions 通过 SSH 免密登录连上腾讯云服务器，远程执行 Docker 命令。

**原理：**

```
GitHub Actions 虚拟机 ──SSH（密钥认证）──→ 腾讯云服务器
                       🔑 私钥在 GitHub Secrets
                       🔑 公钥在服务器的 authorized_keys
```

**第一步：在腾讯云服务器上生成专用 SSH 密钥对**

```bash
# SSH 登录服务器后执行
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions
```

生成两个文件：
| 文件 | 作用 | 去向 |
|------|------|------|
| `~/.ssh/github_actions` | 私钥 | 复制到 GitHub Secrets（保密！） |
| `~/.ssh/github_actions.pub` | 公钥 | 留在服务器上 |

**第二步：将公钥加入授权列表**

```bash
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

这一步的含义：持有对应私钥的任何人都可以免密登录本服务器。

**第三步：查看并复制私钥内容**

```bash
cat ~/.ssh/github_actions
```

输出内容类似：

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...（中间很长）...
-----END OPENSSH PRIVATE KEY-----
```

> ⚠️ 从 `-----BEGIN` 到 `-----END` 全部复制，一个字符都不能少。私钥泄露等于服务器被接管，务必妥善保管。

**第四步：填入 GitHub Secrets**

打开 GitHub 仓库 → `Settings` → `Secrets and variables` → `Actions` → `New repository secret`，依次添加：

| Secret 名称 | 值 | 说明 |
|-------------|-----|------|
| `SERVER_HOST` | 腾讯云服务器公网 IP | 如 `123.456.789.0` |
| `SERVER_USER` | `root` | SSH 登录用户名 |
| `SERVER_SSH_KEY` | 第三步复制的私钥全文 | 包括 `-----BEGIN` 到 `-----END` 整段 |

最终效果：

```
GitHub 仓库 → Settings → Secrets → Actions
  ├── SERVER_HOST      = 123.456.789.0
  ├── SERVER_USER      = root
  └── SERVER_SSH_KEY   = -----BEGIN OPENSSH PRIVATE KEY-----
                          b3BlbnNzaC1rZXktdjEAAAAA...
                          -----END OPENSSH PRIVATE KEY-----
```

`GITHUB_TOKEN` 由 GitHub 自动注入，无需手动配置，用于推送镜像到 ghcr.io。

**第五步：确认服务器上 Docker Compose 可用**

```bash
# SSH 登录服务器验证
docker compose version
# 应输出：Docker Compose version v2.x.x
```

---

#### 4. 完整部署流程

代码 push 到 main 分支后，全自动流转：

```
1. GitHub 检测到 push
2. GitHub Actions 启动一台虚拟机（ubuntu-latest）
3. checkout 代码
4. docker build 构建镜像（含缓存加速）
5. docker push 推送到 ghcr.io（GitHub 容器仓库）
6. SSH 连接到腾讯云服务器（用你配的密钥免密登录）
7. 服务器上执行：
   ├── docker login ghcr.io     → 登录容器仓库
   ├── docker compose pull api   → 拉取最新镜像
   ├── docker compose up -d      → 新容器启动 → 健康检查通过 → 旧容器停掉
   └── docker image prune -f     → 清理旧镜像释放磁盘
8. 部署完成 ✅
```

整个过程用户无感知，前端请求不会中断。

#### 5. 回滚策略

```bash
# 服务器上手动回滚到指定版本
docker pull ghcr.io/username/everydaywriting-api:<commit-sha>
docker tag ghcr.io/username/everydaywriting-api:<commit-sha> ghcr.io/username/everydaywriting-api:latest
docker compose up -d --no-deps --force-recreate api
```

#### 6. 服务器迁移

Docker 部署的核心优势：API 容器本身是无状态的，可以随时重建。但 **数据库数据** 存储在命名卷 `pgdata` 中，需要单独迁移。

**迁移三步骤：**

```bash
# ===== 旧服务器 =====

# 1. 导出数据库
docker exec ew-postgres pg_dump -U ew_user -d everydaywriting > backup.sql

# 2. 发送到新服务器
scp backup.sql user@new-server:/opt/everydaywriting/
scp docker-compose.yml .env user@new-server:/opt/everydaywriting/

# ===== 新服务器 =====

# 3. 先启动数据库，导入数据，再启动全部
cd /opt/everydaywriting
docker compose up -d db
docker exec -i ew-postgres psql -U ew_user -d everydaywriting < backup.sql
docker compose up -d
```

**各文件迁移说明：**

| 文件/数据 | 迁移方式 | 说明 |
|-----------|----------|------|
| Docker 镜像 | 无需迁移 | 新服务器 `docker compose pull` 自动从 ghcr.io 拉取 |
| `docker-compose.yml` | `scp` 拷贝 | 不含敏感信息 |
| `.env` | `scp` 拷贝 | 含数据库密码、JWT Secret，走内网或加密传输 |
| 数据库数据 (pgdata) | `pg_dump` 导出再导入 | 唯一的**有状态**部分，决定了能不能无缝切换 |
| SSL 证书 (`./ssl/`) | `scp` 拷贝 | 如有 Nginx HTTPS |

> **核心认知：** Postgres 数据卷是整个系统中**唯一需要备份的资产**。镜像、代码、配置文件都是可重建的。只要 `backup.sql` 在手，任何服务器上都能一键恢复。建议配合 `cron` 每日自动备份、保留最近 7 天。

---

### 环境变量清单

| 变量 | 本地测试 | 生产环境 | 说明 |
|------|----------|----------|------|
| `ASPNETCORE_ENVIRONMENT` | `Development` | `Production` | 决定 Swagger 是否开启 |
| `ConnectionStrings__DefaultConnection` | 本地连接串 | 服务器连接串 | PostgreSQL 连接 |
| `DB_USER` | `ew_user` | 生产账号 | 数据库用户 |
| `DB_PASSWORD` | `dev_password` | 强密码 | 数据库密码 |
| `Jwt__Secret` | 本地占位 | 256bit+ 密钥 | JWT 签名密钥 |
| `Jwt__Issuer` | `EverydayWriting` | `EverydayWriting` | JWT 签发者 |
| `Jwt__Audience` | `EverydayWriting` | `EverydayWriting` | JWT 受众 |

---

### 生产部署拓扑

本项目实际部署采用"前端 Cloudflare Pages + 后端腾讯云"的混合架构：

```
用户浏览器
    ├── everydaywriting.com (Cloudflare Pages)  ← 前端静态资源，全球 CDN 加速
    └── api.kefumiao.top  (腾讯云上海)           ← 后端 API，已备案
```

**各组件职责：**

| 组件 | 部署位置 | 说明 |
|------|----------|------|
| 前端 SPA | Cloudflare Pages | 静态 HTML/JS/CSS，全球 CDN |
| Nginx | 腾讯云 Docker | HTTPS 终结 + 反向代理到 API 容器 |
| ASP.NET Core API | 腾讯云 Docker | 业务逻辑，容器内 `:8080` |
| PostgreSQL | 腾讯云 Docker | 数据持久化，不对外暴露端口 |

**部署前关键检查项：**

| 检查项 | 说明 |
|--------|------|
| ✅ `kefumiao.top` 已备案 | 腾讯云服务器合规使用 |
| ⚠️ CORS 白名单 | 后端必须配置 `https://everydaywriting.com`，否则跨域请求全被浏览器拦截（详见 [CORS 跨域配置](#7-cors-跨域配置)） |
| ⚠️ SSL 证书 | Nginx 需配置 HTTPS 证书（腾讯云免费 DV 或 Let's Encrypt），HTTP 明文传输不可接受 |
| ⚠️ 数据库每日备份 | PostgreSQL 数据卷是唯一有状态资产，务必配置 `cron` 定时 `pg_dump` 并保留近 7 天备份 |
| ⚠️ Swagger 生产关闭 | 当前代码已用 `IsDevelopment()` 包裹，生产环境自动禁用 |
| 💡 前端备案 | Cloudflare Pages 通过海外节点服务，国内用户访问偶尔波动。用户量增大后可考虑将前端迁回腾讯云 COS + CDN |

---

### 日常运维方案

以下方案面向单人维护场景，核心原则：**最小时间投入，最大安全保障**。

#### 1. 数据库自动备份（最重要）

PostgreSQL 数据卷是整个系统中**唯一丢不起的东西**。镜像、代码、配置文件都可以重建，唯独数据不能。

**本地每日备份：**

```bash
# crontab -e 加入：每天凌晨 3 点备份，保留最近 7 天
0 3 * * * docker exec ew-postgres pg_dump -U ew_user everydaywriting > /opt/everydaywriting/backups/backup_$(date +\%Y\%m\%d).sql && find /opt/everydaywriting/backups/ -name "backup_*.sql" -mtime +7 -delete
```

**异地备份到腾讯云 COS（防服务器整体故障）：**

```bash
# 安装 coscli 工具后，每天凌晨 3:30 上传到 COS
30 3 * * * gzip -c /opt/everydaywriting/backups/backup_$(date +\%Y\%m\%d).sql > /opt/everydaywriting/backups/backup_$(date +\%Y\%m\%d).sql.gz && coscli cp /opt/everydaywriting/backups/backup_$(date +\%Y\%m\%d).sql.gz cos://ew-backups/ && find /opt/everydaywriting/backups/ -name "backup_*.sql.gz" -mtime +7 -delete
```

> COS 存储成本极低（几分钱一个月），但数据安全性提升了一个量级。不需要备份的东西：Docker 镜像（ghcr.io 上都有）、代码（GitHub 上有）、配置文件（可选备份）。

**备份恢复验证（每月手动执行一次）：**

```bash
# 拉取最新备份，在本地空数据库上还原，确认数据完整
docker exec -i ew-postgres psql -U ew_user -d everydaywriting_test < backup_20260702.sql
```

**RPO 与 RTO 说明：**

| 指标 | 当前值 | 说明 |
|------|--------|------|
| **RPO**（Recovery Point Objective） | ≈ 24 小时 | 每日凌晨备份一次，最坏情况下丢失当天 0:00 至故障时刻的全部数据（用户当日提交的作文、草稿、批改结果等）。单机部署，无热备，这是当前的客观边界 |
| **RTO**（Recovery Time Objective） | ≈ 15-30 分钟 | 包含：确认故障 → 从 COS 拉取最近备份 → `psql` 还原 → 重启 API 容器。全流程依赖人工介入，无可自动化的一键恢复脚本（当前阶段人工执行更安全，避免自动恢复覆盖了本可抢救的实时数据） |

> **可选改进（非当前必须）：** 若后续用户量和数据价值增长到"一天的数据也丢不起"的程度，可开启 PostgreSQL WAL（Write-Ahead Log）归档 + `pg_basebackup` 增量备份，将 RPO 缩短到分钟级。代价是需要额外的 COS 存储空间存放 WAL 文件，以及运维复杂度上升（需监控 WAL 归档是否正常、定期验证增量链完整性）。个人项目起步阶段，每日全量备份 + 异地存储已是对数据安全足够尊重的基线。

#### 2. 容器稳定性保障

**防止日志撑爆磁盘：**

在 `docker-compose.yml` 中给每个服务加上日志限制：

```yaml
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "3"
  db:
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "3"
  nginx:
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "3"
```

**凌晨自动重启防内存泄漏：**

```bash
# 每天凌晨 4 点平滑重启 API 容器
0 4 * * * docker compose -f /opt/everydaywriting/docker-compose.yml restart api
```

凌晨重启几乎不影响用户，但能避免长时间运行导致的内存泄漏积累。

#### 3. Uptime Kuma 监控告警

[Uptime Kuma](https://github.com/louislam/uptime-kuma) 是一个开源、轻量的服务监控工具，可以和你的服务部署在同一台服务器上：

```yaml
# 加到 docker-compose.yml 里
  uptime:
    image: louislam/uptime-kuma:1
    container_name: ew-uptime
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - uptime-data:/app/data
```

**推荐配置的监控项：**

| 监控类型 | 目标 | 频率 | 说明 |
|----------|------|------|------|
| HTTP(s) | `https://api.kefumiao.top/api/health` | 每 60 秒 | API 存活检测 |
| HTTP(s) | `https://api.kefumiao.top/api/health/ready` | 每 5 分钟 | 深度检测（含数据库连通性） |
| Docker 容器 | `ew-api` / `ew-postgres` | 持续 | 容器运行状态 |

**告警渠道：** Uptime Kuma 支持企业微信、钉钉、邮件、Telegram 等多种通知方式。服务挂掉时第一时间推送到你手机上，不会出现"用户来告诉你网站挂了"的尴尬。

#### 4. 零停机部署 + 数据库迁移

GitHub Actions 中已配置的部署命令：

```bash
docker compose up -d --no-deps --force-recreate api
```

这行命令的逻辑是：新容器先启动 → 健康检查通过 → 旧容器再停掉，用户感知不到中断。

**优雅关闭：** `docker compose stop` 默认给容器 10 秒退出时间，之后直接 SIGKILL。AI 代理请求耗时可能长达 20-30 秒，10 秒不够。需在 `docker-compose.yml` 中延长：

```yaml
services:
  api:
    stop_grace_period: 35s
```

| 参数 | 建议值 | 说明 |
|------|--------|------|
| `stop_grace_period` | 35 秒 | Docker 发送 SIGTERM 后等待的最大时间。需大于最长 AI 代理请求耗时（~30 秒）+ 缓冲 |

同时对 ASP.NET Core 配置优雅关闭超时，确保收到 SIGTERM 后给正在处理的请求一个完成窗口：

```csharp
// Program.cs
builder.Services.Configure<HostOptions>(options =>
{
    options.ShutdownTimeout = TimeSpan.FromSeconds(30);
});
```

> **不做会怎样：** 部署时恰有用户正在等 AI 评分结果（已等了 15 秒），旧容器被 `docker compose up -d` 强制 SIGKILL → 用户收到 `ECONNRESET` → 以为是系统不稳定，信任度下降。配置优雅关闭后，旧容器收到 SIGTERM → 不再接受新请求 → 等待正在跑的请求自然完成（最多 30 秒）→ 之后再退出。

**EF Core 数据库连接重试策略：** 生产环境中网络波动不可避免，需在 `DbContext` 注册时启用重试策略：

```csharp
// Program.cs
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorCodesToAdd: null); // 使用 Npgsql 默认瞬态错误码
    });
});
```

| 参数 | 建议值 | 说明 |
|------|--------|------|
| `maxRetryCount` | 3 | 最多重试 3 次 |
| `maxRetryDelay` | 10 秒 | 每次重试之间的最大等待间隔（实际会指数退避） |
| 触发条件 | 默认 | 网络断开、连接池耗尽、PG 服务短暂不可用等瞬态错误——而非 SQL 语法错误或约束冲突 |

> **不做会怎样：** 数据库因网络抖动瞬断 0.5 秒 → 无重试时用户直接看到 `500` → 用户刷新页面就好了，但体验已受损。重试策略将这类瞬时故障从用户可见的错误变成后端自动恢复，用户无感。

**EF Core 自动迁移：** 每次部署有新表结构变化时，在容器启动时自动执行：

```csharp
// Program.cs
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate(); // 自动应用未执行的迁移
}
```

> ⚠️ `Migrate()` 在生产环境需谨慎——先本地测试迁移脚本，确认不会锁表或丢数据后再 push。

#### 5. 运维清单总结

| 优先级 | 要做的事 | 预计耗时 | 不做会怎样 |
|--------|---------|---------|-----------|
| 🔴 必须 | 数据库每日备份 + COS 异地存储 | 30 分钟 | 服务器故障数据全丢 |
| 🔴 必须 | Docker 日志大小限制 | 5 分钟 | 磁盘被日志撑爆 |
| 🔴 必须 | EF Core 重试策略 | 已集成 | 数据库瞬断导致用户看到 500 |
| 🟡 推荐 | Uptime Kuma 监控 + 手机告警 | 20 分钟 | 服务挂了不知道 |
| 🟡 推荐 | EF Core 自动迁移 | 已集成 | 部署后数据库表对不上 |
| 🟢 可选 | 凌晨自动重启 API | 1 分钟 | 长期运行可能内存泄漏 |

## 数据库实体设计

系统由二十五张数据表构成，分为业务域、权限域、配置域和运营域四个部分：

### User（用户表）

| 字段             | 类型        | 说明          |
| -------------- | --------- | ----------- |
| `Id`           | UUID (PK) | 主键          |
| `Email`        | string    | 邮箱，唯一索引     |
| `PasswordHash` | string    | BCrypt 哈希结果 |
| `Nickname`     | string    | 用户昵称        |
| `Avatar`       | string    | 头像 URL      |
| `IpAddress`    | string    | 最近一次注册 / 登录的原始 IP 地址（如 `123.45.67.89`），用于风控与安全审计 |
| `LocationText` | string?   | 根据 `IpAddress` 解析出的地理位置文本（如 `中国 上海`），仅用于展示，解析失败时为 `null` |
| `IsBanned`     | bool      | 是否被封禁，默认 `false` |
| `BanReason`    | string?   | 封禁原因 |
| `BannedAt`     | DateTime? | 封禁时间 |
| `BanExpiry`    | DateTime? | 封禁到期（`null` = 永久封禁） |
| `VipLevel`     | int       | VIP 等级：`0` = 普通用户（默认），`1` = VIP |
| `VipExpiry`    | DateTime? | VIP 到期时间（`null` = 永久） |
| `TokenVersion` | int       | Token 版本号，默认 `0`。仅在"退出所有设备"（[1.9 附：退出所有设备](#19-附退出所有设备)）或重置密码时 +1，用于批量使所有已签发凭证失效。单设备登出改用 `UserSession` 撤销，不再递增本字段，详见 [模块一：用户与认证](#模块一用户与认证-auth--user) 开头的会话机制说明 |
| `MustChangePassword` | bool | 是否强制要求登录后修改密码，默认 `false`。管理员账号 Seed 时置为 `true`，改密成功后清除，详见 [1.11 管理员初始密码机制](#111-管理员初始密码机制) |
| `TokenMonthlyBudget` | int? | 个人月度 Token 消耗预算上限，`null` 表示使用系统全局默认值（`SystemConfig.token_monthly_budget`），`0` 表示不限。当本月消耗超过此阈值时，前端应展示预警提示，详见 [11.4 获取预算状态](#114-获取预算状态) |
| `CreatedAt`    | DateTime  | 注册时间        |

用户与角色的关系通过关联表 `UserRole` 解耦，权限通过 `RolePermission` 关联表控制。详见下方 RBAC 实体设计。

用户的登录会话（每个 Refresh Token 对应一台设备）通过关联表 `UserSession` 管理，用于支持"单设备登出"而不误伤其他设备，详见下方 `UserSession` 实体设计和 [1.9 退出登录](#19-退出登录)。

---

### Role（角色表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `Id` | UUID (PK) | 主键 |
| `Name` | string | 角色名称，如 `super_admin`、`content_moderator` |
| `Description` | string | 角色说明 |
| `IsSystem` | bool | 系统内置角色（`true`），不可删除 |
| `CreatedAt` | DateTime | 创建时间 |

**系统预设角色：**

| 角色 | IsSystem | 说明 |
|------|----------|------|
| `super_admin` | true | 超级管理员，拥有所有权限 |
| `user` | true | 普通用户（默认），无管理权限 |

### Permission（权限表）

权限码遵循 `资源:操作` 命名规范，中间件通过权限码（而非角色名）判断是否放行。

| 字段 | 类型 | 说明 |
|------|------|------|
| `Id` | UUID (PK) | 主键 |
| `Code` | string | 权限码，唯一，如 `user:ban`、`agreement:manage` |
| `Name` | string | 权限名称，如 "封禁用户" |
| `Group` | string | 权限分组，如 "用户管理"、"协议管理"、"系统配置" |
| `CreatedAt` | DateTime | 创建时间 |

**系统预设权限：**

| Code | Name | Group |
|------|------|-------|
| `user:list` | 查看用户列表 | 用户管理 |
| `user:detail` | 查看用户详情 | 用户管理 |
| `user:ban` | 封禁/解封用户 | 用户管理 |
| `user:vip` | 修改 VIP 等级 | 用户管理 |
| `audit:view` | 查看操作日志 | 审计 |
| `agreement:manage` | 创建/修改/删除协议 | 协议管理 |
| `provider:manage` | 管理大模型 Provider | 系统配置 |
| `role:manage` | 管理角色和权限 | 系统配置 |
| `config:manage` | 管理系统配置 | 系统配置 |
| `quotes:manage` | 管理励志语录 | 运营管理 |
| `checkin_tier:manage` | 管理签到段位 | 运营管理 |
| `token_usage:view` | 查看 Token 用量统计 | 运营管理 |
| `announcement:manage` | 管理系统公告 | 运营管理 |

### UserRole（用户-角色关联表）

一个用户可以拥有多个角色，最终权限为所有角色权限的并集。

| 字段 | 类型 | 说明 |
|------|------|------|
| `UserId` | UUID (FK, PK) | 关联用户 |
| `RoleId` | UUID (FK, PK) | 关联角色 |

### RolePermission（角色-权限关联表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `RoleId` | UUID (FK, PK) | 关联角色 |
| `PermissionId` | UUID (FK, PK) | 关联权限 |

**super_admin 角色初始化时关联所有权限。user 角色不关联任何管理权限。**

### UserSession（用户会话表）

记录每个 Refresh Token 对应的登录会话（设备），是"单设备登出"能力的基础：退出登录只撤销当前会话，不影响用户在其他设备上的登录状态。

| 字段 | 类型 | 说明 |
|------|------|------|
| `Id` | UUID (PK) | 会话 ID，与 Refresh Token 的 Payload 中携带的 `sessionId` 对应 |
| `UserId` | UUID (FK) | 关联用户 |
| `DeviceInfo` | string? | 设备/浏览器标识（如 `UserAgent` 摘要），前端登录时可选上报，用于"设备管理"页面展示 |
| `IpAddress` | string | 创建会话时的 IP |
| `IsRevoked` | bool | 是否已被撤销（登出、"退出所有设备"、管理员强制下线等），默认 `false` |
| `RevokedAt` | DateTime? | 撤销时间 |
| `ExpiresAt` | DateTime | 会话过期时间，与 Refresh Token 有效期一致（30 天） |
| `CreatedAt` | DateTime | 创建时间（即登录时间） |
| `LastUsedAt` | DateTime | 最近一次通过该会话刷新 Token 的时间 |

**校验逻辑：** [1.6 刷新 Token](#16-刷新-token) 时，后端查询 Refresh Token 中 `sessionId` 对应的 `UserSession` 记录，若 `IsRevoked = true` 或已过期，拒绝续期并返回 401。[1.9 退出登录](#19-退出登录) 仅将当前会话的 `IsRevoked` 置为 `true`，不影响 `TokenVersion` 和其他会话。

### WritingDraft（草稿表）

记录写作过程中的临时状态，采用覆盖更新机制。每个用户仅保留有限数量的草稿。

| 字段          | 类型            | 说明           |
| ----------- | ------------- | ------------ |
| `Id`        | UUID (PK)     | 主键           |
| `UserId`    | UUID (FK)     | 关联用户         |
| `TopicId`   | int?          | 关联题目 ID（可为空） |
| `Topic`     | string        | 题目文本快照       |
| `Title`     | string        | 文章标题         |
| `Content`   | string (HTML) | 富文本正文        |
| `UpdatedAt` | DateTime      | 最后更新时间       |

### WritingSubmit（正式提交表）

核心业务表。每次提交即生成一个不可变的版本快照。AI 评测数据利用 PostgreSQL `JSONB` 列灵活存储。

> **⚠️ 数据来源变更：** `AiScore`/`AiEvaluation`/`GrammarSuggestions`/`VocabularySuggestions` 这四列**不再由前端在提交时直传写入**，而是后端在 [4.1 正式提交文章](#41-正式提交文章) 时，凭 `GradingSessionId` 从 `AiGradingSession.Stages` 里权威读取后落库的只读快照。前端已经无法伪造这几个字段，详见下方 `AiGradingSession` 表和 [2.4 AI 代理调用](#24-ai-代理调用) 的说明。

| 字段                      | 类型            | 说明              |
| ----------------------- | ------------- | --------------- |
| `Id`                    | UUID (PK)     | 主键              |
| `UserId`                | UUID (FK)     | 关联用户            |
| `TopicId`               | int           | 关联题目 ID         |
| `TopicType`             | string        | 题目分类（CET4 / CET6 / IELTS 等） |
| `Topic`                 | string        | 题目文本快照          |
| `Title`                 | string        | 文章标题            |
| `Content`               | string (HTML) | 最终正文            |
| `GradingSessionId`      | UUID? (FK)    | 关联的批改会话 ID（可为空——用户可选择裸交不批改），详见 `AiGradingSession` |
| `AiScore`               | int?          | AI 综合评分 (0-100)，由后端从 `GradingSessionId` 对应会话读取写入，裸交时为 `null` |
| `AiEvaluation`          | string?       | AI 总评文本，同上，裸交时为 `null` |
| `GrammarSuggestions`    | JSONB         | 语法纠错建议列表（每条含后端分配的稳定 `id`，供 [AI 建议互动问答](#模块四之二ai-建议互动问答-suggestion-chat) 引用），裸交时为空数组 |
| `VocabularySuggestions` | JSONB         | 用词提升建议列表（结构同上），裸交时为空数组 |
| `WordCount`             | int           | 字数统计            |
| `SubmittedAt`           | DateTime      | 提交时间            |

**GrammarSuggestions JSON 结构：**

```json
[
  {
    "id": "sugg-uuid-1",
    "original": "he go",
    "correction": "he goes",
    "reason": "第三人称单数主谓一致"
  }
]
```

**VocabularySuggestions JSON 结构：**

```json
[
  {
    "id": "sugg-uuid-2",
    "original": "good",
    "suggestion": "excellent",
    "context": "a good job"
  }
]
```

> `id` 字段由后端在 [2.4 AI 代理调用](#24-ai-代理调用) 生成建议时分配（UUID），全文档统一使用它作为"建议"的稳定锚点，[AI 建议互动问答](#模块四之二ai-建议互动问答-suggestion-chat) 模块通过它定位到具体某一条建议发起追问。

### AiGradingSession（AI 批改会话表）

批改结果的**权威存储**。用户每次调用 [2.4 AI 代理调用](#24-ai-代理调用) 生成的评分、总评、语法/词汇建议，先写入这里，而不是直接交给前端保存后再由前端回传——这是防止评分被伪造的核心机制，也是"分阶段批改"（先结构、再语法/词汇）的载体。

| 字段 | 类型 | 说明 |
|------|------|------|
| `Id` | UUID (PK) | 会话 ID |
| `UserId` | UUID (FK) | 所属用户 |
| `ContentHash` | string | 批改时文章正文的 SHA-256 摘要。[4.1 正式提交](#41-正式提交文章) 时会重新计算本次提交 `content` 的哈希并与此比对，防止"批改一篇、偷偷提交另一篇却顶用同一份高分" |
| `Stages` | JSONB | 累积各阶段的批改结果，结构：`{"structure": {...}, "evaluation": {...}, "grammar": [...], "vocabulary": [...]}`，字段随 [2.4](#24-ai-代理调用) 的 `purpose` 调用逐步补齐，允许只调用其中一部分（如只做语法，不做结构分析） |
| `Status` | enum | `InProgress`（可继续追加阶段结果）/ `Consumed`（已被某次 [4.1](#41-正式提交文章) 提交消费，不可再用）/ `Expired`（超过 `ExpiresAt` 未使用） |
| `CreatedAt` | DateTime | 会话创建（首次调用 2.4 且未传 `gradingSessionId`）时间 |
| `ExpiresAt` | DateTime | 会话过期时间，`CreatedAt + 2 小时`，超时后的追加调用或提交一律拒绝，需重新批改 |
| `ConsumedAt` | DateTime? | 被 [4.1](#41-正式提交文章) 消费的时间 |

> **一次性消费：** 会话一旦被某次 [4.1](#41-正式提交文章) 提交成功消费，`Status` 立即变为 `Consumed`，不可被第二次提交复用，避免"一次批改结果被重复利用刷分"。

### SuggestionChat（AI 建议追问对话表）

支撑[AI 建议互动问答](#模块四之二ai-建议互动问答-suggestion-chat)：用户针对 `WritingSubmit.GrammarSuggestions`/`VocabularySuggestions` 中某一条具体建议追问，而不必重发整篇作文。

| 字段 | 类型 | 说明 |
|------|------|------|
| `Id` | UUID (PK) | 主键 |
| `UserId` | UUID (FK) | 关联用户 |
| `SubmitId` | UUID (FK) | 关联的正式提交记录 |
| `SuggestionId` | string | 对应 `GrammarSuggestions`/`VocabularySuggestions` 中某条建议的 `id` |
| `Messages` | JSONB | 对话轮次数组：`[{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]`，按时间顺序追加 |
| `CreatedAt` | DateTime | 首次提问时间 |
| `UpdatedAt` | DateTime | 最后一次追问/回复时间 |

### Vocabulary（个人词库表）

新增遗忘曲线复习相关字段（简化版 SM-2 算法，类 Anki），使词库从"被动列表"变为可主动推送的每日复习任务，详见 [模块五：个人词库](#模块五个人词库-vocabulary) 的 `GET /api/vocabulary/review`。

| 字段                | 类型        | 说明                      |
| ----------------- | --------- | ----------------------- |
| `Id`              | UUID (PK) | 主键                      |
| `UserId`          | UUID (FK) | 关联用户                    |
| `Word`            | string    | 目标词汇                    |
| `Translation`     | string    | 中文释义                    |
| `WrongUsage`      | string    | 曾用错的表达                  |
| `ContextSentence` | string    | 例句上下文                   |
| `Type`            | enum      | `NewWord` / `WrongWord` |
| `EaseFactor`      | float     | 记忆难度系数，默认 `2.5`，SM-2 算法核心参数，值越大代表记得越牢、间隔增长越快 |
| `IntervalDays`    | int       | 距上次复习后到下次复习的天数间隔，默认 `0`（意味着收藏后立即进入待复习队列） |
| `Repetitions`      | int       | 连续"记得"的复习次数，默认 `0`，一旦某次复习标记"不记得"则清零 |
| `LastReviewedAt`  | DateTime? | 最近一次复习时间，未复习过为 `null` |
| `NextReviewDate`  | DateTime  | 下次应复习日期，默认等于 `CreatedAt`（即收藏后立即可复习） |
| `CreatedAt`       | DateTime  | 收藏时间                    |

---

### UserLoginLog（用户登录日志表）

每次用户登录时自动记录，用于管理员查看用户登录历史和异常登录检测。

| 字段             | 类型        | 说明          |
| -------------- | --------- | ----------- |
| `Id`           | UUID (PK) | 主键          |
| `UserId`       | UUID (FK) | 关联用户        |
| `LoginAt`      | DateTime  | 登录时间        |
| `IpAddress`    | string    | 登录 IP        |
| `IpLocation`   | string    | IP 归属地（如"中国·上海"） |
| `UserAgent`    | string    | 浏览器/设备标识    |
| `CreatedAt`    | DateTime  | 记录创建时间      |

### UserDailyUsage（每日使用统计表）

聚合用户每日使用时长和活跃度，用于管理员后台展示用户活跃趋势。

| 字段               | 类型        | 说明          |
| ---------------- | --------- | ----------- |
| `Id`             | UUID (PK) | 主键          |
| `UserId`         | UUID (FK) | 关联用户        |
| `Date`           | DateTime  | 日期（精确到天）    |
| `TotalSeconds`   | int       | 当日累计使用秒数    |
| `RequestCount`   | int       | 当日 API 请求次数 |
| `LastActivityAt` | DateTime  | 当日最后活跃时间    |

### UserAgreement（用户协议表）

存储用户须知、隐私协议等法律文本，支持版本管理。仅管理员可发布/修改。

| 字段            | 类型        | 说明          |
| ------------- | --------- | ----------- |
| `Id`          | UUID (PK) | 主键          |
| `Type`        | string    | `TermsOfService`（用户须知）/ `PrivacyPolicy`（隐私协议） |
| `Title`       | string    | 协议标题        |
| `Content`     | string    | 协议正文（Markdown） |
| `Version`     | int       | 版本号，同类型协议递增  |
| `PublishedAt` | DateTime  | 发布时间        |
| `EffectiveAt` | DateTime  | 生效时间        |
| `PublishedBy` | UUID (FK) | 发布者（管理员 ID）  |
| `CreatedAt`   | DateTime  | 创建时间        |
| `UpdatedAt`   | DateTime  | 最后修改时间      |

### UserAgreementAcceptance（用户协议接受记录表）

记录每个用户接受的协议版本，用于合规审计和"协议更新后需重新接受"的判断。

| 字段            | 类型        | 说明          |
| ------------- | --------- | ----------- |
| `Id`          | UUID (PK) | 主键          |
| `UserId`      | UUID (FK) | 关联用户        |
| `AgreementId` | UUID (FK) | 关联协议        |
| `AcceptedAt`  | DateTime  | 接受时间        |
| `IpAddress`   | string    | 接受时的 IP     |

### AdminAuditLog（管理员操作审计日志表）

全量记录管理员的所有敏感操作，用于安全审计和追溯。不可删除。

| 字段             | 类型        | 说明          |
| -------------- | --------- | ----------- |
| `Id`           | UUID (PK) | 主键          |
| `AdminUserId`  | UUID (FK) | 执行操作的管理员 ID  |
| `Action`       | string    | 操作类型（如 `ban_user`、`update_agreement`） |
| `TargetUserId` | UUID? (FK)| 被操作的用户 ID（如适用） |
| `Details`      | JSONB     | 操作详情（变更前/后的数据快照） |
| `IpAddress`    | string    | 管理员操作时的 IP   |
| `CreatedAt`    | DateTime  | 操作时间        |

---

### SystemConfig（系统配置表）

存储全局开关和参数，管理员可通过后台在线调整，无需重启服务。

| 字段 | 类型 | 说明 |
|------|------|------|
| `Key` | string (PK) | 配置键，如 `writing_word_limit` |
| `Value` | string | 配置值，如 `10000` |
| `Description` | string | 配置说明 |
| `UpdatedAt` | DateTime | 最后修改时间 |
| `UpdatedBy` | UUID (FK) | 修改者（管理员 ID） |

**预设配置项：**

| Key | 默认值 | 说明 |
|-----|--------|------|
| `writing_word_limit` | `10000` | 单次写作字数上限 |
| `draft_max_count` | `10` | 每用户最大草稿数 |
| `register_enabled` | `true` | 是否开放注册 |
| `typing_sound_enabled` | `true` | 是否启用键盘打字音效（ASMR） |
| `feature_dictionary_enabled` | `true` | 写作辅助：选中单词查词 |
| `feature_translation_enabled` | `true` | 写作辅助：中文句子翻译成英文 |
| `feature_brainstorm_enabled` | `true` | 写作辅助：思路引导与词汇推荐 |
| `feature_checkin_enabled` | `true` | 每日打卡功能开关 |
| `token_monthly_budget` | `500000` | 全局默认月度 Token 预算上限（单位：Token），`0` = 不限。用户可通过 [11.5 设置个人预算](#115-设置个人预算) 覆盖此值。当用户本月消耗达到此阈值时，前端应展示预警提示 |

> 配置项通过 `SystemConfig` 表动态管理，管理员可通过 8.10 接口在线修改。API 启动时加载到内存缓存，修改后实时刷新。

---

### UserCheckIn（每日打卡表）

用户每天首次提交作文时自动打卡，无需手动操作。`UserId + CheckInDate` 联合唯一。

| 字段 | 类型 | 说明 |
|------|------|------|
| `Id` | UUID (PK) | 主键 |
| `UserId` | UUID (FK) | 关联用户 |
| `CheckInDate` | DateTime | 打卡日期（精确到天） |
| `SubmitId` | UUID (FK) | 触发打卡的提交记录 ID |
| `CreatedAt` | DateTime | 打卡时间 |

**唯一约束：** `(UserId, CheckInDate)` 联合唯一，同一天多次提交仅记录首次。

---

### CheckInTier（签到段位配置表）

用户累计签到天数达到阈值后自动晋升段位。段位配置由超级管理员在后台维护，支持自定义段位名称、图标和天数阈值。

| 字段 | 类型 | 说明 |
|------|------|------|
| `Id` | UUID (PK) | 主键 |
| `Name` | string | 段位名称，如"青铜"、"白银"、"黄金" |
| `MinDays` | int | 该段位所需的最低累计签到天数 |
| `IconUrl` | string | 段位图标 URL（由管理员上传） |
| `SortOrder` | int | 排序权重（按 MinDays 升序排列） |
| `CreatedAt` | DateTime | 创建时间 |
| `UpdatedAt` | DateTime | 最后更新时间 |
| `UpdatedBy` | UUID (FK) | 最后更新者（管理员 ID） |

**段位判定规则：** 用户当前段位 = `MinDays` ≤ 用户 `totalCheckIns` 的所有段位中 `MinDays` 最大的那条。例如用户累计签到 55 天，则段位为"黄金"（50 天阈值），而非"铂金"（需 100 天）。

**系统预设段位：**

| Name | MinDays | 说明 |
|------|---------|------|
| 青铜 | 1 | 默认段位，注册即有（首次打卡后激活） |
| 白银 | 10 | 累计签到 10 天 |
| 黄金 | 50 | 累计签到 50 天 |
| 铂金 | 100 | 累计签到 100 天 |
| 钻石 | 200 | 累计签到 200 天 |
| 王者 | 300 | 累计签到 300 天 |

> **设计说明：** 段位基于**累计签到天数**（`totalCheckIns`）而非连续签到天数（`currentStreak`）。这样用户不会因为中断一天而掉段，更友好。管理员可通过后台接口随时新增、修改或删除段位配置。

### MotivationalQuote（励志语录表）

根据用户当日打卡状态动态轮播。管理员可在后台新增/修改/禁用。

| 字段 | 类型 | 说明 |
|------|------|------|
| `Id` | UUID (PK) | 主键 |
| `Content` | string | 语录内容 |
| `Category` | string | `checked_in`（已打卡展示）/ `not_checked_in`（未打卡展示） |
| `IsEnabled` | bool | 是否启用，默认 `true` |
| `SortOrder` | int | 排序权重 |
| `CreatedAt` | DateTime | 创建时间 |

**预设语录示例：**

| Category | Content |
|----------|---------|
| `checked_in` | "你今天又进步了一点，坚持就是最好的天赋 ✨" |
| `checked_in` | "每天一篇，积累的力量远超你的想象 📝" |
| `not_checked_in` | "今天还没有提交作文哦，快来写点什么吧 💪" |
| `not_checked_in` | "不积跬步无以至千里，今天的英语练习在等着你呢 🌱" |

---

### Announcement（系统公告表）

超级管理员发布的全站公告，用户在登录后或首页看到未读公告。

| 字段 | 类型 | 说明 |
|------|------|------|
| `Id` | UUID (PK) | 主键 |
| `Title` | string | 公告标题 |
| `Content` | string | 公告正文（Markdown） |
| `Priority` | enum | `Normal`（普通，默认）/ `Important`（重要）/ `Urgent`（紧急），前端据此决定展示样式 |
| `IsPublished` | bool | 是否已发布，默认 `false`。仅已发布的公告对用户可见 |
| `PublishedAt` | DateTime? | 发布时间 |
| `ExpiresAt` | DateTime? | 过期时间（`null` = 永不过期，始终展示直到手动下架） |
| `CreatedBy` | UUID (FK) | 发布者（管理员 ID） |
| `CreatedAt` | DateTime | 创建时间 |
| `UpdatedAt` | DateTime | 最后修改时间 |

### AnnouncementRead（用户公告阅读记录表）

记录每个用户阅读每条公告的时间，用于判断"未读"状态和红点提示。

| 字段 | 类型 | 说明 |
|------|------|------|
| `Id` | UUID (PK) | 主键 |
| `UserId` | UUID (FK, UNQ) | 关联用户 |
| `AnnouncementId` | UUID (FK, UNQ) | 关联公告 |
| `ReadAt` | DateTime | 阅读时间 |

**唯一约束：** `(UserId, AnnouncementId)` 联合唯一，同一用户对同一公告只记录一次。

> **未读判定：** 用户在 `GET /api/announcements` 中获取到的公告列表，若 `AnnouncementRead` 中无对应 `(UserId, AnnouncementId)` 记录，则为"未读"。前端据此展示红点或置顶提示。

---

### LLMUsageLog（LLM Token 用量日志表）

后端代理转发 AI 请求（见 [2.4 AI 代理调用](#24-ai-代理调用)）时，从大模型响应中自动提取 Token 用量信息并写入本表，用于用户查看自身 Token 消耗情况。

| 字段 | 类型 | 说明 |
|------|------|------|
| `Id` | UUID (PK) | 主键 |
| `UserId` | UUID (FK) | 关联用户 |
| `ProviderId` | string | 大模型 Provider ID（如 `deepseek`、`openai`），选自 `LLMProvider.Id` |
| `ModelId` | string | 具体模型 ID（如 `deepseek-chat`、`gpt-4o`），选自 `LLMModel.Id` |
| `Purpose` | string | 调用目的：`structure`（结构与逻辑分析）、`evaluation`（综合评分）、`grammar`（语法纠错）、`vocabulary`（用词建议）、`dictionary`（查词）、`translation`（翻译）、`brainstorm`（思路引导）、`suggestion_followup`（建议追问） |
| `PromptTokens` | int | 输入 Token 数 |
| `CompletionTokens` | int | 输出 Token 数 |
| `TotalTokens` | int | 总 Token 数（`PromptTokens + CompletionTokens`） |
| `CreatedAt` | DateTime | 调用时间 |

**索引：** `(UserId, CreatedAt)` 联合索引，用于按时间范围快速查询用户用量。

> **记录时机：** `POST /api/ai/proxy/{purpose}` 处理完成、拿到大模型响应后，后端自动解析其中的 `usage` 字段并写入本表，不依赖前端上报，不含 Key 字段。[11.1 上报 Token 用量](#111-上报-token-用量) 接口保留作管理员/异常场景手动补录用途，非主路径。

---

### LLMProvider（大模型 Provider 配置表）

存储前端可用的所有大模型 Provider 及其 API 调用协议。管理员可在线新增 Provider，前端无需更新代码即可支持新模型。

| 字段 | 类型 | 说明 |
|------|------|------|
| `Id` | string (PK) | 唯一标识，如 `deepseek`、`minimax`、`claude` |
| `Name` | string | 显示名称，如 `DeepSeek` |
| `BaseUrl` | string | API 基础 URL，如 `https://api.deepseek.com/v1` |
| `AuthHeader` | string | 鉴权头模板，`{API_KEY}` 为占位符，如 `Authorization: Bearer {API_KEY}` |
| `IsEnabled` | bool | 是否启用，默认 `true` |
| `SortOrder` | int | 排序权重，越小越靠前 |
| `CreatedAt` | DateTime | 创建时间 |
| `UpdatedAt` | DateTime | 最后更新时间 |

### LLMModel（大模型具体型号表）

一个 Provider 可以有多个模型（如 GPT-4o、GPT-4o-mini），每个模型的请求模板和响应解析路径可能不同。

| 字段 | 类型 | 说明 |
|------|------|------|
| `Id` | string (PK) | 唯一标识，如 `deepseek-chat`、`gpt-4o` |
| `ProviderId` | string (FK) | 关联 `LLMProvider.Id` |
| `Name` | string | 显示名称，如 `DeepSeek-V3` |
| `IsDefault` | bool | 是否该 Provider 下的默认模型 |
| `Capabilities` | JSONB | 能力标签，如 `["grammar", "evaluation", "vocabulary"]` |
| `MaxTokens` | int | 最大输出 Token 数 |
| `RequestTemplate` | JSONB | 请求体模板（含占位符，详见下文） |
| `ResponseMapping` | JSONB | 响应提取路径（含占位符，详见下文） |
| `IsEnabled` | bool | 是否启用 |
| `CreatedAt` | DateTime | |
| `UpdatedAt` | DateTime | |

**RequestTemplate 结构示例：**

```json
{
  "endpoint": "/chat/completions",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "model": "{MODEL_ID}",
    "messages": [
      { "role": "system", "content": "{SYSTEM_PROMPT}" },
      { "role": "user", "content": "{USER_MESSAGE}" }
    ],
    "temperature": 0.7,
    "max_tokens": "{MAX_TOKENS}"
  }
}
```

模板中的占位符由前端在发送请求时替换：

| 占位符 | 替换来源 |
|--------|----------|
| `{MODEL_ID}` | 用户选择的模型 ID |
| `{SYSTEM_PROMPT}` | 2.2 接口返回的对应 Prompt |
| `{USER_MESSAGE}` | 用户文章正文 + 拼装后的指令 |
| `{MAX_TOKENS}` | 模型配置的 `MaxTokens` |

**ResponseMapping 结构示例：**

```json
{
  "contentPath": "choices[0].message.content",
  "usagePath": "usage",
  "usageFields": {
    "promptTokens": "prompt_tokens",
    "completionTokens": "completion_tokens"
  }
}
```

不同模型的响应格式差异通过 `contentPath` 和 `usagePath` 适配：

| 模型 | contentPath | usagePath |
|------|------------|-----------|
| OpenAI / DeepSeek / 豆包 / Moonshot | `choices[0].message.content` | `usage` |
| Claude | `content[0].text` | `usage` |
| Gemini | `candidates[0].content.parts[0].text` | `usageMetadata` |

---

## 通用规约

### 请求关联 ID

每个请求在进入后端时由中间件自动分配一个唯一标识（`X-Request-Id`），贯穿请求处理全生命周期，并写入日志上下文。响应头中携带该 ID 返回给前端。

| 项目 | 说明 |
|------|------|
| **Header 名称** | `X-Request-Id` |
| **格式** | UUID v4（如 `a1b2c3d4-e5f6-7890-abcd-ef1234567890`） |
| **来源** | 若请求已携带该头（前端或 Nginx 传入），后端直接复用；否则后端自动生成 |
| **响应头** | 始终返回，即使请求未携带 |

**前端使用场景：**

```
用户反馈"刚才提交作文报错了，时间是 14:30 左右"
  → 前端从报错响应中取出 X-Request-Id
  → 运维在后端日志中搜索该 ID → 精确找到该请求的完整调用链和错误堆栈
```

不具备此机制时，运维只能用"14:30 + 用户邮箱 + 接口路径"模糊排查，在请求量大时几乎不可能定位。

### 统一响应格式

所有接口返回以下标准结构：

```json
{
  "code": 200,
  "message": "success",
  "data": { }
}
```

| 字段        | 类型                    | 说明                          |
| --------- | --------------------- | --------------------------- |
| `code`    | int                   | 业务状态码，与 HTTP Status Code 一致 |
| `message` | string                | 状态描述                        |
| `data`    | object / array / null | 实际返回数据                      |

> **例外：** [模块七：系统健康检查](#模块七系统健康检查-health) 的两个探活接口（`/api/health`、`/api/health/ready`）不遵循此结构，直接返回 `{ status, checks, timestamp }`。这是 Kubernetes / Docker / 负载均衡器探活的行业惯例格式，探活组件只关心 HTTP 状态码和固定字段，不需要也不应该包一层业务响应结构。

### 分页响应格式

带分页的列表接口统一返回：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [ ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 156,
    "totalPages": 8
  }
}
```

**分页 Query 参数：** `?page=1&pageSize=20`（默认 `page=1`, `pageSize=20`, 最大 `pageSize=100`）

### 错误码速查表

| HTTP Code | 含义      | 典型场景           |
| --------- | ------- | -------------- |
| `200`     | 成功      | 正常返回           |
| `201`     | 创建成功    | POST 新建资源      |
| `400`     | 请求参数错误  | 字段校验失败、验证码错误   |
| `401`     | 未认证     | Token 缺失、过期或无效 |
| `403`     | 无权限     | 尝试操作他人资源（BOLA） |
| `404`     | 资源不存在   | 草稿 / 提交记录未找到   |
| `429`     | 请求过于频繁  | 触发限流           |
| `500`     | 服务器内部错误 | 未预期的异常         |

---

## 模块一：用户与认证 (Auth & User)

### 1.1 发送邮箱验证码

- **POST** `/api/auth/send-code`
- **鉴权：** 无需

**Payload:**

```json
{
  "email": "user@example.com",
  "purpose": "register"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 接收验证码的邮箱 |
| `purpose` | enum | 是 | `register`（注册）/ `reset`（重置密码）/ `login_captcha`（登录验证码） |

**Response (200):**

```json
{
  "code": 200,
  "message": "验证码已发送",
  "data": null
}
```

**Response (429) — 触发限流：**

```json
{
  "code": 429,
  "message": "操作过于频繁，请稍后再试",
  "data": null
}
```

**限流：** 单 IP 每 60 秒最多 1 次，单邮箱每 24 小时最多 5 次。

---

### 1.2 用户注册

- **POST** `/api/auth/register`
- **鉴权：** 无需

**Payload:**

```json
{
  "email": "user@example.com",
  "password": "your_password",
  "code": "123456"
}
```

| 字段         | 校验规则             |
| ---------- | ---------------- |
| `email`    | 有效邮箱格式，未注册       |
| `password` | 最少 8 位，含大小写字母和数字 |
| `code`     | 6 位数字，5 分钟内有效    |

**Response (201)：**

```json
{
  "code": 201,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "nickname": "用户xxxx"
    }
  }
}
```

**Response (400) — 连续校验失败（触发额外防护）：**

```json
{
  "code": 400,
  "message": "请求过于频繁，请 15 分钟后再试",
  "data": { "cooldownSeconds": 900 }
}
```

> **防批量注册策略：** 同一 IP 连续 5 次注册失败（验证码错误、密码格式不符等），触发 15 分钟冷却期，冷却期内该 IP 无法调用注册接口。此策略与 [1.1 发送邮箱验证码](#11-发送邮箱验证码) 的独立限流同时生效，双重防护。

---

### 1.3 用户登录

- **POST** `/api/auth/login`
- **鉴权：** 无需

**Payload（正常登录）：**

```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Payload（触发验证码后登录）：**

```json
{
  "email": "user@example.com",
  "password": "your_password",
  "code": "123456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 注册邮箱 |
| `password` | string | 是 | 密码 |
| `code` | string | 条件必填 | 仅当触发"密码错误 5 次"后需要，通过 `POST /api/auth/send-code`（`purpose: "login_captcha"`）获取 |

**Response (200) — 登录成功：**

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    "expiresAt": "2026-07-09T12:00:00Z",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "nickname": "用户xxxx",
      "avatar": "https://...",
      "vipLevel": 0,
      "needAcceptAgreement": false,
      "mustChangePassword": false
    }
  }
}
```

| 字段 | 说明 |
|------|------|
| `refreshToken` | Payload 中内嵌一个 `sessionId`，对应新建的一条 `UserSession` 记录（见 [数据库实体设计](#数据库实体设计)），用于支持后续 [1.6 刷新 Token](#16-刷新-token) 的会话级校验和 [1.9 退出登录](#19-退出登录) 的单设备撤销 |
| `user.mustChangePassword` | 是否强制要求登录后立即修改密码。仅管理员账号在 Seed 创建后首次登录为 `true`，详见 [1.11 管理员初始密码机制](#111-管理员初始密码机制)。为 `true` 时前端应强制跳转改密页，其余功能均不可用 |

**Response (400) — 密码错误（未达阈值）：**

```json
{
  "code": 400,
  "message": "密码错误，还剩 3 次尝试机会",
  "data": {
    "remainingAttempts": 3
  }
}
```

**Response (400) — 密码错误（触发验证码）：**

```json
{
  "code": 400,
  "message": "密码错误次数过多，本次登录需要邮箱验证码",
  "data": {
    "requireCaptcha": true,
    "remainingAttempts": 0
  }
}
```

> **错误计数规则：** 相同邮箱连续密码错误 5 次后，必须携带 `code` 字段。错误计数在以下情况下清零：登录成功、重置密码成功、24 小时后自动过期。验证码错误不计入密码错误次数（单独校验）。

**限流：** 单 IP 每 60 秒最多 5 次登录尝试。触发验证码后，每次登录尝试额外消耗一次 `send-code` 配额。

---

### 1.4 获取个人信息

- **GET** `/api/user/profile`
- **鉴权：** 需要

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "用户xxxx",
    "avatar": "https://...",
    "vipLevel": 0,
    "vipExpiry": null,
    "tokenMonthlyBudget": null,
    "ipAddress": "123.45.67.89",
    "locationText": "中国·北京",
    "stats": {
      "totalWritings": 24,
      "totalWords": 5600,
      "vocabularyCount": 42,
      "tokenUsage": {
        "consumedThisMonth": 245800,
        "totalCalls": 190
      }
    },
    "createdAt": "2026-01-15T08:30:00Z"
  }
}
```

---

### 1.5 重置密码

- **POST** `/api/auth/reset-password`
- **鉴权：** 无需

**Payload:**

```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "new_password"
}
```

| 字段 | 校验规则 |
|------|----------|
| `email` | 已注册的邮箱 |
| `code` | 6 位数字，5 分钟内有效（需与 1.1 发送时 `purpose: "reset"` 的验证码匹配） |
| `newPassword` | 最少 8 位，含大小写字母和数字，不能与旧密码相同 |

**Response (200):**

```json
{
  "code": 200,
  "message": "密码重置成功",
  "data": null
}
```

> **注意：** 重置成功后，该账号所有已签发的 JWT Token 全部失效，需重新登录。

---

### 1.6 刷新 Token

- **POST** `/api/auth/refresh`
- **鉴权：** 需要（携带即将过期的 Token）

**功能：** Access Token 临过期前，使用 Refresh Token 无感续期，避免用户频繁登录。

**Payload:**

```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl..." 
}
```

| 字段 | 说明 |
|------|------|
| `refreshToken` | 登录时随 Access Token 一并返回，有效期 30 天 |

**校验逻辑（会话级 + 全局版本双重校验）：** Refresh Token 的 Payload 中携带签发时的 `sessionId` 和 `tokenVersion`。本接口在签发新 Token 前依次校验：

```
1. 解析 Refresh Token，取出其中的 sessionId 和 tokenVersion（签发时的快照）
2. 查询数据库中 sessionId 对应的 UserSession 记录：
   a. 记录不存在，或 IsRevoked = true，或已过期 → 说明该会话已被撤销
      （用户在这台设备上退出登录，见 1.9），拒绝续期，返回 401
3. 查询数据库当前 User.TokenVersion，与 Token 内快照比对：
   a. 若不一致 → 说明用户触发过"退出所有设备"（1.9 附）或重置密码（1.5），
      拒绝续期，返回 401，前端跳转重新登录
4. 若两步校验均通过 → 签发新的 Access Token + Refresh Token（复用同一个 sessionId，
   内嵌当前 tokenVersion），并更新该 UserSession 的 LastUsedAt
```

会话级校验（步骤 2）解决"单设备登出"场景——只撤销当前设备的会话，不影响其他设备。全局版本校验（步骤 3）保留用于"退出所有设备"和改密后批量失效所有已签发凭证的场景，两者互不替代，详见 [数据库实体设计 → UserSession](#usersession用户会话表) 和 [1.9 退出登录](#19-退出登录)。

**Response (200):**

```json
{
  "code": 200,
  "message": "Token 已刷新",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    "expiresAt": "2026-07-09T12:00:00Z"
  }
}
```

**Response (401) — 会话已撤销或版本不匹配：**

```json
{
  "code": 401,
  "message": "登录状态已失效，请重新登录",
  "data": null
}
```

| 字段 | 有效期 | 说明 |
|------|--------|------|
| `token` (Access Token) | 7 天 | 用于 API 鉴权 |
| `refreshToken` (Refresh Token) | 30 天 | 内嵌 `sessionId`，对应一条可被单独撤销的 `UserSession` 记录 |

> **前端策略：** 在每次 API 调用的响应拦截器中检查 Token 是否即将过期（如剩余 < 1 天），自动调用本接口续期；若本接口返回 401，说明账号在这台设备上触发了登出，或在任意设备上触发了改密/"退出所有设备"，直接清除本地凭证并跳转登录页。

---

### 1.7 修改个人信息

- **PUT** `/api/user/profile`
- **鉴权：** 需要

**Payload:**

```json
{
  "nickname": "新昵称",
  "avatar": "https://cdn.example.com/avatars/user-uuid.png"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `nickname` | string | 否 | 2-20 字符，不能为纯空格 |
| `avatar` | string | 否 | 头像 URL（需先通过 [1.10 文件上传](#110-文件上传) 获取 URL） |

**Response (200):**

```json
{
  "code": 200,
  "message": "个人信息已更新",
  "data": {
    "nickname": "新昵称",
    "avatar": "https://cdn.example.com/avatars/user-uuid.png"
  }
}
```

---

### 1.7 附：修改密码

- **PUT** `/api/user/password`
- **鉴权：** 需要

**功能：** 已登录用户主动修改密码，无需走"忘记密码"的邮箱验证码流程。改密成功后，除当前设备外的所有其他会话立即失效，当前设备自动获得新 Token 无需重新登录。

**Payload:**

```json
{
  "oldPassword": "current_password",
  "newPassword": "new_password"
}
```

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| `oldPassword` | string | 是 | 需与当前密码一致 |
| `newPassword` | string | 是 | 最少 8 位，含大小写字母和数字，不能与旧密码相同 |

**后端处理逻辑：**

```
1. BCrypt 校验 oldPassword 与数据库中的 PasswordHash
   不一致 → 400，提示"当前密码错误"
2. 校验 newPassword 不能与 oldPassword 相同
   相同 → 400，提示"新密码不能与当前密码相同"
3. 校验 newPassword 格式（同注册规则）
4. 计算新 BCrypt 哈希，替换 PasswordHash
5. TokenVersion + 1（使所有旧 Token 失效）
6. 批量撤销该用户名下所有现有 UserSession（IsRevoked = true）
7. 为当前设备创建一条新的 UserSession，签发新的 Access Token + Refresh Token
```

| 步骤 5-6 | 确保在其他设备上登录的会话全部失效，防止旧密码泄露后已登录的设备持续有效 |
| 步骤 7 | 用户无需手动重新输入账号密码，体验无缝衔接 |

**Response (200)：**

```json
{
  "code": 200,
  "message": "密码已修改",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    "expiresAt": "2026-07-10T12:00:00Z"
  }
}
```

**Response (400) — 当前密码错误：**

```json
{
  "code": 400,
  "message": "当前密码错误",
  "data": null
}
```

**Response (400) — 新旧密码相同：**

```json
{
  "code": 400,
  "message": "新密码不能与当前密码相同",
  "data": null
}
```

> **与 1.5 重置密码的区别：** 1.5（忘记密码）面向未登录用户，需要邮箱验证码，不需要旧密码。本接口面向已登录用户，需要输入旧密码作为身份二次确认，不需要验证码，且改密成功后自动返回新 Token 保持当前设备登录状态。

---

### 1.8 登录安全：错误次数限制与验证码

#### 机制总览

防止暴力破解密码：当同一邮箱连续输错密码达到阈值后，登录必须额外提供邮箱验证码。攻击者需要同时攻破密码 + 邮箱才能登录。

```
正常登录：邮箱 + 密码 → 成功
多次失败后：邮箱 + 密码 + 验证码 → 成功
```

#### 错误计数规则

| 项目 | 说明 |
|------|------|
| 计数维度 | 按邮箱独立计数（同一邮箱不管从哪个 IP 登录，共用计数器） |
| 触发阈值 | 连续 **5 次**密码错误 |
| 触发后行为 | 登录响应返回 `requireCaptcha: true`，后续登录必须携带 `code` |
| 计数器归零 | ① 登录成功 ② 重置密码成功 ③ 距最后一次错误满 24 小时自动过期 |
| 验证码错误 | 不计入密码错误次数，不增加计数器（防止攻击者用错误验证码封堵账号） |

#### 用户操作流程

```
1. 用户输错密码 → 提示"还剩 3 次"
2. 再次输错 → 提示"还剩 2 次"
   ...
5. 第 5 次输错 → 提示"需要验证码"
6. 前端引导用户点击"发送验证码" → POST /api/auth/send-code (purpose: login_captcha)
7. 用户查收邮箱 → 输入 6 位验证码 + 密码
8. 登录成功 → 计数器归零
```

#### 数据存储

错误计数使用内存缓存（如 `IMemoryCache` 或 Redis），无需建表：

| 缓存 Key | 值 | 过期时间 |
|-----------|-----|---------|
| `login_fail:{email}` | 连续失败次数（int） | 24 小时后滑动过期 |

> 使用缓存而非数据库的理由：计数器是临时风控数据，无持久化价值，缓存性能更高且天然支持过期清理。

---

### 1.9 退出登录

- **POST** `/api/auth/logout`
- **鉴权：** 需要

**功能：** 用户在当前设备主动退出，仅撤销当前设备对应的登录会话，不影响用户在其他设备上的登录状态。

> **⚠️ 行为变更说明：** 此前版本的退出登录会通过 `User.TokenVersion + 1` 使该账号在**所有设备**上的 Token 同时失效。这在多端使用场景下会误伤——例如在手机上退出登录，会导致电脑端也被强制下线。现改为**单设备登出**：退出登录只撤销发起请求的这一个会话（见下方实现原理），"退出所有设备"作为独立能力保留在 [1.9 附：退出所有设备](#19-附退出所有设备)。

**实现原理：** [数据库实体设计 → UserSession](#usersession用户会话表) 表记录每个 Refresh Token 对应的会话。登录时创建一条 `UserSession` 记录（`Id` 即 `sessionId`，写入 Refresh Token 的 Payload）；退出登录时，后端从当前请求的 Access Token 中取出 `sessionId`，将对应 `UserSession.IsRevoked` 置为 `true`。

```
登录时：创建 UserSession(id=session-abc, IsRevoked=false)，JWT 内嵌 sessionId=session-abc
退出时：UserSession(session-abc).IsRevoked = true
下次用该设备的 Refresh Token 续期：查到 session-abc 已撤销 → 401 拦截
其他设备的会话（如 session-xyz）不受影响，仍可正常刷新
```

**Response (200):**

```json
{
  "code": 200,
  "message": "已退出登录",
  "data": null
}
```

**前端需要做的事：**

```javascript
// 退出登录 → 调接口 + 清本地存储
await fetch('/api/auth/logout', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }
});
localStorage.removeItem('token');
localStorage.removeItem('refreshToken');
localStorage.removeItem('user');
// 跳转到登录页
```

---

### 1.9 附：退出所有设备

- **POST** `/api/auth/logout-all`
- **鉴权：** 需要

**功能：** 用户主动选择"退出所有设备"（如怀疑账号在其他设备异常登录）时调用，使当前账号所有已签发的 Token（Access Token + Refresh Token，覆盖全部设备）立即失效。

**实现原理：** `User.TokenVersion + 1`，同时将该用户名下所有 `UserSession` 记录的 `IsRevoked` 批量置为 `true`。后续所有旧 Token 因版本不匹配或会话已撤销被中间件拦截。

```
调用前：JWT 内 tokenVersion = 3，用户名下有 3 条有效 UserSession（对应 3 台设备）
调用后：数据库 User.TokenVersion 更新为 4，3 条 UserSession 全部 IsRevoked = true
下次任意设备发起请求：tokenVersion 不匹配或会话已撤销 → 401 拦截，需重新登录
```

**Response (200):**

```json
{
  "code": 200,
  "message": "已退出所有设备",
  "data": null
}
```

> **注意：** 重置密码（1.5）同样会触发 `TokenVersion + 1` 并撤销所有 `UserSession`，这意味着重置密码后所有设备上的登录态都会失效，需要重新登录——这是有意的安全行为（防止旧密码泄露后攻击者持有的会话继续有效），与本接口共享同一套全局失效机制。

---

### 1.10 文件上传

- **POST** `/api/files/upload`
- **鉴权：** 需要
- **Content-Type：** `multipart/form-data`

**功能：** 上传图片文件（用户头像、[8.12 管理签到段位](#812-管理签到段位) 图标等），返回可直接引用的 CDN/静态资源 URL。此前 [1.7 修改个人信息](#17-修改个人信息) 和 [8.12.2 新增段位](#8122-新增段位) 中提到的"文件上传接口"均指向本接口。

**Payload：** `multipart/form-data`，携带单个字段 `file`。

**校验规则：**

| 项目 | 规则 |
|------|------|
| 允许类型 | `image/jpeg`、`image/png`、`image/webp` |
| 大小上限 | 2MB |
| 命名策略 | 后端生成 UUID 文件名后存储，不使用用户上传的原始文件名，避免路径穿越与文件覆盖 |
| 内容校验 | 校验文件头 magic number 与声明的 MIME 类型一致，防止伪造扩展名绕过类型限制 |

**Response (200)：**

```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "https://cdn.example.com/uploads/3f2a1b9c-....png"
  }
}
```

**Response (400) — 类型或大小不合法：**

```json
{
  "code": 400,
  "message": "仅支持 jpg / png / webp 格式，且大小不超过 2MB",
  "data": null
}
```

**限流：** 单用户每分钟最多 10 次，防止滥用存储空间。

---

### 1.11 管理员初始密码机制

**功能：** 解决管理员账号在数据库 Seed 脚本创建时，初始密码若硬编码在代码库中会被长期泄露的问题。

**机制：**

```
1. Seed 脚本执行时，为管理员账号随机生成一个高强度临时密码
   （建议 16 位，含大小写字母、数字、符号），只打印到部署时的控制台/日志输出，
   不写入代码库，也不以明文形式存入数据库（仍按现有哈希算法存储）
2. User.MustChangePassword 置为 true（见 [数据库实体设计 → User](#user用户表)）
3. 部署人员从部署日志中获取该临时密码，交接给实际管理员
4. 管理员使用临时密码首次登录 → 登录响应 data.user.mustChangePassword = true
   （见 [1.3 用户登录](#13-用户登录)）
5. 前端检测到 mustChangePassword = true 后，强制跳转"修改密码"页，
   期间除"修改密码"接口外的其他业务接口均返回 403（后端中间件拦截，
   详见 [全局安全防御策略 → 8. 管理员权限安全](#8-管理员权限安全)）
6. 修改密码成功后，MustChangePassword 清除为 false，
   同时按 1.5 的现有行为触发 TokenVersion + 1，需重新登录换取新 Token
```

> **必要性说明：** 相比"固定初始密码写在 Seed 脚本里"，随机生成 + 强制改密的方案避免了代码库泄露、员工离职后密码仍可用等常见风险，属于低成本、必须修复的安全基线问题。

---

## 模块二：写作题目与 AI 预设 (Topics & AI)

### 2.1 获取随机题目

- **GET** `/api/topics/random`
- **鉴权：** 需要

**Query 参数：**

| 参数     | 类型     | 必填  | 说明                                              |
| ------ | ------ | --- | ----------------------------------------------- |
| `type` | string | 否   | 题目分类：`CET4`、`CET6`、`IELTS`、`TOEFL`、`考研`。不传则随机抽取 |

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "type": "CET4",
    "title": "The Importance of Environmental Protection",
    "description": "Write an essay about...",
    "wordLimit": "120-150"
  }
}
```

---

### 2.2 获取系统 Prompt 与模型配置

- **GET** `/api/ai/config`
- **鉴权：** 需要

**功能：** 返回可供用户选择的 Provider / 模型列表和功能开关，仅用于前端展示与选择。**Prompt 模板原文与 Provider 的 `baseUrl`/鉴权头模板不再下发给前端**——这两项现在只在后端内部使用，由 [2.4 AI 代理调用](#24-ai-代理调用) 在服务端组装请求。

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "vipLevel": 0,
    "providers": [
      {
        "id": "deepseek",
        "name": "DeepSeek",
        "models": [
          {
            "id": "deepseek-chat",
            "name": "DeepSeek-V3",
            "isDefault": true,
            "capabilities": ["grammar", "evaluation", "vocabulary"],
            "maxTokens": 4096
          }
        ]
      },
      {
        "id": "minimax",
        "name": "MiniMax",
        "models": [
          {
            "id": "abab7",
            "name": "abab7",
            "isDefault": true,
            "capabilities": ["grammar", "evaluation", "vocabulary"],
            "maxTokens": 4096
          }
        ]
      }
    ],
    "features": {
      "dictionary": true,
      "translation": true,
      "brainstorm": true,
      "typingSound": true
    }
  }
}
```

| 字段 | 说明 |
|------|------|
| `providers` | 仅返回 `IsEnabled = true` 的 Provider，按 `SortOrder` 排序 |
| `providers[].models` | 仅返回该 Provider 下 `IsEnabled = true` 的模型 |
| `features` | 全局功能开关，来自 `SystemConfig` 表。管理员可在线关闭任一辅助功能 |

**功能对应的 `purpose` 值速查**（用于 [2.4 AI 代理调用](#24-ai-代理调用) 的路径参数）：

| `purpose` | 触发方式 | 用途 | 是否写入批改会话 |
|-----------|---------|------|----------------|
| `structure` | 点击"批改"（分阶段模式第一步，见下方说明） | 结构与逻辑分析：段落组织、论点是否清晰、衔接是否自然 | 是 |
| `grammar` | 点击"批改" | 全文语法纠错 | 是 |
| `evaluation` | 点击"批改" | 综合评分+总评 | 是 |
| `vocabulary` | 点击"批改" | 用词提升建议 | 是 |
| `dictionary` | 选中单词 → 右键/悬浮菜单 → "查词" | 查单词释义、音标、同义词、例句 | 否 |
| `translation` | 输入中文 → 点击"翻译" | 中文句子翻译成英文，含多个风格版本 | 否 |
| `brainstorm` | 点击"思路卡住了？"按钮 | 提供论点方向、相关词汇、思路引导 | 否 |
| `suggestion_followup` | 针对某条批改建议点击"追问" | 就单条建议进行上下文追问，见 [模块四之二：AI 建议互动问答](#模块四之二ai-建议互动问答-suggestion-chat) | 否 |

对应的 Prompt 模板原文（`structure_prompt`、`grammar_prompt`、`evaluation_prompt`、`vocabulary_prompt`、`dictionary_prompt`、`translation_prompt`、`brainstorm_prompt`、`suggestion_followup_prompt`）现在存于后端配置，按 `purpose` 和用户 `vipLevel` 内部查找拼装，不再经网络下发，因此 [Prompt 传输安全方案](#prompt-传输安全方案) 一节已废弃。

> **"是否写入批改会话"列说明：** `structure`/`grammar`/`evaluation`/`vocabulary` 四类 purpose 的结果会累积写入 [2.4](#24-ai-代理调用) 新引入的 `AiGradingSession`（批改会话），最终由 [4.1 正式提交](#41-正式提交文章) 一次性、权威地读取消费，前端不再能直接把评分数据塞进提交接口。`dictionary`/`translation`/`brainstorm`/`suggestion_followup` 是辅助性调用，不影响批改会话。

> **未来规划：** 将根据用户 VIP 等级返回差异化 Provider 列表。VIP 用户可获得更高质量、更专业的评估 Prompt（如深度逻辑分析、高级词汇推荐等），普通用户只能获取基础版本。也可通过 VIP 等级限制可用模型（如 GPT-4o 仅 VIP 可用）。

---

### 2.3 提交 API Key

- **POST** `/api/ai/key`
- **鉴权：** 需要

**功能：** 用户提交自己的大模型 API Key，后端用服务端主密钥（AES-256-GCM，密钥来自环境变量 / Secret Manager，不写入代码、不写入数据库）就地加密后返回密文，**后端不持久化这个密文**——加密只是"一次性服务"，密文由前端自行保存到 `localStorage`。

**Payload：**

```json
{
  "providerId": "deepseek",
  "apiKey": "sk-xxxxxxxxxxxxxxxx"
}
```

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "encryptedKey": "base64(iv + ciphertext + authTag)"
  }
}
```

| 字段 | 说明 |
|------|------|
| `apiKey` | 明文 Key，仅通过 HTTPS 传输，接口处理完成后立即释放，不写日志、不落盘 |
| `encryptedKey` | Base64 编码的密文（含随机 IV），前端存 `localStorage`，调用 [2.4 AI 代理调用](#24-ai-代理调用) 时通过自定义 Header 带上 |

**限流：** 单用户 60 秒 ≤ 5 次，防止暴力提交。

---

### 2.4 AI 代理调用

- **POST** `/api/ai/proxy/{purpose}`
- **鉴权：** 需要
- **Header：** `X-Encrypted-Key: <2.3 返回的 encryptedKey>`（自定义 Header，非浏览器自动携带的凭证，天然不受 CSRF 影响；不使用 Cookie 传递，因为前端 `everydaywriting.com` 与后端 `api.kefumiao.top` 是不同注册域名，跨站 Cookie 在 Safari / Firefox 默认被拦截，无法保证可靠性）

**路径参数：**

| 参数 | 说明 |
|------|------|
| `purpose` | `structure` \| `grammar` \| `evaluation` \| `vocabulary` \| `dictionary` \| `translation` \| `brainstorm`，见 [2.2](#22-获取系统-prompt-与模型配置) 的 `purpose` 速查表 |

**Payload：**

```json
{
  "providerId": "deepseek",
  "modelId": "deepseek-chat",
  "userContent": "用户的文章 / 选中单词 / 待翻译文本等，具体字段随 purpose 而定",
  "gradingSessionId": "grading-session-uuid"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `providerId` / `modelId` / `userContent` | — | 是 | 同原有语义 |
| `gradingSessionId` | string | 否 | 仅当 `purpose` 属于 `structure`/`grammar`/`evaluation`/`vocabulary` 时有意义。不传：后端创建一个新的批改会话；传：把本次结果追加进该已有会话（用于"先结构分析、再语法润色"的分阶段批改，见 [AiGradingSession 批改会话机制说明](#aigradingsession-批改会话机制说明)）。若传入的会话已 `Consumed`/`Expired`，或 `ContentHash` 与本次 `userContent` 不一致，返回 `400` |

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "content": "大模型返回的结果文本",
    "gradingSessionId": "grading-session-uuid",
    "suggestionIds": {
      "grammarSuggestions": ["sugg-uuid-1", "sugg-uuid-2"],
      "vocabularySuggestions": ["sugg-uuid-3"]
    }
  }
}
```

| 字段 | 说明 |
|------|------|
| `gradingSessionId` | 仅当 `purpose` 属于批改类四种之一时返回。前端应保存它，用于后续阶段调用、[4.1 正式提交](#41-正式提交文章)、以及 [建议互动问答](#模块四之二ai-建议互动问答-suggestion-chat) |
| `suggestionIds` | 仅当 `purpose` 为 `grammar`/`vocabulary` 时返回。后端为本次生成的每一条建议分配的稳定 `id`，与 `content` 中同一自然顺序对应，前端渲染建议列表时应关联展示这些 `id`，用于后续"针对某条建议追问" |

**处理流程：**

1. 从 `X-Encrypted-Key` 解密出明文 API Key，该值仅存在于本次请求的方法调用栈中，不赋值给任何会被日志记录或持久化的对象，请求结束后随栈帧释放
2. 后端按 `purpose` 与用户 `vipLevel` 在内部查找对应 Prompt 模板，与 `userContent` 组装成完整请求体（Prompt 模板本身不经过网络下发给前端）
3. 通过 `IHttpClientFactory` 取得该 `providerId` 对应的复用连接，将 `LLMProvider.AuthHeader` 模板中的 `{API_KEY}` 替换为解密出的明文 Key，调用 `LLMProvider.BaseUrl`
4. 从大模型响应中提取 `promptTokens` / `completionTokens` 等用量字段，自动写入 `LLMUsageLog`（不含 Key 字段），详见 [模块十一：LLM Token 用量追踪](#模块十一llm-token-用量追踪)
5. 若 `purpose` 属于批改类四种之一：计算 `userContent` 的 SHA-256 作为 `ContentHash`；若无 `gradingSessionId` 则创建新的 `AiGradingSession`（`ExpiresAt` = 创建时间 + 2 小时），若有则校验后追加结果到 `Stages` JSONB 的对应字段，并为新生成的建议分配 `id`
6. 将大模型的业务结果（连同 `gradingSessionId`/`suggestionIds`）转发给前端

**并发限流：** 全局同时处理中的请求数 ≤ 25，超出返回 `429` 或排队等待（按"同时在跑的请求数"限流，而非"时间窗口内次数"限流，原因与配置细节见 [AI 代理接口性能与容量规划](#ai-代理接口性能与容量规划)）。

**预算校验：** 每次代理调用前，后端检查用户本月 Token 消耗是否已超出有效预算上限（见 [11.2 预算预警](#112-获取用量汇总)）。若 `status = exceeded`，直接返回 `429`，`message` 提示"月度 Token 预算已用完，可前往设置调整预算上限或等待下月重置"，不消耗此次调用的大模型配额。

> **与旧架构的区别：** 原架构下前端直连大模型、结果直接用于展示，仅"批改"结果最终会 `POST /api/writings/submits` 存入后端；查词/翻译/思路引导等辅助功能完全不经过后端。新架构下所有 purpose 均经由本接口代理。**⚠️ 安全修复（Breaking Change）：** 批改类结果不再由前端自行回传给 [4.1 正式提交](#41-正式提交文章) 接口——旧版本允许前端直接在提交 Payload 里携带 `aiScore`/`aiEvaluation`/`grammarSuggestions`/`vocabularySuggestions`，这意味着任何持有 Token 的用户都能绕过真实批改、直接伪造一个满分提交，污染个人测评统计和排行榜。新版本下，批改结果只能通过本接口写入服务端权威存储的 `AiGradingSession`，提交时只需带上 `gradingSessionId`，由后端读取消费，前端不再有能力自行报分。详见 [AiGradingSession 批改会话机制](#aigradingsession-批改会话机制说明) 与 [4.1 正式提交](#41-正式提交文章)。

#### AiGradingSession 批改会话机制说明

`structure`/`grammar`/`evaluation`/`vocabulary` 四类 purpose 共享同一套"批改会话"机制，服务于三个目的：

1. **防伪造评分（安全修复）：** 评分与建议只存在于服务端的 `AiGradingSession.Stages` 中，前端只能拿到只读展示内容和一个会话 ID，无法在提交时改写分数。
2. **分阶段批改（进阶功能）：** 用户可以先只调 `structure` 看结构建议，改完文章后再调 `grammar`/`vocabulary`，多次调用共享同一个 `gradingSessionId`，结果累积在同一个 `Stages` 里，不需要每个阶段都重新生成一遍全部结果。
3. **建议互动问答的锚点：** `grammar`/`vocabulary` 生成的每条建议都有稳定 `id`，为后续"针对这一条追问"提供定位依据（见 [模块四之二](#模块四之二ai-建议互动问答-suggestion-chat)）。

会话默认 2 小时后过期（`Status` 变为 `Expired`），过期后不可再追加内容或用于提交，需重新批改。详情见 [数据库实体设计 → AiGradingSession](#aigradingsession批改会话表)。

---

## 模块三：写作草稿管理 (Writings - Drafts)

每个用户最多保留 10 条草稿（可通过 `SystemConfig.draft_max_count` 调整）。超出后创建新草稿将自动删除最旧的草稿。草稿与正式提交共享字数上限（默认 10000 字）。

### 3.1 创建新草稿

- **POST** `/api/writings/drafts`
- **鉴权：** 需要

**Payload:**

```json
{
  "topicId": 1,
  "topic": "The Importance of Environmental Protection",
  "title": "我的作文草稿",
  "content": "<p>这是草稿正文内容...</p>"
}
```

**Response (201):**

```json
{
  "code": 201,
  "message": "草稿已保存",
  "data": {
    "id": "draft-uuid",
    "wordCount": 320,
    "wordLimit": 10000,
    "updatedAt": "2026-07-02T14:30:00Z"
  }
}
```

**Response (400) — 超出字数限制：**

```json
{
  "code": 400,
  "message": "字数超出限制（当前 12500 字，上限 10000 字）",
  "data": {
    "wordCount": 12500,
    "wordLimit": 10000
  }
}
```

> **字数计算：** 去除 HTML 标签后按空格/标点分词统计英文单词数。中文按字符数统计。

---

### 3.2 覆盖更新草稿

- **PUT** `/api/writings/drafts/{id}`
- **鉴权：** 需要

**Payload:**

```json
{
  "title": "更新后的标题",
  "content": "<p>更新后的富文本内容...</p>",
  "expectedUpdatedAt": "2026-07-02T14:30:00Z"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 否 | 更新后的标题 |
| `content` | string | 否 | 更新后的富文本内容 |
| `expectedUpdatedAt` | string (ISO 时间) | 否 | 乐观锁校验字段，传入前端本地持有草稿的 `updatedAt`（见下方"并发冲突检测"）。**为向后兼容，不传该字段时跳过冲突检测，直接覆盖**——建议新版本前端始终携带此字段 |

**并发冲突检测：** 同一草稿可能被多端同时打开编辑（如网页和小程序），原有实现直接覆盖会导致后保存的一方悄悄丢弃另一方的修改，且双方都不会得到任何提示。改为乐观锁：若 Payload 携带 `expectedUpdatedAt`，后端会先比对它与数据库中 `WritingDraft.UpdatedAt` 的当前值：

```
1. 前端 A 拉取草稿，本地记录 updatedAt = T0
2. 前端 B（如另一台设备）也拉取草稿，本地记录 updatedAt = T0
3. 前端 B 先保存 → 传 expectedUpdatedAt = T0，与数据库 T0 一致 → 保存成功，数据库 updatedAt 变为 T1
4. 前端 A 后保存 → 传 expectedUpdatedAt = T0，但数据库当前已是 T1 → 不一致，返回 409
5. 前端 A 收到 409 后，根据 response.data 里的服务端最新内容，提示用户"内容已在其他设备被修改，是否覆盖"
```

**Response (200) — 更新成功：**

```json
{
  "code": 200,
  "message": "草稿已更新",
  "data": {
    "id": "draft-uuid",
    "updatedAt": "2026-07-02T15:00:00Z"
  }
}
```

**Response (409) — 检测到并发冲突：**

```json
{
  "code": 409,
  "message": "内容已被其他设备修改，请确认后再保存",
  "data": {
    "id": "draft-uuid",
    "title": "对方设备保存的最新标题",
    "content": "<p>对方设备保存的最新内容...</p>",
    "updatedAt": "2026-07-02T14:45:00Z"
  }
}
```

> **前端处理建议：** 收到 409 后展示服务端返回的 `data`（最新内容），让用户选择"放弃我的修改，采用最新内容"或"仍然覆盖"（放弃覆盖时不带 `expectedUpdatedAt` 重新提交一次即可强制覆盖）。
>
> **安全策略：** 更新前校验 `Draft.UserId == CurrentUserId`，防止越权修改他人草稿；此校验在乐观锁校验之前执行。

---

### 3.3 获取最新草稿

- **GET** `/api/writings/drafts/latest`
- **鉴权：** 需要

**功能：** 用户登录后自动调用，拉取时间戳最新的一条草稿用于恢复编辑状态。无草稿时 `data` 为 `null`。

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "draft-uuid",
    "topicId": 1,
    "topic": "The Importance of Environmental Protection",
    "title": "我的作文草稿",
    "content": "<p>这是草稿正文内容...</p>",
    "updatedAt": "2026-07-02T14:30:00Z"
  }
}
```

---

### 3.4 获取草稿列表

- **GET** `/api/writings/drafts`
- **鉴权：** 需要

**Query 参数：** 支持标准分页 `?page=1&pageSize=20`

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "draft-uuid",
        "title": "我的作文草稿",
        "updatedAt": "2026-07-02T14:30:00Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 3,
    "totalPages": 1
  }
}
```

---

### 3.5 删除草稿

- **DELETE** `/api/writings/drafts/{id}`
- **鉴权：** 需要

**功能：** 删除废弃草稿，或在草稿"正式提交"后由前端调用清理。

**Response (200):**

```json
{
  "code": 200,
  "message": "草稿已删除",
  "data": null
}
```

> **安全策略：** 删除前校验 `Draft.UserId == CurrentUserId`。

---

## 模块四：正式提交与 AI 批改 (Writings - Submits)

核心业务模块。AI 批改数据不再由前端直接回传，而是由后端从 [数据库实体设计 → AiGradingSession](#aigradingsessionai-批改会话表) 会话中权威读取后写入 `WritingSubmit`，形成不可变的版本快照。

### 4.1 正式提交文章

- **POST** `/api/writings/submits`
- **鉴权：** 需要

> **⚠️ 安全修复（Breaking Change）：** 此前版本 Payload 直接携带 `aiScore`/`aiEvaluation`/`grammarSuggestions`/`vocabularySuggestions`，由前端自行回传评分结果，这意味着任何持有 Token 的用户都能绕过真实批改、直接伪造一个满分提交。现改为传 `gradingSessionId`，由后端从服务端权威存储的 [`AiGradingSession`](#aigradingsessionai-批改会话表) 中取值，前端不再能直接决定评分结果。详见 [2.4 AI 代理调用 → AiGradingSession 批改会话机制说明](#aigradingsession-批改会话机制说明)。

**Payload:**

```json
{
  "topicId": 1,
  "topic": "The Importance of Environmental Protection",
  "title": "我的正式作文",
  "content": "<p>这是我的最终正文</p>",
  "gradingSessionId": "grading-session-uuid",
  "draftId": "draft-uuid"
}
```

| 字段                 | 类型     | 必填 | 说明                                                         |
| ------------------ | ------ | -- | ---------------------------------------------------------- |
| `topicId`          | int    | 是  | 题目 ID                                                       |
| `topic`            | string | 是  | 题目文本快照                                                      |
| `title`            | string | 是  | 文章标题                                                        |
| `content`          | string | 是  | 最终正文（HTML 富文本）                                              |
| `gradingSessionId` | string | 否  | 批改会话 ID（见 [2.4 AI 代理调用](#24-ai-代理调用)）。不传则视为"裸交"，不附带任何 AI 批改数据 |
| `draftId`          | string | 否  | 关联的草稿 ID，提交成功后自动清理对应草稿                                       |

**后端处理逻辑（校验 `gradingSessionId`）：**

```
1. 未传 gradingSessionId → 跳过以下校验，AiScore/AiEvaluation/GrammarSuggestions/
   VocabularySuggestions 全部写入 null，直接进入字数校验
2. 传了 gradingSessionId：
   a. 查询该 AiGradingSession，不存在或 UserId 不是当前用户 → 400
   b. Status != InProgress（已被消费或已过期）→ 400，提示"批改会话已失效，请重新批改"
   c. 计算本次 content 的 SHA-256，与 session.ContentHash 比对：
      不一致 → 400，提示"文章内容与批改时不同，请重新批改"
      （防止批改一篇文章后再提交另一篇文章却复用同一份评分）
   d. 校验通过 → 从 session.Stages 中取出 evaluation/score/grammar/vocabulary 写入
      WritingSubmit 对应字段，session.Status 置为 Consumed，记录 ConsumedAt
      （一次性消费，同一 session 不能用于第二次提交）
3. 字数校验（去 HTML 标签 → 统计字数 → 比对 SystemConfig.writing_word_limit）
```

**Response (201):**

```json
{
  "code": 201,
  "message": "提交成功",
  "data": {
    "id": "submit-uuid",
    "wordCount": 320,
    "wordLimit": 10000,
    "aiScore": 85,
    "submittedAt": "2026-07-02T16:00:00Z"
  }
}
```

| 字段        | 说明                                                       |
| --------- | -------------------------------------------------------- |
| `aiScore` | 若本次提交带了有效 `gradingSessionId`，返回其中的评分供前端立即展示；未批改的裸交则为 `null` |

**Response (400) — 超出字数限制：**

```json
{
  "code": 400,
  "message": "字数超出限制（当前 12500 字，上限 10000 字）",
  "data": {
    "wordCount": 12500,
    "wordLimit": 10000
  }
}
```

**Response (400) — 批改会话失效：**

```json
{
  "code": 400,
  "message": "批改会话已失效，请重新批改",
  "data": null
}
```

**Response (400) — 内容与批改时不一致：**

```json
{
  "code": 400,
  "message": "文章内容与批改时不同，请重新批改",
  "data": null
}
```

> **校验顺序：** 先校验 `gradingSessionId`（若提供）→ 再校验字数上限 → 通过后才执行业务逻辑。提交成功后，系统自动检查用户今日是否已有打卡记录，若无则触发打卡（详见 [模块十](#模块十每日打卡-checkin)）。

---

### 4.2 获取提交记录列表

- **GET** `/api/writings/submits`
- **鉴权：** 需要

**功能：** 分页获取当前用户的提交记录列表，支持关键词搜索和多条件筛选。配合前端主从布局（左侧虚拟列表 / 无限滚动 + 右侧详情面板），搜索和非搜索模式共用同一接口，仅参数不同。

**Query 参数：**

| 参数          | 类型     | 必填  | 说明                           |
| ----------- | ------ | --- | ---------------------------- |
| `keyword`   | string | 否   | 关键词搜索，模糊匹配**标题 + 正文**（去 HTML 标签后）。后端使用 PostgreSQL `ts_vector` + GIN 索引实现全文检索，英文分词 + 前缀匹配 |
| `topicType` | string | 否   | 按题目类型筛选：`CET4` / `CET6` / `IELTS` / `TOEFL` / `考研` |
| `from`      | DateTime | 否 | 提交时间范围的起始（含），ISO 8601 格式 |
| `to`        | DateTime | 否 | 提交时间范围的截止（含） |
| `sortBy`    | string | 否   | `date`（按提交时间，默认）/ `score`（按 AI 评分）/ `words`（按字数） |
| `order`     | string | 否   | `desc`（默认）/ `asc` |
| `page`      | int    | 否   | 页码，默认 1 |
| `pageSize`  | int    | 否   | 每页条数，默认 20，最大 100 |

**筛选优先级与组合：** 所有筛选条件可任意组合，后端按 `keyword（全文检索）→ topicType（等值匹配）→ 时间范围（范围查询）→ 排序 → 分页` 的顺序执行，各条件之间为 AND 关系。

**全文搜索实现：**

```
1. Content 列去 HTML 标签后，与 Title 拼接为 ts_vector 索引源
2. 使用 PostgreSQL GIN 索引加速（english 词典 + simple 词典兜底）
3. 搜索词按空格拆分为多个 token，各 token 之间 AND 匹配
4. 无 keyword 时跳过全文检索，直接走普通 B-tree 索引，性能不受影响
```

> **前端联动说明：** 搜索框每次输入（建议 300ms debounce）→ 带 `keyword` 请求第一页 → 虚拟列表数据源替换 → 滚动条自动回顶。触底加载更多时带同一 `keyword` + 递增 `page`，逻辑与非搜索模式完全一致。搜索结果项结构与正常列表相同（`id`/`title`/`aiScore`/`wordCount`/`submittedAt`），右侧详情面板不感知数据来源差异。

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "submit-uuid",
        "topicType": "CET4",
        "title": "我的正式作文",
        "aiScore": 85,
        "wordCount": 320,
        "submittedAt": "2026-07-02T16:00:00Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 24,
    "totalPages": 2
  }
}
```

---

### 4.3 获取提交记录详情

- **GET** `/api/writings/submits/{id}`
- **鉴权：** 需要

**功能：** 展示某次历史写作及其完整的 AI 批改报告。

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "submit-uuid",
    "topicId": 1,
    "topicType": "CET4",
    "topic": "The Importance of Environmental Protection",
    "title": "我的正式作文",
    "content": "<p>这是我的最终正文</p>",
    "wordCount": 320,
    "aiScore": 85,
    "aiEvaluation": "整体结构清晰，论点明确。",
    "grammarSuggestions": [
      {
        "id": "sugg-uuid-1",
        "original": "he go to school",
        "correction": "he goes to school",
        "reason": "第三人称单数主谓一致"
      }
    ],
    "vocabularySuggestions": [
      {
        "id": "sugg-uuid-3",
        "original": "good",
        "suggestion": "excellent",
        "context": "a good job"
      }
    ],
    "submittedAt": "2026-07-02T16:00:00Z"
  }
}
```

> **安全策略：** 查询前校验 `Submit.UserId == CurrentUserId`。每条建议的 `id` 字段可用于针对该建议发起追问，详见 [模块四之二：AI 建议互动问答](#模块四之二ai-建议互动问答-suggestion-chat)。

---

### 4.4 删除提交记录

- **DELETE** `/api/writings/submits/{id}`
- **鉴权：** 需要

**Response (200):**

```json
{
  "code": 200,
  "message": "记录已删除",
  "data": null
}
```

---

## 模块四之二：AI 建议互动问答 (Suggestion Chat)

针对"批改从单向报告到互动问答"的诉求：用户可以针对 [4.1 正式提交](#41-正式提交文章) 结果中某一条具体的语法/词汇建议（`GrammarSuggestions`/`VocabularySuggestions` 数组里的某个 `id`，见 [数据库实体设计 → WritingSubmit](#writingsubmit正式提交表)）直接发起追问，而不需要重新携带整篇作文。

**核心思路：** 后端组装的追问上下文只包含"该条建议原文 + 关联的原句上下文 + 这条建议此前的追问历史"，不涉及整篇文章正文，请求体积和大模型 Token 消耗都显著小于重新走一次批改流程。对话历史持久化在 [`SuggestionChat`](#suggestionchatai-建议追问对话表) 表中，按 `(SubmitId, SuggestionId)` 定位。

### 发起或继续追问

- **POST** `/api/writings/submits/{submitId}/suggestions/{suggestionId}/chat`
- **鉴权：** 需要

**Path 参数：**

| 参数 | 说明 |
|------|------|
| `submitId` | [4.1 正式提交](#41-正式提交文章) 返回的提交记录 ID |
| `suggestionId` | 该提交 `GrammarSuggestions`/`VocabularySuggestions` 中某一条建议的 `id` |

**Payload：**

```json
{
  "question": "为什么这里要用 goes 而不是 go？"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `question` | string | 是 | 用户针对该条建议的追问内容，最长 500 字符 |

**处理流程：**

```
1. 校验 Submit.UserId == CurrentUserId，且 suggestionId 确实存在于该提交的
   GrammarSuggestions/VocabularySuggestions 中
2. 查找或创建 SuggestionChat(SubmitId, SuggestionId)
3. 组装大模型上下文：该条建议的 original/correction/reason（或
   original/suggestion/context）+ SuggestionChat.Messages 中已有的历史对话
   + 本次用户新问题。不携带 WritingSubmit.Content 整篇正文
4. 复用 2.4 已有的 Provider/Key 解密与调用机制，purpose 记作 `suggestion_followup`
   （见 [2.2 获取系统 Prompt 与模型配置](#22-获取系统-prompt-与模型配置)），
   同样计入 [模块十一：LLM Token 用量追踪](#模块十一llm-token-用量追踪)
5. 将 {"role": "user", "content": question} 和大模型的回答
   {"role": "assistant", "content": "..."} 依次追加进 Messages，更新 UpdatedAt
```

**Response (200)：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "suggestionId": "sugg-uuid-1",
    "answer": "因为主语 he 是第三人称单数，一般现在时动词需要加 -s/-es，所以 go 要变成 goes。",
    "messages": [
      { "role": "user", "content": "为什么这里要用 goes 而不是 go？" },
      { "role": "assistant", "content": "因为主语 he 是第三人称单数..." }
    ]
  }
}
```

**Response (404) — 建议不存在：**

```json
{
  "code": 404,
  "message": "未找到该建议，可能提交记录已被删除或 suggestionId 不正确",
  "data": null
}
```

**限流：** 单用户单条建议每分钟最多 5 次追问，防止滥用大模型调用额度。

---

### 获取追问历史

- **GET** `/api/writings/submits/{submitId}/suggestions/{suggestionId}/chat`
- **鉴权：** 需要

**功能：** 前端在建议列表中展开某一条建议时调用，用气泡形式展示此前的追问记录。若尚无追问记录，`data.messages` 为空数组。

**Response (200)：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "suggestionId": "sugg-uuid-1",
    "messages": [
      { "role": "user", "content": "为什么这里要用 goes 而不是 go？" },
      { "role": "assistant", "content": "因为主语 he 是第三人称单数..." }
    ],
    "updatedAt": "2026-07-02T16:20:00Z"
  }
}
```

> **安全策略：** 查询前校验 `SuggestionChat` 关联的 `Submit.UserId == CurrentUserId`。

---

## 模块五：个人词库 (Vocabulary)

独立管理用户在写作中积累的生词和常犯语法错误。

### 5.1 添加词条

- **POST** `/api/vocabulary`
- **鉴权：** 需要

**Payload:**

```json
{
  "word": "excellent",
  "translation": "优秀的",
  "wrongUsage": "good",
  "contextSentence": "He did an excellent job.",
  "type": "WrongWord"
}
```

| 字段                | 类型     | 必填  | 说明                             |
| ----------------- | ------ | --- | ------------------------------ |
| `word`            | string | 是   | 目标词汇                           |
| `translation`     | string | 是   | 中文释义                           |
| `wrongUsage`      | string | 否   | 曾用错的表达                         |
| `contextSentence` | string | 否   | 上下文例句                          |
| `type`            | enum   | 是   | `NewWord`（生词）/ `WrongWord`（错词） |

**Response (201):**

```json
{
  "code": 201,
  "message": "已添加到词库",
  "data": {
    "id": "vocab-uuid"
  }
}
```

---

### 5.2 获取词库列表

- **GET** `/api/vocabulary`
- **鉴权：** 需要

**Query 参数：**

| 参数         | 类型     | 必填  | 说明                            |
| ---------- | ------ | --- | ----------------------------- |
| `page`     | int    | 否   | 页码                            |
| `pageSize` | int    | 否   | 每页条数                          |
| `type`     | string | 否   | `NewWord` / `WrongWord`，不传则全部 |
| `sortBy`   | string | 否   | `time`（默认）/ `alphabet`（字母顺序）  |

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "vocab-uuid",
        "word": "excellent",
        "translation": "优秀的",
        "wrongUsage": "good",
        "contextSentence": "He did an excellent job.",
        "type": "WrongWord",
        "createdAt": "2026-07-02T16:00:00Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 42,
    "totalPages": 3
  }
}
```

---

### 5.3 删除词条（斩词）

- **DELETE** `/api/vocabulary/{id}`
- **鉴权：** 需要

**功能：** 用户已掌握该词汇，移出词库。

**Response (200):**

```json
{
  "code": 200,
  "message": "词条已删除",
  "data": null
}
```

---

### 5.4 获取今日复习批次

- **GET** `/api/vocabulary/review?limit=20`
- **鉴权：** 需要

**功能：** 把词库从"被动存储"变成"主动学习"——基于遗忘曲线（简化版 SM-2 算法），每天推送一批到期需要复习的词条，而不是让用户自己翻列表。

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `limit` | int | 否 | 本次返回的最大条数，默认 20 |

**处理逻辑：** 查询当前用户 `Vocabulary.NextReviewDate <= 今天` 的词条，按 `NextReviewDate` 升序排列（最早到期的先复习），取前 `limit` 条。新添加、尚未复习过的词条 `NextReviewDate` 默认为添加时间，因此会立即出现在首次的复习批次里。

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "vocab-uuid",
        "word": "excellent",
        "translation": "优秀的",
        "wrongUsage": "good",
        "contextSentence": "He did an excellent job.",
        "type": "WrongWord",
        "repetitions": 2,
        "nextReviewDate": "2026-07-02T00:00:00Z"
      }
    ],
    "totalDue": 8
  }
}
```

| 字段 | 说明 |
|------|------|
| `totalDue` | 当前用户所有到期待复习的词条总数（可能大于本次返回的 `items` 长度），前端可用于展示"还有 N 个待复习"的提示 |

---

### 5.5 提交复习结果

- **POST** `/api/vocabulary/{id}/review`
- **鉴权：** 需要

**功能：** 用户在复习卡片上标记"记得/不记得"后调用，后端据此更新该词条的遗忘曲线参数，重新计算下次复习时间。

**Payload:**

```json
{
  "remembered": true
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `remembered` | bool | 是 | 用户是否记得这个词。简化交互，不要求前端理解 SM-2 的 0-5 质量评分，后端内部把 `true` 映射为质量分 4，`false` 映射为质量分 1 |

**处理逻辑（简化版 SM-2）：**

```
1. quality = remembered ? 4 : 1
2. 若 quality < 3（即 remembered = false）：
   Repetitions 归零，IntervalDays 重置为 1，EaseFactor 不变
3. 若 quality >= 3（即 remembered = true）：
   Repetitions += 1
   IntervalDays = Repetitions == 1 ? 1
                : Repetitions == 2 ? 6
                : round(上次 IntervalDays * EaseFactor)
   EaseFactor = max(1.3, EaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
4. LastReviewedAt = 当前时间
5. NextReviewDate = LastReviewedAt + IntervalDays 天
```

> **算法说明：** 这是 Anki 等应用采用的 SM-2 算法的简化版本——`remembered=false` 会让间隔重新从 1 天开始（惩罚遗忘），`remembered=true` 会让间隔按 `EaseFactor` 指数增长（记得越牢，复习间隔拉得越长），`EaseFactor` 本身也会随着连续记得/遗忘动态调整难度系数。

**Response (200):**

```json
{
  "code": 200,
  "message": "已记录复习结果",
  "data": {
    "id": "vocab-uuid",
    "repetitions": 3,
    "easeFactor": 2.6,
    "intervalDays": 6,
    "nextReviewDate": "2026-07-08T16:00:00Z"
  }
}
```

> **安全策略：** 更新前校验 `Vocabulary.UserId == CurrentUserId`。

---

## 模块六：个人测评统计 (Assessment)

用于用户中心的图表展示和能力进阶分析，后端聚合用户提交记录生成。

### 6.1 获取综合评测数据

- **GET** `/api/assessment/stats`
- **鉴权：** 需要

**Query 参数：**

| 参数       | 类型     | 必填  | 说明                         |
| -------- | ------ | --- | -------------------------- |
| `period` | string | 否   | `all`（默认）、`7d`、`30d`、`90d` |

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "summary": {
      "totalWritings": 24,
      "averageScore": 82.5,
      "highestScore": 93,
      "lowestScore": 65,
      "totalWords": 5600,
      "vocabularyCount": 42,
      "tokenUsage": {
        "totalTokens": 1170000,
        "thisMonth": 245800,
        "totalCalls": 342
      }
    },
    "scoreTrend": [
      { "date": "2026-06-01", "score": 70 },
      { "date": "2026-06-08", "score": 75 },
      { "date": "2026-06-15", "score": 82 },
      { "date": "2026-06-22", "score": 80 },
      { "date": "2026-06-29", "score": 85 }
    ],
    "frequentErrors": [
      { "category": "时态错误", "count": 12 },
      { "category": "主谓一致", "count": 8 },
      { "category": "冠词缺失", "count": 5 }
    ],
    "topicDistribution": [
      { "type": "CET4", "count": 10 },
      { "type": "CET6", "count": 8 },
      { "type": "IELTS", "count": 6 }
    ],
    "scoreDistribution": {
      "0-60": 2,
      "60-70": 5,
      "70-80": 8,
      "80-90": 7,
      "90-100": 2
    }
  }
}
```

---

## 模块七：系统健康检查 (Health)

### 7.1 存活检查

- **GET** `/api/health`
- **鉴权：** 无需

**功能：** Kubernetes / Docker Compose / 负载均衡器用于探活的轻量端点。

**Response (200):**

```json
{
  "status": "healthy",
  "timestamp": "2026-07-02T16:00:00Z"
}
```

### 7.2 就绪检查

- **GET** `/api/health/ready`
- **鉴权：** 无需

**功能：** 深度检查，确认数据库等关键依赖可用。用于控制流量是否打入该实例。

**Response (200):**

```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "disk": "ok"
  },
  "timestamp": "2026-07-02T16:00:00Z"
}
```

**Response (503) — 依赖不可用：**

```json
{
  "status": "unhealthy",
  "checks": {
    "database": "unreachable",
    "disk": "ok"
  },
  "timestamp": "2026-07-02T16:00:00Z"
}
```

> **Docker 集成：** 在 `docker-compose.yml` 中配置 `healthcheck` 指向 `/api/health`，`depends_on` 配合使用 `/api/health/ready`。

---

## 模块八：管理员系统 (Admin)

所有管理员接口路径前缀 `/api/admin/*`，需 JWT 鉴权 + 权限校验双重拦截。无权限的用户访问一律返回 `403`。

### 8.1 管理员权限模型（RBAC）

采用 **RBAC（基于角色的访问控制）** 模型，用户不直接持有权限，而是通过"用户 → 角色 → 权限"的链路间接获得。

```
User ──UserRole──→ Role ──RolePermission──→ Permission
                                          ↓
                                   中间件校验 Permission.Code
```

**为什么不用 Role 字符串比对？**

| 方案 | 加一个新角色 | 加一个细粒度权限 | 临时给某个用户提权 |
|------|------------|----------------|------------------|
| Role 字符串 (`Role == "admin"`) | 改代码 if-else | 做不到 | 做不到 |
| RBAC | 数据库 INSERT 一条 Role + 勾几个 Permission | 建一条 Permission，勾给角色 | 在 UserRole 加一行，用完删掉 |

**后端中间件校验（按权限码）：**

```csharp
// RequirePermissionAttribute.cs
[AttributeUsage(AttributeTargets.Method)]
public class RequirePermissionAttribute : Attribute
{
    public string PermissionCode { get; }
    public RequirePermissionAttribute(string code) => PermissionCode = code;
}

// RequirePermissionFilter.cs
public class RequirePermissionFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var userId = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var requiredCode = context.ActionDescriptor.EndpointMetadata
            .OfType<RequirePermissionAttribute>().FirstOrDefault()?.PermissionCode;
        if (requiredCode == null) { await next(); return; }

        var hasPermission = await db.UserRoles
            .Where(ur => ur.UserId == userId)
            .Join(db.RolePermissions, ur => ur.RoleId, rp => rp.RoleId, (ur, rp) => rp)
            .Join(db.Permissions, rp => rp.PermissionId, p => p.Id, (rp, p) => p.Code)
            .AnyAsync(code => code == requiredCode);

        if (!hasPermission)
        {
            context.Result = new ForbidResult();
            return;
        }
        await next();
    }
}
```

**控制器使用示例：**

```csharp
[RequirePermission("user:ban")]
[HttpPut("users/{id}/ban")]
public async Task<IActionResult> BanUser(Guid id, BanRequest request) { ... }

[RequirePermission("agreement:manage")]
[HttpPost("agreements")]
public async Task<IActionResult> CreateAgreement(CreateAgreementRequest request) { ... }
```

**管理员接口与权限码映射：**

| 接口 | 所需权限码 |
|------|-----------|
| `GET /api/admin/users` | `user:list` |
| `GET /api/admin/users/{id}` | `user:detail` |
| `PUT /api/admin/users/{id}/ban` | `user:ban` |
| `PUT /api/admin/users/{id}/unban` | `user:ban` |
| `PUT /api/admin/users/{id}/vip` | `user:vip` |
| `GET /api/admin/audit-logs` | `audit:view` |
| `POST/PUT/DELETE /api/admin/agreements` | `agreement:manage` |
| `POST/PUT/DELETE /api/admin/providers/*` | `provider:manage` |
| `POST/PUT/DELETE /api/admin/roles/*` | `role:manage` |
| `GET/PUT /api/admin/configs/*` | `config:manage` |
| `POST/PUT/DELETE /api/admin/quotes/*` | `quotes:manage` |
| `POST/PUT/DELETE /api/admin/checkin-tiers/*` | `checkin_tier:manage` |
| `GET /api/admin/token-usage/*` | `token_usage:view` |
| `POST/PUT/DELETE /api/admin/announcements/*` | `announcement:manage` |

**首个管理员账号创建：** 数据库 Seed 脚本执行时自动创建 `super_admin` 角色 + 关联所有权限 + 创建一个管理员用户并分配该角色。

---

### 8.2 获取用户列表

- **GET** `/api/admin/users`
- **鉴权：** 需要 + Admin

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | int | 否 | 页码，默认 1 |
| `pageSize` | int | 否 | 每页条数，默认 20，最大 100 |
| `search` | string | 否 | 按邮箱或昵称模糊搜索 |
| `roleId` | string | 否 | 按角色 ID 筛选（如筛选所有超级管理员） |
| `isBanned` | bool | 否 | 按封禁状态筛选 |
| `vipLevel` | int | 否 | 按 VIP 等级筛选 |
| `sortBy` | string | 否 | `createdAt`（默认）/ `loginAt` / `writingsCount` |
| `order` | string | 否 | `asc` / `desc`（默认） |

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "user-uuid",
        "email": "user@example.com",
        "nickname": "用户xxxx",
        "roles": [
          { "id": "role-uuid", "name": "user" }
        ],
        "isBanned": false,
        "vipLevel": 0,
        "totalWritings": 24,
        "lastLoginAt": "2026-07-02T14:30:00Z",
        "createdAt": "2026-01-15T08:30:00Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 156,
    "totalPages": 8
  }
}
```

---

### 8.3 获取用户详情

- **GET** `/api/admin/users/{id}`
- **鉴权：** 需要 + Admin

**功能：** 查看单个用户的完整档案，包括个人信息、写作统计、AI 评分趋势、登录历史、每日使用时长。

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "profile": {
      "id": "user-uuid",
      "email": "user@example.com",
      "nickname": "用户xxxx",
      "avatar": "https://...",
      "roles": [
        { "id": "role-uuid", "name": "super_admin" }
      ],
      "isBanned": false,
      "banReason": null,
      "bannedAt": null,
      "banExpiry": null,
      "vipLevel": 0,
      "vipExpiry": null,
      "ipAddress": "中国·上海",
      "createdAt": "2026-01-15T08:30:00Z"
    },
    "writingStats": {
      "totalSubmits": 24,
      "averageScore": 82.5,
      "highestScore": 93,
      "lowestScore": 65,
      "totalWords": 5600
    },
    "recentSubmits": [
      {
        "id": "submit-uuid",
        "title": "我的正式作文",
        "topicType": "CET4",
        "aiScore": 85,
        "wordCount": 320,
        "submittedAt": "2026-07-02T16:00:00Z"
      }
    ],
    "loginLogs": [
      {
        "loginAt": "2026-07-02T14:30:00Z",
        "ipAddress": "123.45.67.89",
        "ipLocation": "中国·上海",
        "userAgent": "Chrome/126.0"
      }
    ],
    "dailyUsage": [
      { "date": "2026-07-01", "totalSeconds": 3600, "requestCount": 45 },
      { "date": "2026-07-02", "totalSeconds": 1800, "requestCount": 23 }
    ],
    "scoreTrend": [
      { "date": "2026-06-01", "score": 70 },
      { "date": "2026-06-15", "score": 82 },
      { "date": "2026-07-01", "score": 85 }
    ]
  }
}
```

---

### 8.4 封禁用户

- **PUT** `/api/admin/users/{id}/ban`
- **鉴权：** 需要 + Admin

**Payload:**

```json
{
  "reason": "发布违规内容",
  "duration": 7
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `reason` | string | 是 | 封禁原因 |
| `duration` | int | 否 | 封禁天数。不传或 `null` = 永久封禁 |

**Response (200):**

```json
{
  "code": 200,
  "message": "用户已封禁",
  "data": {
    "userId": "user-uuid",
    "isBanned": true,
    "banReason": "发布违规内容",
    "bannedAt": "2026-07-02T17:00:00Z",
    "banExpiry": "2026-07-09T17:00:00Z"
  }
}
```

> **业务逻辑：** 被封禁用户的 JWT Token 在下次请求时被中间件拦截（校验 `IsBanned == true` → 401），无法使用任何需鉴权的接口。如设定了 `duration`，到期后需管理员手动解封或通过定时任务自动解封。

---

### 8.5 解封用户

- **PUT** `/api/admin/users/{id}/unban`
- **鉴权：** 需要 + Admin

**Payload（可选）：**

```json
{
  "note": "申诉通过，予以解封"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `note` | string | 否 | 解封备注，记入审计日志 |

**Response (200):**

```json
{
  "code": 200,
  "message": "用户已解封",
  "data": {
    "userId": "user-uuid",
    "isBanned": false,
    "banReason": null,
    "bannedAt": null,
    "banExpiry": null
  }
}
```

---

### 8.6 修改用户 VIP 等级

- **PUT** `/api/admin/users/{id}/vip`
- **鉴权：** 需要 + Admin

> **当前状态：** 占位接口，为未来 VIP 功能开发预留。

**Payload:**

```json
{
  "vipLevel": 1,
  "vipExpiry": "2027-07-02T00:00:00Z"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `vipLevel` | int | 是 | `0` = 普通，`1` = VIP |
| `vipExpiry` | DateTime | 否 | 到期时间。`null` = 永久 VIP |

---

### 8.7 管理员操作日志

- **GET** `/api/admin/audit-logs`
- **鉴权：** 需要 + Admin

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | int | 否 | 页码 |
| `pageSize` | int | 否 | 每页条数 |
| `adminId` | string | 否 | 按操作者筛选 |
| `action` | string | 否 | 按操作类型筛选：`ban_user` / `unban_user` / `create_agreement` / `update_agreement` |
| `from` | DateTime | 否 | 起始时间 |
| `to` | DateTime | 否 | 截止时间 |

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "log-uuid",
        "adminUser": {
          "id": "admin-uuid",
          "email": "admin@example.com"
        },
        "action": "ban_user",
        "targetUser": {
          "id": "user-uuid",
          "email": "user@example.com"
        },
        "details": {
          "reason": "发布违规内容",
          "duration": 7,
          "previousBanStatus": false
        },
        "ipAddress": "123.45.67.89",
        "createdAt": "2026-07-02T17:00:00Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 42,
    "totalPages": 3
  }
}
```

> **安全策略：** 审计日志为只读数据，任何接口不得修改或删除。管理员也无法清除自己的操作痕迹。

---

### 8.8 管理大模型 Provider

以下接口用于管理员在线管理前端可选的大模型列表。新增 Provider 后，前端无需更新代码即可支持。

#### 8.8.1 获取 Provider 列表

- **GET** `/api/admin/providers`
- **鉴权：** 需要 + Admin

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "deepseek",
        "name": "DeepSeek",
        "baseUrl": "https://api.deepseek.com/v1",
        "isEnabled": true,
        "sortOrder": 1,
        "modelCount": 1,
        "updatedAt": "2026-07-01T00:00:00Z"
      }
    ],
    "totalCount": 5
  }
}
```

#### 8.8.2 获取 Provider 详情（含模型列表）

- **GET** `/api/admin/providers/{providerId}`
- **鉴权：** 需要 + Admin

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "deepseek",
    "name": "DeepSeek",
    "baseUrl": "https://api.deepseek.com/v1",
    "authHeader": "Authorization: Bearer {API_KEY}",
    "isEnabled": true,
    "sortOrder": 1,
    "models": [
      {
        "id": "deepseek-chat",
        "name": "DeepSeek-V3",
        "isDefault": true,
        "capabilities": ["grammar", "evaluation", "vocabulary"],
        "maxTokens": 4096,
        "requestTemplate": {
          "endpoint": "/chat/completions",
          "method": "POST",
          "headers": { "Content-Type": "application/json" },
          "body": {
            "model": "{MODEL_ID}",
            "messages": [
              { "role": "system", "content": "{SYSTEM_PROMPT}" },
              { "role": "user", "content": "{USER_MESSAGE}" }
            ],
            "temperature": 0.7,
            "max_tokens": "{MAX_TOKENS}"
          }
        },
        "responseMapping": {
          "contentPath": "choices[0].message.content",
          "usagePath": "usage"
        },
        "isEnabled": true
      }
    ]
  }
}
```

#### 8.8.3 创建 / 更新 Provider

- **POST** `/api/admin/providers`
- **鉴权：** 需要 + Admin

**Payload:**

```json
{
  "id": "qwen",
  "name": "通义千问",
  "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "authHeader": "Authorization: Bearer {API_KEY}",
  "sortOrder": 10
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 创建必填 | 唯一标识，提交后不可修改 |
| `name` | string | 是 | 显示名称 |
| `baseUrl` | string | 是 | API 基础 URL |
| `authHeader` | string | 是 | 鉴权头模板，`{API_KEY}` 为占位符 |
| `sortOrder` | int | 否 | 排序权重，默认 99 |

**Response (201):**

```json
{
  "code": 201,
  "message": "Provider 已创建",
  "data": { "id": "qwen", "name": "通义千问" }
}
```

> 同一 `id` 再次调用 POST 即为全量覆盖更新（upsert）。该操作写入 AdminAuditLog。

#### 8.8.4 添加 / 更新模型

- **POST** `/api/admin/providers/{providerId}/models`
- **鉴权：** 需要 + Admin

**Payload:**

```json
{
  "id": "qwen-max",
  "name": "Qwen-Max",
  "isDefault": true,
  "capabilities": ["grammar", "evaluation", "vocabulary"],
  "maxTokens": 4096,
  "requestTemplate": {
    "endpoint": "/chat/completions",
    "method": "POST",
    "headers": { "Content-Type": "application/json" },
    "body": {
      "model": "{MODEL_ID}",
      "messages": [
        { "role": "system", "content": "{SYSTEM_PROMPT}" },
        { "role": "user", "content": "{USER_MESSAGE}" }
      ],
      "temperature": 0.7,
      "max_tokens": "{MAX_TOKENS}"
    }
  },
  "responseMapping": {
    "contentPath": "choices[0].message.content",
    "usagePath": "usage"
  }
}
```

**Response (201):**

```json
{
  "code": 201,
  "message": "模型已添加",
  "data": { "id": "qwen-max", "name": "Qwen-Max" }
}
```

> 同一 `id` 再次调用即为覆盖更新。`isDefault: true` 会自动将该 Provider 下其他模型的 `isDefault` 设为 `false`。该操作写入 AdminAuditLog。

#### 8.8.5 启用 / 禁用 Provider 或模型

- **PUT** `/api/admin/providers/{providerId}/toggle`
- **PUT** `/api/admin/providers/{providerId}/models/{modelId}/toggle`
- **鉴权：** 需要 + Admin

**Payload:**

```json
{ "isEnabled": false }
```

**Response (200):**

```json
{
  "code": 200,
  "message": "状态已更新",
  "data": { "isEnabled": false }
}
```

> 禁用 Provider 后，该 Provider 及其下所有模型在前端 2.2 接口中不再返回。禁用 Model 同理。软开关，不删除数据。

#### 8.8.6 删除 Provider 或模型

- **DELETE** `/api/admin/providers/{providerId}`
- **DELETE** `/api/admin/providers/{providerId}/models/{modelId}`
- **鉴权：** 需要 + Admin

**约束：** Provider 下有启用的模型时不可删除，需先禁用或删除所有模型。该操作写入 AdminAuditLog。

**Response (200):**

```json
{
  "code": 200,
  "message": "已删除",
  "data": null
}
```

#### 8.8.7 预设 Provider 初始化

系统首次部署时通过 Seed 脚本自动写入以下 Provider 配置，管理员可直接使用也可后续手动调整：

| Provider | 默认模型 | 兼容标准 |
|----------|---------|---------|
| DeepSeek | deepseek-chat (V3) | OpenAI 兼容 |
| MiniMax | abab7 | OpenAI 兼容 |
| 小米 MiMo | mi-mo | OpenAI 兼容 |
| 月之暗面 Moonshot | moonshot-v1 | OpenAI 兼容 |
| 阿里通义千问 | qwen-max | OpenAI 兼容 |
| 智谱 GLM | glm-4 | OpenAI 兼容 |
| OpenAI | gpt-4o | OpenAI 兼容 |
| Anthropic Claude | claude-sonnet-4-20250514 | Anthropic 原生协议 |
| Google Gemini | gemini-2.5-flash | Gemini 原生协议 |

> 国内模型（DeepSeek / MiniMax / 豆包 / 通义千问 / GLM）几乎全部兼容 OpenAI 的 `/chat/completions` 协议，配置时只需修改 `baseUrl` 和 `authHeader`。Claude 和 Gemini 的 `RequestTemplate` 和 `ResponseMapping` 由 Seed 脚本预制。

---

### 8.9 管理角色与权限

> 需 `role:manage` 权限。通常仅 `super_admin` 角色拥有此权限。

#### 8.9.1 获取角色列表

- **GET** `/api/admin/roles`
- **鉴权：** 需要 + `role:manage`

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "role-uuid",
        "name": "super_admin",
        "description": "超级管理员",
        "isSystem": true,
        "userCount": 2,
        "permissionCount": 8
      }
    ],
    "totalCount": 3
  }
}
```

#### 8.9.2 获取角色详情（含权限列表）

- **GET** `/api/admin/roles/{roleId}`
- **鉴权：** 需要 + `role:manage`

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "role-uuid",
    "name": "super_admin",
    "description": "超级管理员",
    "isSystem": true,
    "permissions": [
      { "id": "perm-uuid", "code": "user:list", "name": "查看用户列表", "group": "用户管理" },
      { "id": "perm-uuid", "code": "user:ban", "name": "封禁/解封用户", "group": "用户管理" }
    ]
  }
}
```

#### 8.9.3 创建角色

- **POST** `/api/admin/roles`
- **鉴权：** 需要 + `role:manage`

**Payload:**

```json
{
  "name": "content_moderator",
  "description": "内容审核员，可查看用户和数据但不可封禁",
  "permissionIds": ["perm-uuid-1", "perm-uuid-2"]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 角色名，唯一 |
| `description` | string | 否 | 角色说明 |
| `permissionIds` | string[] | 否 | 初始权限 ID 列表 |

**Response (201):**

```json
{
  "code": 201,
  "message": "角色已创建",
  "data": { "id": "role-uuid", "name": "content_moderator" }
}
```

#### 8.9.4 修改角色

- **PUT** `/api/admin/roles/{roleId}`
- **鉴权：** 需要 + `role:manage`

**约束：** `isSystem = true` 的系统内置角色不可修改名称和删除，但可以调整权限。

**Payload（全部可选）：**

```json
{
  "description": "更新后的说明",
  "permissionIds": ["perm-uuid-1", "perm-uuid-3"]
}
```

#### 8.9.5 删除角色

- **DELETE** `/api/admin/roles/{roleId}`
- **鉴权：** 需要 + `role:manage`

**约束：** `isSystem = true` 不可删除。有关联用户的角色需先移除所有用户。

#### 8.9.6 分配用户角色

- **PUT** `/api/admin/users/{userId}/roles`
- **鉴权：** 需要 + `role:manage`

**Payload:**

```json
{
  "roleIds": ["role-uuid-1", "role-uuid-2"]
}
```

> 传入的 `roleIds` 直接覆盖用户现有角色。传空数组 = 移除所有角色 = 降为普通用户。

#### 8.9.7 获取所有权限列表

- **GET** `/api/admin/permissions`
- **鉴权：** 需要 + `role:manage`

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      { "id": "perm-uuid", "code": "user:list", "name": "查看用户列表", "group": "用户管理" },
      { "id": "perm-uuid", "code": "user:detail", "name": "查看用户详情", "group": "用户管理" },
      { "id": "perm-uuid", "code": "user:ban", "name": "封禁/解封用户", "group": "用户管理" },
      { "id": "perm-uuid", "code": "audit:view", "name": "查看操作日志", "group": "审计" },
      { "id": "perm-uuid", "code": "agreement:manage", "name": "管理协议", "group": "协议管理" },
      { "id": "perm-uuid", "code": "provider:manage", "name": "管理大模型", "group": "系统配置" },
      { "id": "perm-uuid", "code": "role:manage", "name": "管理角色权限", "group": "系统配置" },
      { "id": "perm-uuid", "code": "config:manage", "name": "管理系统配置", "group": "系统配置" },
      { "id": "perm-uuid", "code": "quotes:manage", "name": "管理励志语录", "group": "运营管理" },
      { "id": "perm-uuid", "code": "checkin_tier:manage", "name": "管理签到段位", "group": "运营管理" },
      { "id": "perm-uuid", "code": "token_usage:view", "name": "查看 Token 用量统计", "group": "运营管理" },
      { "id": "perm-uuid", "code": "announcement:manage", "name": "管理系统公告", "group": "运营管理" }
    ]
  }
}
```

> 权限由 Seed 脚本创建，管理员不可新增或删除权限码（权限码对应代码中的 `[RequirePermission]` 特性，删除会导致接口无人能访问）。如需新增权限类型，需走代码变更流程。

---

### 8.10 管理系统配置

> 需 `config:manage` 权限。

#### 8.10.1 获取所有配置

- **GET** `/api/admin/configs`
- **鉴权：** 需要 + `config:manage`

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      { "key": "writing_word_limit", "value": "10000", "description": "单次写作字数上限", "updatedAt": "2026-07-01T00:00:00Z" },
      { "key": "draft_max_count", "value": "10", "description": "每用户最大草稿数", "updatedAt": "2026-06-15T00:00:00Z" },
      { "key": "register_enabled", "value": "true", "description": "是否开放注册", "updatedAt": "2026-01-01T00:00:00Z" },
      { "key": "typing_sound_enabled", "value": "true", "description": "键盘打字音效开关", "updatedAt": "2026-01-01T00:00:00Z" },
      { "key": "feature_dictionary_enabled", "value": "true", "description": "选中单词查词", "updatedAt": "2026-01-01T00:00:00Z" },
      { "key": "feature_translation_enabled", "value": "true", "description": "中文句子翻译", "updatedAt": "2026-01-01T00:00:00Z" },
      { "key": "feature_brainstorm_enabled", "value": "true", "description": "思路引导与词汇推荐", "updatedAt": "2026-01-01T00:00:00Z" },
      { "key": "feature_checkin_enabled", "value": "true", "description": "每日打卡功能开关", "updatedAt": "2026-01-01T00:00:00Z" }
    ]
  }
}
```

#### 8.10.2 修改配置

- **PUT** `/api/admin/configs/{key}`
- **鉴权：** 需要 + `config:manage`

**Payload:**

```json
{
  "value": "5000"
}
```

**Response (200):**

```json
{
  "code": 200,
  "message": "配置已更新",
  "data": { "key": "writing_word_limit", "value": "5000" }
}
```

**Response (400) — 值校验失败：**

```json
{
  "code": 400,
  "message": "writing_word_limit 必须在 100 ~ 50000 之间",
  "data": null
}
```

> **校验规则：** `writing_word_limit` 取值范围 100 ~ 50000。`draft_max_count` 取值范围 1 ~ 100。`register_enabled`、`typing_sound_enabled`、`feature_dictionary_enabled`、`feature_translation_enabled`、`feature_brainstorm_enabled`、`feature_checkin_enabled` 仅接受 `"true"` 或 `"false"`。修改后实时刷新内存缓存，无需重启服务。该操作写入 AdminAuditLog。

---

### 8.11 管理励志语录

> 需 `quotes:manage` 权限。

#### 8.11.1 获取语录列表

- **GET** `/api/admin/quotes`
- **鉴权：** 需要 + `quotes:manage`

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `category` | string | 否 | `checked_in` / `not_checked_in`，不传则全部 |
| `isEnabled` | bool | 否 | 按启用状态筛选 |

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "quote-uuid",
        "content": "你今天又进步了一点，坚持就是最好的天赋 ✨",
        "category": "checked_in",
        "isEnabled": true,
        "sortOrder": 1,
        "createdAt": "2026-07-01T00:00:00Z"
      }
    ],
    "totalCount": 8
  }
}
```

#### 8.11.2 新增语录

- **POST** `/api/admin/quotes`
- **鉴权：** 需要 + `quotes:manage`

**Payload:**

```json
{
  "content": "千里之行始于足下，今天的努力会让明天的你感谢自己 🚀",
  "category": "not_checked_in",
  "sortOrder": 10
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `content` | string | 是 | 语录内容，1 ~ 200 字符 |
| `category` | enum | 是 | `checked_in` / `not_checked_in` |
| `sortOrder` | int | 否 | 排序权重，默认 99 |

#### 8.11.3 修改/禁用语录

- **PUT** `/api/admin/quotes/{id}`
- **鉴权：** 需要 + `quotes:manage`

**Payload（全部可选）：**

```json
{
  "content": "修改后的内容",
  "isEnabled": false,
  "sortOrder": 5
}
```

#### 8.11.4 删除语录

- **DELETE** `/api/admin/quotes/{id}`
- **鉴权：** 需要 + `quotes:manage`

---

### 8.12 管理签到段位

> 需 `checkin_tier:manage` 权限。配置用户签到累计天数的段位等级，支持自定义段位名称、天数阈值和图标。

#### 8.12.1 获取段位列表

- **GET** `/api/admin/checkin-tiers`
- **鉴权：** 需要 + `checkin_tier:manage`

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "tier-uuid-1",
        "name": "青铜",
        "minDays": 1,
        "iconUrl": "https://cdn.example.com/tiers/bronze.png",
        "sortOrder": 1,
        "createdAt": "2026-01-01T00:00:00Z",
        "updatedAt": "2026-07-01T00:00:00Z"
      },
      {
        "id": "tier-uuid-2",
        "name": "白银",
        "minDays": 10,
        "iconUrl": "https://cdn.example.com/tiers/silver.png",
        "sortOrder": 2,
        "createdAt": "2026-01-01T00:00:00Z",
        "updatedAt": "2026-07-01T00:00:00Z"
      },
      {
        "id": "tier-uuid-3",
        "name": "黄金",
        "minDays": 50,
        "iconUrl": "https://cdn.example.com/tiers/gold.png",
        "sortOrder": 3,
        "createdAt": "2026-01-01T00:00:00Z",
        "updatedAt": "2026-07-01T00:00:00Z"
      },
      {
        "id": "tier-uuid-4",
        "name": "铂金",
        "minDays": 100,
        "iconUrl": "https://cdn.example.com/tiers/platinum.png",
        "sortOrder": 4,
        "createdAt": "2026-01-01T00:00:00Z",
        "updatedAt": "2026-07-01T00:00:00Z"
      },
      {
        "id": "tier-uuid-5",
        "name": "钻石",
        "minDays": 200,
        "iconUrl": "https://cdn.example.com/tiers/diamond.png",
        "sortOrder": 5,
        "createdAt": "2026-01-01T00:00:00Z",
        "updatedAt": "2026-07-01T00:00:00Z"
      },
      {
        "id": "tier-uuid-6",
        "name": "王者",
        "minDays": 300,
        "iconUrl": "https://cdn.example.com/tiers/king.png",
        "sortOrder": 6,
        "createdAt": "2026-01-01T00:00:00Z",
        "updatedAt": "2026-07-01T00:00:00Z"
      }
    ],
    "totalCount": 6
  }
}
```

#### 8.12.2 新增段位

- **POST** `/api/admin/checkin-tiers`
- **鉴权：** 需要 + `checkin_tier:manage`

**Payload:**

```json
{
  "name": "传奇",
  "minDays": 500,
  "iconUrl": "https://cdn.example.com/tiers/legend.png",
  "sortOrder": 7
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 段位名称，1 ~ 20 字符 |
| `minDays` | int | 是 | 该段位所需的最低累计签到天数，必须 > 0，且不能与已有段位的天数重复 |
| `iconUrl` | string | 否 | 段位图标 URL（需先通过 [1.10 文件上传](#110-文件上传) 获取 URL） |
| `sortOrder` | int | 否 | 排序权重，默认追加到末尾 |

**Response (201):**

```json
{
  "code": 201,
  "message": "段位已创建",
  "data": {
    "id": "tier-uuid-new",
    "name": "传奇",
    "minDays": 500
  }
}
```

**Response (400) — 天数重复：**

```json
{
  "code": 400,
  "message": "段位天数 500 与已有段位'传奇'冲突，请使用不同的天数阈值",
  "data": null
}
```

#### 8.12.3 修改段位

- **PUT** `/api/admin/checkin-tiers/{id}`
- **鉴权：** 需要 + `checkin_tier:manage`

**Payload（全部可选，只传需要修改的字段）：**

```json
{
  "name": "最强王者",
  "minDays": 365,
  "iconUrl": "https://cdn.example.com/tiers/super-king.png",
  "sortOrder": 7
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 段位名称，1 ~ 20 字符 |
| `minDays` | int | 否 | 天数阈值，修改后不得与其他段位重复 |
| `iconUrl` | string | 否 | 段位图标 URL |
| `sortOrder` | int | 否 | 排序权重 |

**Response (200):**

```json
{
  "code": 200,
  "message": "段位已更新",
  "data": {
    "id": "tier-uuid",
    "name": "最强王者",
    "minDays": 365
  }
}
```

> **注意：** 修改段位天数阈值后，前端用户看到的段位会在下次请求 `/api/checkin/status` 时自动刷新。该操作写入 AdminAuditLog。

#### 8.12.4 删除段位

- **DELETE** `/api/admin/checkin-tiers/{id}`
- **鉴权：** 需要 + `checkin_tier:manage`

**约束：** 系统至少保留一个段位（`minDays = 1` 的默认段位不可删除），否则返回 400。该操作写入 AdminAuditLog。

**Response (200):**

```json
{
  "code": 200,
  "message": "段位已删除",
  "data": null
}
```

**Response (400) — 删除最小段位：**

```json
{
  "code": 400,
  "message": "不能删除 minDays=1 的默认段位，系统至少需要一个起始段位",
  "data": null
}
```

#### 8.12.5 调整段位排序

- **PUT** `/api/admin/checkin-tiers/reorder`
- **鉴权：** 需要 + `checkin_tier:manage`

**Payload:**

```json
{
  "tierIds": ["tier-uuid-1", "tier-uuid-3", "tier-uuid-2"]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `tierIds` | string[] | 是 | 按新顺序排列的段位 ID 列表，必须包含全部段位 |

**Response (200):**

```json
{
  "code": 200,
  "message": "排序已更新",
  "data": null
}
```

---

### 8.13 查看 Token 用量统计

> 需 `token_usage:view` 权限。管理员可查看所有用户的 Token 消耗情况，用于运营监控和异常用量排查。系统不设预算/限额，仅做统计展示。

#### 8.13.1 获取全局 Token 用量概览

- **GET** `/api/admin/token-usage/overview`
- **鉴权：** 需要 + `token_usage:view`

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `period` | string | 否 | `today` / `7d` / `30d`（默认）/ `all` |

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalUsers": 156,
    "activeUsersThisMonth": 89,
    "totalTokensThisMonth": 18500000,
    "averageTokensPerUser": 207865,
    "byProvider": [
      { "providerId": "deepseek", "providerName": "DeepSeek", "totalTokens": 12000000, "userCount": 78 },
      { "providerId": "openai", "providerName": "OpenAI", "totalTokens": 6500000, "userCount": 35 }
    ],
    "topConsumers": [
      {
        "userId": "user-uuid",
        "email": "poweruser@example.com",
        "nickname": "学霸小明",
        "totalTokens": 1250000,
        "consumedThisMonth": 890000
      }
    ]
  }
}
```

#### 8.13.2 获取用户 Token 用量详情

- **GET** `/api/admin/token-usage/users/{userId}`
- **鉴权：** 需要 + `token_usage:view`

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "userId": "user-uuid",
    "email": "user@example.com",
    "nickname": "学霸小明",
    "consumedThisMonth": 245800,
    "grandTotal": {
      "promptTokens": 850000,
      "completionTokens": 320000,
      "totalTokens": 1170000
    },
    "byProvider": [
      { "providerId": "deepseek", "totalTokens": 890000, "callCount": 156 }
    ],
    "byPurpose": [
      { "purpose": "evaluation", "totalTokens": 520000, "callCount": 86 }
    ],
    "dailyTrend": [
      { "date": "2026-07-01", "totalTokens": 23400 },
      { "date": "2026-07-02", "totalTokens": 16300 }
    ]
  }
}
```

---

### 8.14 管理系统公告

> 需 `announcement:manage` 权限。超级管理员发布全站公告，用户在客户端首页看到。支持优先级分级和过期自动下架。

#### 8.14.1 获取公告列表

- **GET** `/api/admin/announcements`
- **鉴权：** 需要 + `announcement:manage`

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | int | 否 | 页码，默认 1 |
| `pageSize` | int | 否 | 每页条数，默认 20，最大 100 |
| `isPublished` | bool | 否 | 按发布状态筛选 |
| `priority` | string | 否 | 按优先级筛选：`Normal` / `Important` / `Urgent` |
| `sortBy` | string | 否 | `createdAt`（默认）/ `publishedAt` / `priority` |

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "announce-uuid",
        "title": "系统维护通知",
        "priority": "Important",
        "isPublished": true,
        "publishedAt": "2026-07-02T10:00:00Z",
        "expiresAt": "2026-07-05T00:00:00Z",
        "readCount": 128,
        "createdAt": "2026-07-02T09:00:00Z",
        "updatedAt": "2026-07-02T10:00:00Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 5,
    "totalPages": 1
  }
}
```

#### 8.14.2 获取公告详情

- **GET** `/api/admin/announcements/{id}`
- **鉴权：** 需要 + `announcement:manage`

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "announce-uuid",
    "title": "系统维护通知",
    "content": "## 维护时间\n\n2026年7月5日凌晨 2:00-4:00...",
    "priority": "Important",
    "isPublished": true,
    "publishedAt": "2026-07-02T10:00:00Z",
    "expiresAt": "2026-07-05T00:00:00Z",
    "createdBy": {
      "id": "admin-uuid",
      "email": "admin@example.com"
    },
    "readCount": 128,
    "createdAt": "2026-07-02T09:00:00Z",
    "updatedAt": "2026-07-02T10:00:00Z"
  }
}
```

#### 8.14.3 创建公告

- **POST** `/api/admin/announcements`
- **鉴权：** 需要 + `announcement:manage`

**Payload:**

```json
{
  "title": "系统维护通知",
  "content": "## 维护时间\n\n2026年7月5日凌晨 2:00-4:00 进行服务器升级...",
  "priority": "Important",
  "isPublished": true,
  "expiresAt": "2026-07-05T00:00:00Z"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 公告标题，1 ~ 100 字符 |
| `content` | string | 是 | 公告正文（Markdown），1 ~ 10000 字符 |
| `priority` | enum | 否 | `Normal`（默认）/ `Important` / `Urgent`。前端据此展示不同样式（如 Urgent 红色横幅置顶） |
| `isPublished` | bool | 否 | 是否立即发布，默认 `false`（保存为草稿）。设为 `true` 时自动填入 `publishedAt` |
| `expiresAt` | DateTime | 否 | 过期时间，不传 = 永不过期（需手动下架） |

**Response (201):**

```json
{
  "code": 201,
  "message": "公告已创建",
  "data": {
    "id": "announce-uuid",
    "title": "系统维护通知",
    "isPublished": true,
    "publishedAt": "2026-07-02T10:00:00Z"
  }
}
```

> 该操作写入 AdminAuditLog。

#### 8.14.4 修改公告

- **PUT** `/api/admin/announcements/{id}`
- **鉴权：** 需要 + `announcement:manage`

**Payload（全部可选，只传需要修改的字段）：**

```json
{
  "title": "修改后的标题",
  "content": "修改后的正文...",
  "priority": "Urgent",
  "expiresAt": "2026-07-10T00:00:00Z"
}
```

**约束：** 已过期（`ExpiresAt < Now`）的公告不可修改，需新建。

**Response (200):**

```json
{
  "code": 200,
  "message": "公告已更新",
  "data": {
    "id": "announce-uuid",
    "updatedAt": "2026-07-02T18:00:00Z"
  }
}
```

> 该操作写入 AdminAuditLog。

#### 8.14.5 发布 / 下架公告

- **PUT** `/api/admin/announcements/{id}/publish`
- **鉴权：** 需要 + `announcement:manage`

**Payload:**

```json
{ "isPublished": false }
```

**Response (200):**

```json
{
  "code": 200,
  "message": "公告状态已更新",
  "data": { "isPublished": false }
}
```

> 下架公告不会删除用户的阅读记录，仅停止向用户端展示。该操作写入 AdminAuditLog。

#### 8.14.6 删除公告

- **DELETE** `/api/admin/announcements/{id}`
- **鉴权：** 需要 + `announcement:manage`

**约束：** 已发布且未过期的公告不可删除，需先下架（调用 8.14.5）。该操作写入 AdminAuditLog。

**Response (200):**

```json
{
  "code": 200,
  "message": "公告已删除",
  "data": null
}
```

---

## 模块九：用户协议 (Agreements)

用于管理用户须知（Terms of Service）和隐私协议（Privacy Policy），支持版本管理和用户接受追踪。

### 9.1 获取最新协议

- **GET** `/api/agreements/latest`
- **鉴权：** 无需

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | `TermsOfService`（用户须知）/ `PrivacyPolicy`（隐私协议） |

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "agreement-uuid",
    "type": "TermsOfService",
    "title": "EverydayWriting 用户服务协议",
    "content": "# 用户服务协议\n\n## 一、总则\n...",
    "version": 2,
    "publishedAt": "2026-07-01T00:00:00Z",
    "effectiveAt": "2026-07-08T00:00:00Z"
  }
}
```

**前端使用场景：**
- 注册页底部展示协议链接
- 用户登录后检测是否需要重新接受（比对已接受的版本号与最新版本号）

---

### 9.2 用户接受协议

- **POST** `/api/agreements/{id}/accept`
- **鉴权：** 需要

**功能：** 用户点击"我已阅读并同意"，后端记录接受行为。

**Response (200):**

```json
{
  "code": 200,
  "message": "协议已接受",
  "data": {
    "agreementId": "agreement-uuid",
    "agreementType": "TermsOfService",
    "version": 2,
    "acceptedAt": "2026-07-02T17:00:00Z"
  }
}
```

**业务逻辑：** 同一用户对同一协议版本只记录一次。重复调用不报错，返回已有接受记录。

---

### 9.3 管理员：创建协议

- **POST** `/api/admin/agreements`
- **鉴权：** 需要 + `agreement:manage`

**Payload:**

```json
{
  "type": "TermsOfService",
  "title": "EverydayWriting 用户服务协议",
  "content": "# 用户服务协议\n\n## 一、总则\n\n...",
  "effectiveAt": "2026-07-08T00:00:00Z"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | `TermsOfService` / `PrivacyPolicy` |
| `title` | string | 是 | 协议标题 |
| `content` | string | 是 | 协议正文（Markdown） |
| `effectiveAt` | DateTime | 是 | 生效时间 |

**Response (201):**

```json
{
  "code": 201,
  "message": "协议已发布",
  "data": {
    "id": "agreement-uuid",
    "type": "TermsOfService",
    "version": 3,
    "publishedAt": "2026-07-02T17:00:00Z",
    "effectiveAt": "2026-07-08T00:00:00Z"
  }
}
```

> **自动行为：** 版本号由系统自动递增（同类型协议当前最大版本 + 1）。发布时间 `publishedAt` 自动设为当前时间。该操作同时写入 AdminAuditLog。

---

### 9.4 管理员：修改协议

- **PUT** `/api/admin/agreements/{id}`
- **鉴权：** 需要 + `agreement:manage`

**Payload（全部可选，只传需要修改的字段）：**

```json
{
  "title": "修改后的标题",
  "content": "修改后的正文...",
  "effectiveAt": "2026-07-15T00:00:00Z"
}
```

**Response (200):**

```json
{
  "code": 200,
  "message": "协议已更新",
  "data": {
    "id": "agreement-uuid",
    "version": 3,
    "updatedAt": "2026-07-02T18:00:00Z"
  }
}
```

> **约束：** 只能修改尚未生效的协议。已生效的协议不可修改，需创建新版本替代。该操作同时写入 AdminAuditLog。

---

### 9.5 管理员：协议列表

- **GET** `/api/admin/agreements`
- **鉴权：** 需要 + `agreement:manage`

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | int | 否 | 页码 |
| `pageSize` | int | 否 | 每页条数 |
| `type` | string | 否 | `TermsOfService` / `PrivacyPolicy`，不传则全部 |
| `sortBy` | string | 否 | `version` / `publishedAt`（默认） |

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "agreement-uuid",
        "type": "TermsOfService",
        "title": "EverydayWriting 用户服务协议",
        "version": 3,
        "publishedAt": "2026-07-02T17:00:00Z",
        "effectiveAt": "2026-07-08T00:00:00Z",
        "publishedBy": {
          "id": "admin-uuid",
          "email": "admin@example.com"
        },
        "acceptanceCount": 128
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 5,
    "totalPages": 1
  }
}
```

---

### 9.6 管理员：删除协议

- **DELETE** `/api/admin/agreements/{id}`
- **鉴权：** 需要 + `agreement:manage`

**约束：** 只能删除尚未生效的协议。已有用户接受的已生效协议不可删除（返回 400）。该操作同时写入 AdminAuditLog。

**Response (200):**

```json
{
  "code": 200,
  "message": "协议已删除",
  "data": null
}
```

---

### 9.7 获取协议历史版本

- **GET** `/api/agreements/history`
- **鉴权：** 无需

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | `TermsOfService` / `PrivacyPolicy` |

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "agreement-uuid",
        "title": "EverydayWriting 用户服务协议",
        "version": 3,
        "publishedAt": "2026-07-02T17:00:00Z",
        "effectiveAt": "2026-07-08T00:00:00Z"
      },
      {
        "id": "agreement-uuid-v2",
        "title": "EverydayWriting 用户服务协议",
        "version": 2,
        "publishedAt": "2026-01-01T00:00:00Z",
        "effectiveAt": "2026-01-08T00:00:00Z"
      }
    ],
    "totalCount": 3
  }
}
```

**前端使用场景：** 用户可在设置页面查看历史版本的协议内容，满足监管要求。

---

## 模块十：每日打卡 (Checkin)

用户每天首次提交作文时自动打卡，无需手动操作。打卡数据用于计算连续写作天数、历史打卡日历和激励语录轮播。

### 10.1 获取打卡状态

- **GET** `/api/checkin/status`
- **鉴权：** 需要

**功能：** 返回今日打卡状态、连续打卡天数、累计作文数量、当前段位信息、当月日历摘要以及一条适合当前状态的励志语录。

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "checkedInToday": true,
    "currentStreak": 12,
    "longestStreak": 35,
    "totalCheckIns": 68,
    "totalSubmits": 86,
    "todaySubmitId": "submit-uuid",
    "checkinTier": {
      "id": "tier-uuid-3",
      "name": "黄金",
      "minDays": 50,
      "iconUrl": "https://cdn.example.com/tiers/gold.png",
      "nextTier": {
        "id": "tier-uuid-4",
        "name": "铂金",
        "minDays": 100,
        "iconUrl": "https://cdn.example.com/tiers/platinum.png",
        "daysRemaining": 32
      }
    },
    "quote": {
      "id": "quote-uuid",
      "content": "你今天又进步了一点，坚持就是最好的天赋 ✨",
      "category": "checked_in"
    },
    "monthSummary": {
      "year": 2026,
      "month": 7,
      "checkedDays": [1, 2],
      "totalDays": 2
    }
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `currentStreak` | int | 从今天往回数的连续打卡天数（今天未打卡则为 0） |
| `longestStreak` | int | 历史最长连续天数 |
| `totalCheckIns` | int | 累计打卡天数 |
| `totalSubmits` | int | 累计完成的作文总数（即 `WritingSubmit` 表记录数） |
| `checkinTier` | object | 当前段位信息。如果用户尚未打卡（`totalCheckIns = 0`），该字段为 `null` |
| `checkinTier.id` | string | 段位 ID |
| `checkinTier.name` | string | 段位名称（如"黄金"） |
| `checkinTier.minDays` | int | 该段位所需的最低累计签到天数 |
| `checkinTier.iconUrl` | string | 段位图标 URL，前端展示用 |
| `checkinTier.nextTier` | object\|null | 下一段位信息，已满级（无更高段位）时为 `null` |
| `checkinTier.nextTier.daysRemaining` | int | 距下一段位还需的签到天数 = `nextTier.minDays - totalCheckIns` |
| `quote` | object | 根据 `checkedInToday` 随机选取对应 category 的语录 |
| `monthSummary` | object | 当月已打卡的日期列表，前端渲染日历热力图 |

### 10.2 获取月度打卡日历

- **GET** `/api/checkin/calendar`
- **鉴权：** 需要

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `year` | int | 是 | 年份，如 `2026` |
| `month` | int | 是 | 月份，如 `7` |

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "year": 2026,
    "month": 7,
    "checkedDays": [1, 2, 5, 6, 7, 8],
    "streakStart": 5,
    "streakEnd": 8,
    "totalDays": 6
  }
}
```

---

> **[已废弃] Prompt 传输安全方案：** 本节原用于给"前端直连大模型"架构下经网络下发的 Prompt 模板加密（AES-GCM + Web Worker 解密），防止用户通过 F12 看到 Prompt 原文。新架构（见 [2.4 AI 代理调用](#24-ai-代理调用)）下，Prompt 模板完全在后端内部组装并直接使用，不再经网络下发给前端，因此该加密机制已无适用场景，本节内容整体移除。

---

## 模块十一：LLM Token 用量追踪

新架构下，用户内容经由 [2.4 AI 代理调用](#24-ai-代理调用) 由后端代理转发给大模型，后端本身就能拿到大模型响应中的 `usage` 数据，因此**用量记录已改为后端在代理请求完成时自动写入**，不再依赖前端上报。用户可设置月度 Token 消耗预算上限，超出后 AI 代理调用将被拦截（见 [11.4 获取预算状态](#114-获取预算状态) / [11.5 设置个人预算](#115-设置个人预算)）。

**数据流：**

```
前端 → POST /api/ai/proxy/{purpose}（携带 X-Encrypted-Key，见 2.4）
              ↓ 后端解密出明文 Key，代理转发给大模型
         大模型 API 返回 response（含 usage 数据）
              ↓ 后端提取 usage.prompt_tokens / usage.completion_tokens
         自动写入 LLMUsageLog（不含 Key 字段）
              ↓
         GET /api/llm/usage/summary → 用户查看汇总
```

---

### 11.1 上报 Token 用量（补录用途）

- **POST** `/api/llm/usage/report`
- **鉴权：** 需要

> **说明：** 自动记录已成为主路径（见上方数据流），本接口保留用于异常场景的手动补录（如某次代理调用因大模型侧超时未能正常返回 usage、需要人工修正等），不再是常规调用路径。

**Payload:**

```json
{
  "providerId": "deepseek",
  "modelId": "deepseek-chat",
  "purpose": "evaluation",
  "promptTokens": 1250,
  "completionTokens": 380
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `providerId` | string | 是 | Provider ID（如 `deepseek`、`openai`） |
| `modelId` | string | 是 | 模型 ID（如 `deepseek-chat`、`gpt-4o`） |
| `purpose` | enum | 是 | `evaluation` / `grammar` / `vocabulary` / `dictionary` / `translation` / `brainstorm` |
| `promptTokens` | int | 是 | 输入 Token 数 |
| `completionTokens` | int | 是 | 输出 Token 数 |

**Response (201):**

```json
{
  "code": 201,
  "message": "用量已记录",
  "data": {
    "id": "log-uuid",
    "totalTokens": 1630,
    "recordedAt": "2026-07-02T16:30:00Z"
  }
}
```

> `totalTokens` 由后端自动计算（`promptTokens + completionTokens`）。

---

### 11.2 获取用量汇总

- **GET** `/api/llm/usage/summary`
- **鉴权：** 需要

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `period` | string | 否 | `today` / `7d` / `30d`（默认）/ `all` |

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "consumedThisMonth": 245800,
    "consumedToday": 16300,
    "grandTotal": {
      "promptTokens": 850000,
      "completionTokens": 320000,
      "totalTokens": 1170000
    },
    "byProvider": [
      {
        "providerId": "deepseek",
        "providerName": "DeepSeek",
        "totalTokens": 890000,
        "callCount": 156
      },
      {
        "providerId": "openai",
        "providerName": "OpenAI",
        "totalTokens": 280000,
        "callCount": 34
      }
    ],
    "byPurpose": [
      { "purpose": "evaluation", "totalTokens": 520000, "callCount": 86 },
      { "purpose": "grammar", "totalTokens": 280000, "callCount": 86 },
      { "purpose": "vocabulary", "totalTokens": 180000, "callCount": 86 },
      { "purpose": "dictionary", "totalTokens": 90000, "callCount": 45 },
      { "purpose": "translation", "totalTokens": 60000, "callCount": 20 },
      { "purpose": "brainstorm", "totalTokens": 40000, "callCount": 12 }
    ],
    "budget": {
      "effectiveBudget": 500000,
      "consumedThisMonth": 245800,
      "remaining": 254200,
      "percentage": 49.2,
      "status": "normal"
    },
    "dailyTrend": [
      { "date": "2026-06-28", "totalTokens": 18200 },
      { "date": "2026-06-29", "totalTokens": 21500 },
      { "date": "2026-06-30", "totalTokens": 19800 },
      { "date": "2026-07-01", "totalTokens": 23400 },
      { "date": "2026-07-02", "totalTokens": 16300 }
    ]
  }
}
```

| 字段 | 说明 |
|------|------|
| `consumedThisMonth` | 本月已消耗 Token 数 |
| `consumedToday` | 今日已消耗 Token 数 |
| `grandTotal` | 全部历史累计（不限时间段） |
| `byProvider` | 按 Provider 分组的消耗统计 |
| `byPurpose` | 按调用目的（评分/语法/词汇等）分组的消耗统计 |
| `dailyTrend` | 近 7 天每日消耗趋势（`period=30d` 时返回近 30 天） |
| `budget` | 当前预算状态（见下方"预算预警"说明） |

**预算预警：** `budget` 字段用于前端判断是否需要展示消耗预警。`status` 取值：

| status | 条件 | 建议前端行为 |
|--------|------|------------|
| `unlimited` | 个人预算为 `0` 或全局默认也为 `0`（不限） | 不展示预算相关 UI |
| `normal` | `percentage < 70` | 正常展示，无特别提示 |
| `warning` | `70 ≤ percentage < 90` | 温和提醒（黄色/橙色徽标） |
| `critical` | `percentage ≥ 90` | 强烈警告（红色提示，建议暂停调用 AI 功能） |
| `exceeded` | `percentage ≥ 100` | 已超出预算（[2.4 AI 代理调用](#24-ai-代理调用) 直接返回 429，提示"月度 Token 预算已用完"） |

> **月度定义与优先级：** 按自然月（1 号 ~ 月底）统计，`consumedThisMonth` 对应 `LLMUsageLog.CreatedAt` 落在当月内的 `TotalTokens` 之和。`effectiveBudget` 按以下优先级取：`User.TokenMonthlyBudget`（若不为 null）→ `SystemConfig.token_monthly_budget`。

---

### 11.3 获取用量明细

- **GET** `/api/llm/usage/history`
- **鉴权：** 需要

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | int | 否 | 页码，默认 1 |
| `pageSize` | int | 否 | 每页条数，默认 20，最大 100 |
| `providerId` | string | 否 | 按 Provider 筛选 |
| `purpose` | string | 否 | 按调用目的筛选 |
| `from` | DateTime | 否 | 起始时间 |
| `to` | DateTime | 否 | 截止时间 |

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "log-uuid",
        "providerId": "deepseek",
        "providerName": "DeepSeek",
        "modelId": "deepseek-chat",
        "modelName": "DeepSeek-V3",
        "purpose": "evaluation",
        "promptTokens": 1250,
        "completionTokens": 380,
        "totalTokens": 1630,
        "createdAt": "2026-07-02T16:30:00Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 342,
    "totalPages": 18
  }
}
```

---

### 11.4 获取预算状态

- **GET** `/api/llm/usage/budget`
- **鉴权：** 需要

**功能：** 返回当前用户的有效月度预算上限和本月消耗进度，供前端判断是否需要展示 Token 消耗预警。该接口是 [11.2 获取用量汇总](#112-获取用量汇总) 中 `budget` 字段的独立、轻量版本——不返回用量明细和趋势数据，仅返回预算状态，适合放在顶部导航栏或设置页实时刷新。

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "effectiveBudget": 500000,
    "consumedThisMonth": 245800,
    "remaining": 254200,
    "percentage": 49.2,
    "status": "normal",
    "resetDate": "2026-08-01T00:00:00Z"
  }
}
```

| 字段 | 说明 |
|------|------|
| `effectiveBudget` | 生效的月度预算上限（Token），`0` = 不限。取值优先级见 11.2 的预算预警说明 |
| `consumedThisMonth` | 本月已消耗 Token 数 |
| `remaining` | 本月剩余可用 Token 数（`effectiveBudget - consumedThisMonth`，不限时为 `-1`） |
| `percentage` | 已消耗百分比（`0-100`，不限时为 `0`） |
| `status` | `unlimited` / `normal` / `warning` / `critical` / `exceeded`，阈值定义见 11.2 预算预警表 |
| `resetDate` | 预算重置日期（下月 1 号 00:00） |

---

### 11.5 设置个人预算

- **PUT** `/api/llm/usage/budget`
- **鉴权：** 需要

**功能：** 用户自定义月度 Token 消耗预算上限，覆盖系统全局默认值。设为 `0` 表示不限。

**Payload:**

```json
{
  "monthlyBudget": 500000
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `monthlyBudget` | int | 是 | 月度 Token 预算上限，最小 `0`（`0` = 不限），最大 `10000000`（1000 万） |

**处理逻辑：** 写入 `User.TokenMonthlyBudget`。下个自然月 1 号 00:00 起按新预算计算预警状态。

**Response (200):**

```json
{
  "code": 200,
  "message": "个人预算已更新",
  "data": {
    "monthlyBudget": 500000,
    "isOverridden": true,
    "globalDefault": 500000
  }
}
```

| 字段 | 说明 |
|------|------|
| `isOverridden` | `true` 表示已覆盖全局默认值；`false` 表示与全局一致 |
| `globalDefault` | 当前系统的全局默认预算，供前端展示参考 |

**限流：** 单用户 60s ≤ 3 次。

---

## 模块十二：隐私与个人数据控制 (Privacy)

呼应"数据隐私与个人记忆控制"的诉求：用户对自己在本平台留下的 AI 对话记忆应有随时清理的能力，这对建立用户信任是低成本、高价值的投入。本模块只覆盖用户明确需要的对话记忆按时间段删除能力，不涉及账号注销/级联删除（复杂度和风险显著更高，需单独立项）。数据导出功能不在当前范围内。

### 12.1 删除 AI 对话记忆

- **DELETE** `/api/ai/chat-history`
- **鉴权：** 需要

**功能：** 按时间段删除用户在 [模块四之二：AI 建议互动问答](#模块四之二ai-建议互动问答-suggestion-chat) 中留下的对话记录。仅删除 `SuggestionChat` 中的对话内容，不影响 `WritingSubmit` 本体、评分或建议列表本身。

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `from` | DateTime | 否 | 起始时间（按 `SuggestionChat.CreatedAt` 过滤） |
| `to` | DateTime | 否 | 截止时间 |

不传 `from`/`to` 时删除该用户名下**全部** `SuggestionChat` 记录。

**Response (200):**

```json
{
  "code": 200,
  "message": "已删除 12 条对话记忆",
  "data": {
    "deletedCount": 12
  }
}
```

> **安全策略：** 删除范围严格限定 `SuggestionChat.UserId == CurrentUserId`，且为物理删除（不可恢复），前端应在调用前二次确认。

---

## 模块十三：系统公告 (Announcements)

管理员通过后台发布的公告，用户在客户端首页或登录后看到。支持优先级分级、未读标记和过期自动隐藏。

### 13.1 获取公告列表

- **GET** `/api/announcements`
- **鉴权：** 需要

**功能：** 返回当前用户可见的所有有效公告（已发布 + 未过期的），并附带每条公告的阅读状态，供前端展示红点/未读数提示。

**Response (200):**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "announce-uuid",
        "title": "系统维护通知",
        "content": "## 维护时间\n\n2026年7月5日凌晨 2:00-4:00 进行服务器升级...",
        "priority": "Important",
        "publishedAt": "2026-07-02T10:00:00Z",
        "isRead": false
      },
      {
        "id": "announce-uuid-2",
        "title": "新功能上线：AI 批改分阶段模式",
        "content": "现在你可以先让 AI 分析文章结构，改完后再进行语法检查...",
        "priority": "Normal",
        "publishedAt": "2026-06-28T08:00:00Z",
        "isRead": true
      }
    ],
    "unreadCount": 1,
    "totalCount": 2
  }
}
```

| 字段 | 说明 |
|------|------|
| `isRead` | 当前用户是否已读。后端通过查询 `AnnouncementRead` 表判定 |
| `unreadCount` | 未读公告总数，前端可用于首页红点数字 |
| `items` | 按优先级降序（`Urgent` → `Important` → `Normal`）、同优先级按发布时间降序排列 |

**前端展示建议：**

| 优先级 | 样式 |
|--------|------|
| `Urgent` | 红色横幅，用户关闭前始终展示，不可滑动忽略 |
| `Important` | 橙色横幅，可关闭（关闭 = 标记已读），下次登录不再弹出 |
| `Normal` | 普通信息流卡片，可关闭 |

### 13.2 标记公告已读

- **POST** `/api/announcements/{id}/read`
- **鉴权：** 需要

**功能：** 用户关闭或查看某条公告后调用，记录已读状态。已读的公告不再出现在"未读"计数中。

**Response (200):**

```json
{
  "code": 200,
  "message": "已标记为已读",
  "data": null
}
```

> **幂等性：** 重复调用不报错，直接返回成功。同一公告只记录一次阅读时间。

### 13.3 一键全部已读

- **POST** `/api/announcements/read-all`
- **鉴权：** 需要

**功能：** 一键将所有未读公告标记为已读，适用于用户不想逐条操作时的快捷入口。

**Response (200):**

```json
{
  "code": 200,
  "message": "已标记 3 条公告为已读",
  "data": {
    "markedCount": 3
  }
}
```

---

## 全局安全防御策略

### 全局异常处理中间件

所有未捕获异常由全局 `ExceptionHandler` 中间件统一兜底，避免堆栈跟踪泄露到前端响应。

```csharp
// Program.cs
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var feature = context.Features.Get<IExceptionHandlerFeature>();
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();

        // 记录完整异常 + 关联 ID，用于事后排查
        logger.LogError(feature.Error, "未处理异常 | RequestId: {RequestId}",
            context.Response.Headers["X-Request-Id"]);

        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync(JsonSerializer.Serialize(new
        {
            code = 500,
            message = "服务器内部错误，请稍后重试或联系管理员并提供 Request-Id",
            data = (object)null
        }));
    });
});
```

**关键约束：**
- 生产环境**不暴露异常消息原文**，仅返回统一错误提示
- 日志中**必须记录** `X-Request-Id`，确保用户报错时能精确检索
- EF Core 查询日志仅在 `Development` 环境开启，生产环境不输出 SQL 参数值

---

### 1. 大模型密钥处理策略（不落盘，非零接触）

后端**不落盘存储**用户的 LLM API Key：数据库中没有任何字段用于持久化用户的明文或密文 Key，也不写入日志、不写入磁盘缓存。

但需要如实说明：这**不是"零接触"**架构。新架构下（见 [2.3 提交 API Key](#23-提交-api-key)、[2.4 AI 代理调用](#24-ai-代理调用)）后端在两个环节会接触到 Key：

1. **提交时**：用户提交明文 Key，后端用服务端主密钥加密后立即返回密文，不保留明文副本
2. **代理调用时**：后端从 `X-Encrypted-Key` 解密出明文 Key，用于代理转发本次请求，请求结束后该明文引用随方法调用栈释放

风险边界：若服务器在处理请求期间被入侵，理论上存在攻击者从内存中截获正在使用的明文 Key 的风险。缓解措施：

- 明文 Key 仅在单次请求的方法调用栈内存活，不赋值给任何会被持久化或日志记录的对象
- 全程 HTTPS 传输，杜绝明文网络暴露
- 加密密文只保存在用户浏览器 `localStorage`，服务端主密钥独立保管于环境变量 / Secret Manager，两者分离存放，任一方单独泄露都无法还原出可用的明文 Key

详见 [10. LLM API Key 存储策略](#10-llm-api-key-存储策略) 的技术细节。

### 2. 身份凭证安全（Authentication）

- 密码通过 `BCrypt.Net-Next` 实现强哈希加盐（Salt），拒绝明文入库。
- 启用 `JwtBearer` 中间件，颁发含过期机制的 JWT（建议有效期 7 天）。
- 敏感接口（发送验证码、登录）启用 `RateLimiter` 中间件，限制单 IP 请求频率。
- **会话级撤销：** [`UserSession`](#usersession用户会话表) 表记录每个 Refresh Token 对应的设备会话，[1.9 退出登录](#19-退出登录) 只撤销当前会话，[1.9 附：退出所有设备](#19-附退出所有设备) 与重置密码（1.5）才触发 `User.TokenVersion + 1` 批量失效所有会话。两套机制的校验逻辑详见 [1.6 刷新 Token](#16-刷新-token)。

### 3. 防越权访问（BOLA 防御）

所有包含 `{id}` 的数据修改与查询请求（如 PUT 草稿、GET 详情、DELETE 词条），必须在数据查询时附加：

```csharp
.Where(x => x.UserId == currentUserId)
```

确保资源归属权严格匹配。即使前端被篡改，后端的归属校验是最后防线。

### 4. 输入校验与防护

| 策略           | 说明                                    |
| ------------ | ------------------------------------- |
| **请求体大小限制**  | 防止超大文本负载导致服务器 OOM（建议上限 1MB）           |
| **参数白名单校验**  | 所有枚举参数（`type`、`sortBy`、`order`）仅接受预期值 |
| **HTML 清洗**  | 富文本内容入库前做 XSS 过滤，防止存储型 XSS            |
| **SQL 注入免疫** | 使用 EF Core 参数化查询，杜绝拼接 SQL             |

### 5. 接口限流规则

| 接口                         | 限制策略                         |
| -------------------------- | ---------------------------- |
| `POST /api/auth/send-code` | 单 IP 60s ≤ 1 次；单邮箱 24h ≤ 5 次 |
| `POST /api/auth/login`     | 单 IP 60s ≤ 5 次               |
| `POST /api/auth/register`  | 单 IP 60s ≤ 3 次               |
| `POST /api/ai/key`         | 单用户 60s ≤ 5 次（防暴力提交） |
| `POST /api/ai/proxy/{structure\|grammar\|evaluation\|vocabulary}` | 全局并发数 ≤ 25（并发限流，见下方说明）。批改类四种 purpose 共享同一限流池，每次调用还会写入 `AiGradingSession`，2 小时过期自动清理 |
| `POST /api/ai/proxy/{dictionary\|translation\|brainstorm\|suggestion_followup}` | 全局并发数 ≤ 25（与批改类共享同一限流池）。辅助类 purpose 不写入批改会话，但同样计入 `LLMUsageLog` |
| `POST /api/writings/submits/{submitId}/suggestions/{suggestionId}/chat` | 单用户单条建议 60s ≤ 5 次（防滥用大模型调用额度） |
| `POST /api/vocabulary/{id}/review` | 单用户 60s ≤ 30 次 |
| `DELETE /api/ai/chat-history` | 单用户 60s ≤ 3 次 |
| `GET /api/llm/usage/budget` | 单用户 60s ≤ 30 次（轻量查询，可高频刷新） |
| `PUT /api/llm/usage/budget` | 单用户 60s ≤ 3 次 |
| `POST /api/files/upload` | 单用户 60s ≤ 10 次 |
| `GET/POST/PUT/DELETE /api/admin/*` | 单 IP 60s ≤ 30 次（管理员接口独立限流） |
| 其他鉴权接口                     | 单用户 60s ≤ 120 次（全局阈值）        |

> **`/api/ai/proxy/*` 的限流机制与其余行不同：** 其余接口都是”时间窗口内计数”限流（如”60秒内最多 N 次”），但 AI 代理接口单次请求本身就要占用连接数秒到数十秒，”次数”限流对这种长耗时请求没有意义（同一用户上一个请求没返回，也发不出下一个）。因此 AI 代理类接口改用”并发数”限流：系统维护一个全局计数器，同时处理中的代理请求超过 25 个时，新请求直接返回 `429` 或排队等待，而不是按时间窗口计数。批改类（`structure`/`grammar`/`evaluation`/`vocabulary`）与辅助类（`dictionary`/`translation`/`brainstorm`/`suggestion_followup`）共享同一个并发池。这个 25 的具体依据和配套的性能优化要求见 [AI 代理接口性能与容量规划](#ai-代理接口性能与容量规划)。

#### 限流响应头

触发限流时，响应中自动附带以下标准头，供前端解析并展示剩余等待时间：

| 响应头 | 示例值 | 说明 |
|--------|--------|------|
| `Retry-After` | `42` | 距下次允许请求还需等待的秒数（整数）。前端据此展示倒计时——如”42 秒后可重试” |
| `X-RateLimit-Limit` | `5` | 该时间窗口内的总配额（如单邮箱 24h 最多发 5 次验证码） |
| `X-RateLimit-Remaining` | `0` | 剩余配额（`0` 即已耗尽，下次请求返回 `429`） |
| `X-RateLimit-Reset` | `1751558400` | 配额重置的 Unix 时间戳（秒），前端据此展示”今晚 00:00 重置” |

**前端处理建议：**

```javascript
const response = await fetch('/api/auth/send-code', { method: 'POST', ... });
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After'); // “42”
  const resetAt = response.headers.get('X-RateLimit-Reset'); // Unix timestamp
  showNotification(`操作过于频繁，请 ${retryAfter} 秒后再试`);
  // 或：showNotification(`今日验证码次数已用完，${formatTime(resetAt)} 后重置`);
}
```

AI 代理并发限流的 `429` 响应不带 `Retry-After`（无确定的重试时间点），仅带 `X-RateLimit-Limit: 25` 和 `X-RateLimit-Remaining: 0`，由前端自行决定重试间隔（建议 3-5 秒后退避重试）。

### 6. 生产环境 Checklist

- [ ] 数据库连接字符串通过环境变量 / Secret Manager 注入，不写入源码
- [ ] JWT Secret Key 强度 ≥ 256 bit，通过安全存储注入
- [ ] 启用 HTTPS 强制跳转（`app.UseHttpsRedirection()`）
- [ ] 配置 CORS 白名单，仅允许前端域名（详见 [CORS 跨域配置](#7-cors-跨域配置)）
- [ ] 日志中不记录密码、Token、验证码等敏感信息
- [ ] 开启 EF Core 查询日志仅在 Development 环境
- [ ] 安全响应头已配置（Nginx 或中间件层，详见 [安全响应头配置](#71-安全响应头)）

### 7. CORS 跨域配置

#### 大白话解释

CORS（跨域资源共享）是浏览器的安全机制。当前后端分属不同域名（`everydaywriting.com` 和 `api.kefumiao.top`），浏览器默认会拦截这种"跨域"请求。

打个比方：后端像一栋公寓楼，CORS 白名单就是门禁系统里的业主名单——只有在名单上的前端域名才能进来取数据，陌生网站一律拦下。没有这道防护，用户浏览器里打开的其他恶意网站就能偷偷以用户的身份向后端发请求。

如果没配 CORS，前端一启动，浏览器 F12 控制台就会报：

```
❌ Access to fetch at 'https://api.kefumiao.top/api/...' from origin
   'https://everydaywriting.com' has been blocked by CORS policy
```

所有 API 请求直接挂掉。

#### 代码配置

在 `Program.cs` 中注册 CORS 策略：

```csharp
// 注册 CORS 服务
builder.Services.AddCors(options =>
{
    options.AddPolicy("Production", policy =>
    {
        policy.WithOrigins("https://everydaywriting.com")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ... 中间件顺序（关键：CORS 必须在 UseRouting 之后、UseAuthorization 之前）
app.UseCors("Production");
```

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `WithOrigins` | `https://everydaywriting.com` | 仅允许你自己的前端域名 |
| `AllowAnyHeader` | — | 允许所有请求头（JWT Token 需要 `Authorization` 头） |
| `AllowAnyMethod` | — | 允许 GET / POST / PUT / DELETE 等 REST 操作 |

> **安全提示：** `WithOrigins` 不要写成 `AllowAnyOrigin()`。后者等于门禁全开，任何网站都能调你的 API，等于没配。

### 7.1 安全响应头

Nginx 层或 ASP.NET Core 中间件应配置以下安全头，对全部响应统一注入：

```nginx
# nginx.conf
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

# HSTS：告知浏览器此后只通过 HTTPS 访问（建议 6 个月起步）
add_header Strict-Transport-Security "max-age=15552000; includeSubDomains" always;
```

| Header | 建议值 | 作用 |
|--------|--------|------|
| `X-Content-Type-Options` | `nosniff` | 禁止浏览器 MIME 类型嗅探，防止将恶意脚本伪装成图片执行 |
| `X-Frame-Options` | `DENY` | 禁止任何网站将你的页面嵌入 iframe，防止点击劫持 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | 跨域时不发送完整 URL 路径，仅发域名，保护隐私 |
| `Permissions-Policy` | 空 | 声明本网站不使用摄像头/麦克风/定位等敏感 API |
| `Strict-Transport-Security` (HSTS) | `max-age=15552000` | 强制浏览器 180 天内仅 HTTPS，杜绝 SSL 降级攻击 |

> **注意：** HSTS 开启后不可轻易关闭（用户浏览器已缓存策略）。部署前务必确认 HTTPS 证书长期有效且自动续签。如使用 Cloudflare 等 CDN，部分头可在 CDN 层统一配置。

### 8. 管理员权限安全

#### RBAC 权限校验

所有 `/api/admin/*` 路径的请求经过三层校验：

```csharp
// 第一层：JWT 有效性（中间件自动处理）
// 第二层：封禁检查（BannedUserFilter）
// 第三层：权限码校验（RequirePermissionFilter）
//        → 查 UserRole → RolePermission → Permission.Code
//        → 匹配当前接口要求的权限码（如 "user:ban"）
//        → 任意一个角色拥有该权限即放行
```

注意：校验的是**权限码**（如 `user:ban`），不是角色名。这样即使未来角色拆分或更名，中间件代码也无需改动。

#### 封禁用户中间件

在每个需鉴权的请求中，额外校验当前用户是否被禁：

```csharp
// BannedUserFilter.cs
var user = await db.Users.FindAsync(currentUserId);
if (user.IsBanned && (user.BanExpiry == null || user.BanExpiry > DateTime.UtcNow))
{
    return Unauthorized(new { code = 401, message = $"账号已被封禁，原因：{user.BanReason}" });
}
```

被封禁用户在封禁期内无法调用任何需鉴权的接口。到期后由定时任务或管理员手动解封。

#### 最小权限原则

- 新建角色默认不含任何权限，需管理员手动分配
- 权限码颗粒度到单个操作（封禁和查看是不同权限码）
- 角色管理（`role:manage`）权限仅限 `super_admin`，防止权限扩散

#### 管理员操作审计

所有管理员敏感操作强制写入 `AdminAuditLog` 表，记录：

| 记录内容 | 说明 |
|----------|------|
| 谁操作的 | `AdminUserId` |
| 做了什么 | `Action`（如 `ban_user`） |
| 操作了谁 | `TargetUserId` |
| 改了什麼 | `Details`（JSONB，变更前后的数据快照） |
| 从哪操作的 | `IpAddress` |
| 什么时候 | `CreatedAt` |

审计日志为**不可变数据**——没有任何 API 可以修改或删除。管理员无法清除自己的操作痕迹。

#### 首次登录强制改密

管理员账号通过 Seed 脚本创建后（见 [1.11 管理员初始密码机制](#111-管理员初始密码机制)），`User.MustChangePassword = true`。后端中间件对所有需鉴权的请求检查此标记：若为 `true` 且当前请求不是 `PUT /api/user/profile`（修改密码走此接口），直接返回 `403`，强制前端跳转改密页。改密成功后 `MustChangePassword` 清除为 `false`，中间件恢复正常放行。

#### 会话撤销与全局登出

[1.9 退出登录](#19-退出登录) 采用单设备撤销（`UserSession.IsRevoked = true`），不影响其他设备。[1.9 附：退出所有设备](#19-附退出所有设备) 和 [1.5 重置密码](#15-重置密码) 则触发 `User.TokenVersion + 1` 并批量撤销所有 `UserSession`，使全部设备的登录态失效。两套机制互不替代，详见 [数据库实体设计 → UserSession](#usersession用户会话表)。

### 9. 用户协议合规

#### 强制接受机制

- **新用户注册：** 注册时前端必须展示最新版用户须知和隐私协议，用户点击"同意"后调用 9.2 接口记录，注册才算完成
- **协议更新后：** 用户下次登录时，后端比对用户最近接受的版本号与数据库最新版本号，不一致则在登录响应中返回 `"needAcceptAgreement": true`，前端据此弹窗要求重新接受
- **未接受的后果：** 除 `/api/agreements/*` 和 `/api/auth/*` 外，其余接口拒绝服务，直到用户接受最新协议

#### 协议数据保护

- 协议历史版本不可物理删除——已生效的协议即使有新版本替代，旧版本数据也必须保留（用户可能只接受了旧版本，需要留作合规证据）
- `UserAgreementAcceptance` 记录不可删除——这是用户"知情同意"的法律凭证

### 10. LLM API Key 存储策略

用户的 LLM API Key（如 OpenAI / DeepSeek 等第三方大模型密钥）**严禁落盘持久化**——数据库、日志、磁盘缓存中都不存在这个 Key 的明文或密文副本。但后端会在代理转发大模型请求时临时接触到明文 Key，这是**不落盘、非零接触**的架构，具体机制如下：

| 存储位置 | 方式 | 说明 |
|----------|------|------|
| 用户浏览器 `localStorage` | 存储服务端返回的密文（`encryptedKey`） | 明文 Key 从不落地到浏览器存储，只存加密后的密文 |
| 后端服务器 | ❌ 不持久化 | 仅在单次请求处理期间，于内存中短暂持有解密后的明文，请求结束即释放 |
| 服务端主密钥 | 环境变量 / Secret Manager | 用于加解密用户 Key，与用户密文分离存放，任一方单独泄露都无法还原出可用的明文 Key |

**加密算法：** AES-256-GCM。每次加密（[2.3 提交 API Key](#23-提交-api-key)）都会生成一个新的随机 IV（12 字节），密文格式为 `Base64(iv + ciphertext + authTag)`，IV 不复用，避免相同明文产生相同密文。

**为什么不用 Cookie 传递密文：** 前端 `everydaywriting.com` 与后端 `api.kefumiao.top` 是不同注册域名，后端下发的 Cookie 从浏览器角度属于第三方 Cookie。Safari（ITP）与 Firefox（ETP）默认拦截第三方 Cookie，即使 Chrome 已放弃原定的拦截计划，跨浏览器可靠性也无法保证。改用自定义 Header（`X-Encrypted-Key`）传递密文，规避了这一限制；同时因为自定义 Header 不是浏览器自动携带的凭证，天然不需要额外的 CSRF Token 防护。

**数据流：**

```
用户在前端输入明文 API Key
  → POST /api/ai/key：后端用服务端主密钥加密，返回密文，不保留明文副本
  → 前端将密文存入浏览器 localStorage
  → 每次调用 AI 功能时，前端通过 X-Encrypted-Key Header 带上密文
  → POST /api/ai/proxy/{purpose}：后端解密出明文，代理转发给大模型厂商，请求结束后明文随调用栈释放
  → 大模型响应转发回前端，usage 数据自动写入 LLMUsageLog（不含 Key）
```

详见 [2.3 提交 API Key](#23-提交-api-key)、[2.4 AI 代理调用](#24-ai-代理调用) 的接口定义，以及 [全局安全防御策略 §1](#1-大模型密钥处理策略不落盘非零接触) 的风险边界说明。

### 11. AI 代理接口性能与容量规划

生产服务器为单台 2C2G 云主机，Nginx、ASP.NET Core API、PostgreSQL 三个容器同机部署（见 [生产部署拓扑](#生产部署拓扑)）。普通 CRUD 接口预计可支撑 300-500 并发在线用户；AI 代理接口（[2.4](#24-ai-代理调用)）因单次请求占用连接时间长（几秒到几十秒），是真正的资源瓶颈，全局并发上限设定为 **25**（见 [接口限流规则](#5-接口限流规则)）。这个上限只在以下实现前提成立的情况下才有效：

- **全链路异步：** 代理转发的实现必须 `async/await` 到底，禁止任何环节同步阻塞等待大模型响应（如误用 `.Result`）。同步阻塞会占住线程池线程而不释放，实际能扛的并发会远低于 25，甚至导致线程池饥饿拖慢所有接口。
- **`IHttpClientFactory` 管理连接：** 对大模型厂商的调用必须通过 `IHttpClientFactory` 取得复用的 HttpClient，禁止每次请求 `new HttpClient()`。后者会导致 TCP 连接无法复用，高并发下容易耗尽可用 socket，且重复 TLS 握手会显著拖慢响应。
- **熔断器（Circuit Breaker）：** 必须为每个大模型 Provider 的 `HttpClient` 配置 Polly `CircuitBreakerPolicy`。当某个 Provider（如 DeepSeek）连续失败或超时达到阈值（建议连续 5 次），熔断器打开，后续请求直接返回 `503` 快速失败，不等待超时。熔断状态下定期试探（建议 30 秒后发一个探测请求），若恢复则关闭熔断，恢复正常转发。**不做熔断的后果：** 一个 Provider 宕机，所有使用该 Provider 的请求都会卡到超时（30-60 秒），25 个并发槽位被瞬间占满，进而拖垮整个 AI 代理功能——即使其他 Provider 正常也无请求槽位可用。
- **并发数限流：** 用 ASP.NET Core Rate Limiter 的 Concurrency Limiter 策略（或 `SemaphoreSlim`）维护全局计数器，超出 25 个同时处理中的请求时排队或返回 `429`，防止突发流量直接把内存打爆。
- **PostgreSQL 连接与内存调优：** 因与 API 同机部署，建议 `max_connections` 设置在 20 左右、`shared_buffers` 128-192MB，避免默认配置占用过多本就紧张的内存。
- **Docker 内存边界：** 给 API 和数据库容器分别设置 `mem_limit`，防止一方（尤其是 AI 代理突发流量）把另一方挤爆导致被系统 OOM Killer 杀掉——数据库被杀的影响面远大于单纯的 API 变慢。
- **GC 模式：** 容器内 .NET 建议设置环境变量 `DOTNET_gcServer=0`（Workstation GC）。Server GC 为吞吐量会预留更多内存，在 2GB 环境下是负担，Workstation GC 内存占用更平滑。
- **swap 安全网：** 配置一块 swap 或 zram，作为瞬时内存尖峰的缓冲，防止突发请求直接触发 OOM Killer 杀进程。不能指望它扛住持续高负载，但能为运维反应留出时间。

后续如果并发需求超过这个量级，优先考虑把 PostgreSQL 迁移到独立实例（同机部署下数据库本身就占用 200-400MB，迁走后 API 可用内存会明显增加），或整体升级到 4C4G，而不是继续压缩现有三个服务的内存分配。

### 12. 批改会话防伪造与防重放

[2.4 AI 代理调用](#24-ai-代理调用) 和 [4.1 正式提交](#41-正式提交文章) 通过 [`AiGradingSession`](#aigradingsession批改会话表) 机制共同构成评分防伪造链路，替代旧版"前端自行报分"的不安全模式。以下从安全视角归纳关键约束：

| 安全约束 | 实现方式 |
|----------|----------|
| **评分权威性** | `AiScore`/`AiEvaluation`/`GrammarSuggestions`/`VocabularySuggestions` 只能由后端从 `AiGradingSession.Stages` 读取写入 `WritingSubmit`，前端在 4.1 Payload 中已无法携带这些字段 |
| **内容一致性** | `AiGradingSession.ContentHash`（批改时计算的 SHA-256）与 4.1 提交时重新计算的 `content` 哈希比对，不一致则拒绝——防止"批改一篇高分文章、偷偷提交另一篇却顶用同一份评分" |
| **归属校验** | 4.1 校验 `session.UserId == CurrentUserId`，防止 A 用户拿 B 用户的 `gradingSessionId` 蹭分 |
| **一次性消费** | 会话被 4.1 成功消费后 `Status` 立即变为 `Consumed`，同一 session 不能被第二次提交复用——防止"一份高分批改结果被反复利用刷多条提交记录" |
| **时效性** | 会话 `ExpiresAt = CreatedAt + 2 小时`，过期后追加调用（2.4）和提交（4.1）均拒绝，需重新批改——防止长期囤积批改结果后批量刷分 |
| **前向安全** | 旧版 4.1 Payload 中的 `aiScore`/`aiEvaluation`/`grammarSuggestions`/`vocabularySuggestions` 字段已移除（Breaking Change），不接受携带这些字段的请求，旧版客户端必须升级 |

> **设计权衡：** 这套机制要求用户必须在 2 小时内完成"批改 → 提交"流程，超时需重新批改。这是安全性与便利性的折中——2 小时足以覆盖正常写作-批改-修改-提交流程，同时防止批改结果被长期囤积后滥用。
