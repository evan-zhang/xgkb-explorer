# 用户设置云同步 API 实现规格

日期：2026-06-29

后端/API 负责人：待定

前端接入方：xgkb-explorer

## 1. 背景

xgkb-explorer 目前把用户相关的应用数据保存在浏览器 `localStorage` 中。这样可以不依赖自建后端，但同一个用户换浏览器、换设备，或者清除浏览器数据后，已添加的书架项目和收藏会消失。

当前浏览器本地存储 key：

- `xgkb_explorer_config`
  - `apiMode`
  - `serverUrl`
  - `appKey`
  - `previewMode`
  - `spaces`
  - `activeSpaceId`
- `xgkb:starred_projects`
- 登录态相关 key：
  - `xgkb_auth_session`
  - `xg_token`
  - `corp_id`
  - `user`

期望行为：用户通过钉钉/Cwork 登录后，在任意浏览器打开应用，都能看到同一份书架配置、当前书架选择、预览偏好和收藏项目。

## 2. 目标

提供一个轻量的服务端 settings 服务，按登录用户身份保存应用偏好。

前端仍保留 `localStorage`，作为快速加载缓存和离线兜底；用户登录后，以服务端 settings 记录作为跨浏览器的权威数据。

## 3. 非目标

settings API 第一版不做以下事情：

- 不保存 `xgToken`、登录 session、refresh token 或任何长期凭据。
- 不保存真实 Open API `appKey`，除非后续单独完成安全设计并明确批准。
- 不代理、不重写玄关知识库文件 API。
- 不额外校验知识库目录权限。目录/文件可见性仍由现有玄关知识库 API 负责。
- 不移除前端 `localStorage`。本地缓存仍然保留。

## 4. 同步数据范围

第一版只同步非敏感、用户级 UI 状态：

```ts
export type PreviewMode = 'self' | 'kb';

export interface SpaceEntry {
  id: string;
  name: string;
  directoryId: string;
}

export interface UserSettingsV1 {
  version: 1;
  spaces: SpaceEntry[];
  activeSpaceId: string;
  previewMode: PreviewMode;
  starredProjectIds: string[];
}
```

字段说明：

- `version`：settings schema 版本。当前必须为 `1`。
- `spaces`：用户配置的书架入口列表。每个入口指向一个知识库目录。
- `spaces[].id`：前端稳定使用的入口 id，通常是 `directory-${directoryId}`。
- `spaces[].name`：展示名称。允许为空字符串，表示前端可以后续通过目录元数据解析名称。
- `spaces[].directoryId`：知识库目录 id。空字符串只应兼容历史配置，含义是当前用户可见空间根入口。
- `activeSpaceId`：当前选中的书架入口 id。空字符串表示暂无当前入口。
- `previewMode`：用户选择的文件预览方式。
- `starredProjectIds`：用户在书架 UI 中收藏的项目/文件 id。

第一版不建议同步：

- `apiMode`
- `serverUrl`
- `appKey`
- 登录 session 数据
- token 数据

原因：`apiMode`、`serverUrl`、`appKey` 涉及 API 访问和环境差异，先保留在浏览器本地。`appKey` 也可能属于敏感配置，不应默认云同步。

## 5. 鉴权与用户身份

### 5.1 请求鉴权方式

前端会在钉钉/Cwork 登录成功后调用 settings API，并携带当前 `xgToken`。

推荐请求头：

```http
Authorization: Bearer <xgToken>
```

为了兼容现有知识库请求方式，后端也可以接受：

```http
access-token: <xgToken>
```

如果两个请求头同时存在，以 `Authorization` 为准。

### 5.2 用户身份推导

后端必须从 token 推导用户身份，不应信任请求 body 中传来的 user id。

后端需要得到稳定身份：

```ts
interface AuthenticatedUser {
  corpId: string;
  userId: string;
  userName?: string;
}
```

settings 归属 key 建议使用：

```text
${corpId}:${userId}
```

注意：

- `corpId` 必须进入 key。同一个用户 id 在不同企业下不能互相覆盖。
- 浏览器提交的 `corpId` 或 `userId` 只能作为调试信息，不能作为生产鉴权依据。
- 不要记录原始 token 到日志。

如果开发阶段暂时没有可用的 Cwork token 校验/当前用户接口，可以提供一个默认关闭的开发模式，接受：

```http
X-XGKB-Corp-Id: <corpId>
X-XGKB-User-Id: <userId>
```

该模式严禁在生产环境开启。

## 6. API 基础路径

生产前端访问地址：

```text
https://tpr.20100706.xyz/xgkb/
```

settings API 建议通过同源路径暴露：

```text
https://tpr.20100706.xyz/xgkb-settings-api/
```

版本化 API 路径：

```text
/xgkb-settings-api/v1
```

服务端本地监听端口可自行决定，建议：

```text
127.0.0.1:8787
```

Caddy 需要把 `/xgkb-settings-api/*` 反向代理到本机 settings 服务。该配置不能替换现有静态部署路径，也不能影响现有 `/xgkb-api/` 知识库代理。

## 7. 接口定义

### 7.1 健康检查

```http
GET /xgkb-settings-api/health
```

响应：

```json
{
  "ok": true,
  "service": "xgkb-settings-api",
  "time": "2026-06-29T05:30:00.000Z"
}
```

该接口不需要用户鉴权。

### 7.2 获取当前用户 settings

```http
GET /xgkb-settings-api/v1/settings
Authorization: Bearer <xgToken>
```

已有 settings 时返回：

```json
{
  "exists": true,
  "settings": {
    "version": 1,
    "spaces": [
      {
        "id": "directory-abc123",
        "name": "研发知识库",
        "directoryId": "abc123"
      }
    ],
    "activeSpaceId": "directory-abc123",
    "previewMode": "self",
    "starredProjectIds": ["10001", "10002"]
  },
  "revision": "2026-06-29T05:30:00.000Z",
  "createdAt": "2026-06-28T08:00:00.000Z",
  "updatedAt": "2026-06-29T05:30:00.000Z"
}
```

当前用户还没有 settings 时返回：

```json
{
  "exists": false,
  "settings": null,
  "revision": null,
  "createdAt": null,
  "updatedAt": null
}
```

缺少 settings 是正常的首次登录场景，不要返回 `404`。

### 7.3 替换当前用户 settings

第一版使用整份记录替换，不做 PATCH。前端会在本地变更后发送完整 settings 对象。

```http
PUT /xgkb-settings-api/v1/settings
Authorization: Bearer <xgToken>
Content-Type: application/json
```

请求：

```json
{
  "settings": {
    "version": 1,
    "spaces": [
      {
        "id": "directory-abc123",
        "name": "研发知识库",
        "directoryId": "abc123"
      }
    ],
    "activeSpaceId": "directory-abc123",
    "previewMode": "self",
    "starredProjectIds": ["10001", "10002"]
  },
  "baseRevision": "2026-06-29T05:30:00.000Z"
}
```

`baseRevision` 规则：

- 前端从未加载过服务端 settings 时，可以传 `null`。
- `baseRevision` 等于服务端当前 `revision` 时，正常保存。
- `baseRevision` 为 `null` 且服务端还没有记录时，正常创建。
- `baseRevision` 为 `null` 但服务端已经有记录时，后端可以保存，也可以返回 `409`。为了避免覆盖其他浏览器的数据，推荐返回 `409`。
- `baseRevision` 和服务端当前 `revision` 不一致时，返回 `409 Conflict`。

成功响应：

```json
{
  "exists": true,
  "settings": {
    "version": 1,
    "spaces": [
      {
        "id": "directory-abc123",
        "name": "研发知识库",
        "directoryId": "abc123"
      }
    ],
    "activeSpaceId": "directory-abc123",
    "previewMode": "self",
    "starredProjectIds": ["10001", "10002"]
  },
  "revision": "2026-06-29T06:00:00.000Z",
  "createdAt": "2026-06-28T08:00:00.000Z",
  "updatedAt": "2026-06-29T06:00:00.000Z"
}
```

## 8. 数据校验规则

后端保存前必须校验请求体。

必需规则：

- 请求体必须是 JSON。
- `settings.version` 必须等于 `1`。
- `settings.spaces` 必须是数组。
- `settings.activeSpaceId` 必须是字符串。
- `settings.previewMode` 必须是 `"self"` 或 `"kb"`。
- `settings.starredProjectIds` 必须是字符串数组。
- `spaces[].id`、`spaces[].name`、`spaces[].directoryId` 必须是字符串。
- `spaces[].id` 不允许重复。
- `starredProjectIds` 应在保存前去重。
- `activeSpaceId` 必须为空字符串，或匹配某个 `spaces[].id`。

建议限制：

- 最大请求体：64 KB。
- `spaces` 最大数量：200。
- `starredProjectIds` 最大数量：2,000。
- 字符串最大长度：
  - `SpaceEntry.id`：200 字符。
  - `SpaceEntry.name`：200 字符。
  - `SpaceEntry.directoryId`：200 字符。
  - `starredProjectIds[]`：200 字符。

后端不需要验证每个 `directoryId` 或收藏 id 是否仍然存在于知识库。资源不存在或权限变化由前端和知识库 API 处理。

## 9. 错误响应格式

所有错误响应建议统一为：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "settings.previewMode must be self or kb",
    "details": {
      "field": "settings.previewMode"
    }
  }
}
```

推荐 HTTP 状态码：

| 状态码 | code | 含义 |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | JSON 无效或请求包结构错误。 |
| 401 | `UNAUTHORIZED` | 缺少 token 或 token 无效。 |
| 403 | `FORBIDDEN` | token 有效，但无权访问本应用。 |
| 409 | `SETTINGS_CONFLICT` | `baseRevision` 与服务端当前版本不一致。 |
| 413 | `PAYLOAD_TOO_LARGE` | 请求体超过限制。 |
| 422 | `VALIDATION_ERROR` | settings schema 校验失败。 |
| 500 | `INTERNAL_ERROR` | 服务端或存储异常。 |
| 503 | `UPSTREAM_AUTH_UNAVAILABLE` | Cwork token 校验服务不可用。 |

冲突响应建议带上当前服务端记录，方便前端决定刷新或合并：

```json
{
  "error": {
    "code": "SETTINGS_CONFLICT",
    "message": "Settings were updated by another browser.",
    "details": {
      "current": {
        "exists": true,
        "settings": {
          "version": 1,
          "spaces": [],
          "activeSpaceId": "",
          "previewMode": "self",
          "starredProjectIds": []
        },
        "revision": "2026-06-29T06:10:00.000Z",
        "updatedAt": "2026-06-29T06:10:00.000Z"
      }
    }
  }
}
```

## 10. 存储设计

第一版使用 SQLite 即可。

推荐表结构：

```sql
CREATE TABLE IF NOT EXISTS user_settings (
  user_key TEXT PRIMARY KEY,
  corp_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  settings_json TEXT NOT NULL,
  revision TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_settings_corp_user
  ON user_settings (corp_id, user_id);
```

实现说明：

- `settings_json` 保存校验和去重后的规范 JSON。
- `created_at`、`updated_at`、`revision` 使用 UTC ISO 时间字符串。
- `revision` 可以直接用高精度 `updated_at`，也可以使用 UUID/ULID。
- SQLite 文件需要纳入 VPS 状态数据备份。

如果后端更倾向 PostgreSQL/MySQL，也可以使用关系数据库，但外部 API 契约不要变化。

## 11. 安全要求

必需要求：

- 生产环境必须使用 HTTPS。
- 生产访问走同源 `/xgkb-settings-api/`。
- 不记录原始 `Authorization`、`access-token`、`xgToken` 或完整请求头。
- 不把 token 存入 settings 数据库。
- 第一版不存储 `appKey`。
- 每次鉴权接口请求都要校验 token，或者使用短 TTL 的服务端 token 校验缓存。
- 如使用校验缓存，TTL 建议不超过 5 分钟。

推荐要求：

- 日志记录 request id、用户 key hash、路由、状态码、耗时和错误 code。
- 默认不记录完整 `settings_json`。
- 在 JSON 解析前启用请求体大小限制。

## 12. CORS 与反向代理

生产环境应同源访问，因此正常不需要 CORS。

如果本地开发需要跨域，只允许明确的开发源：

```text
http://127.0.0.1:5173
http://localhost:5173
```

生产环境不要使用 wildcard CORS，也不要对带 token 的请求开放任意来源。

## 13. 前端接入假设

书架 **必须先登录**。对接分 **两期**（详见 **§23**）：

| 期次 | 范围 | xgkb-explorer 当前 |
|------|------|-------------------|
| **一期** | 个人书架云同步 | **本期必做** |
| **二期** | 企业推荐书架 + 双栏 merge | **暂不接入** |

### 13.1 一期：个人书架（本期）

登录成功后：

1. 调用 `GET /v1/settings`（**不要**依赖 `corp-bookshelves`）。
2. 用返回的 `settings` 渲染：书架下拉、`activeSpaceId`、`previewMode`、置顶收藏。
3. 可选：成功响应写入本地缓存（带 `revision`）做首屏加速；**权威数据以服务端为准**。
4. 若 `exists: false` 且本机 `xgkb_explorer_config` / `xgkb:starred_projects` 有历史数据，提示用户确认后 `PUT` 迁入（一次性）。
5. 日常变更：优先局部 API（§21）；全量 `PUT` 可用于迁移或批量替换。
6. 同步失败：保留 UI 并提示重试；`409` 时采用 `details.current` 刷新。

**不入云**（继续仅存 localStorage）：`apiMode`、`serverUrl`、`appKey`。

### 13.2 二期：企业书架（后续，本期可跳过）

待 xgkb-explorer 需要「企业推荐区」时再接入：

1. 登录后并行 `GET /v1/settings` + `GET /v1/corp-bookshelves?appCode=`。
2. UI 分栏：企业区 / 个人区 merge 展示（收藏仍仅来自个人 `settings`）。

本期 **不调用** `corp-bookshelves`、不实现双栏 merge **不影响**个人书架上线。

## 14. 请求示例

获取 settings：

```bash
curl -H "Authorization: Bearer $XG_TOKEN" \
  https://tpr.20100706.xyz/xgkb-settings-api/v1/settings
```

创建或替换 settings：

```bash
curl -X PUT \
  -H "Authorization: Bearer $XG_TOKEN" \
  -H "Content-Type: application/json" \
  https://tpr.20100706.xyz/xgkb-settings-api/v1/settings \
  -d '{
    "settings": {
      "version": 1,
      "spaces": [
        {
          "id": "directory-abc123",
          "name": "研发知识库",
          "directoryId": "abc123"
        }
      ],
      "activeSpaceId": "directory-abc123",
      "previewMode": "self",
      "starredProjectIds": ["10001"]
    },
    "baseRevision": null
  }'
```

## 15. 建议环境变量

后端服务建议支持：

```text
PORT=8787
HOST=127.0.0.1
DATABASE_URL=file:/var/lib/xgkb-settings/settings.sqlite
CWORK_API_BASE_URL=https://cwork-web.mediportal.com.cn
CWORK_APP_CODE=<与前端登录使用的 app code 一致>
ALLOW_INSECURE_IDENTITY=false
LOG_LEVEL=info
```

不要提交生产密钥、token 或其他敏感配置。

## 16. 验收标准

API 满足以下条件后，即可进入前端接入：

1. `GET /health` 无需鉴权，返回 `ok: true`。
2. 不带 token 调用 `GET /v1/settings` 返回 `401`。
3. 带有效 token 调用 `GET /v1/settings`，返回已有记录或 `exists: false`。
4. `PUT /v1/settings` 能为当前登录用户创建 settings 记录。
5. 同一个登录用户在另一个浏览器能读取到同一份记录。
6. 不同用户或不同企业不能互相读取 settings。
7. 无效 `previewMode`、重复 `spaces[].id`、无效 `activeSpaceId` 会被拒绝。
8. 超大请求体会被拒绝，不会占满内存。
9. 应用日志中没有原始 token。
10. `baseRevision` 过期时能返回 `409` 冲突。

## 17. 后端交付物

API 完成后，请提供：

- 本地/测试/生产环境的 base URL。
- API 是否只接受 `Authorization: Bearer`，还是也接受 `access-token`。
- 实际使用的 token 校验/当前用户识别方式。
- 数据库文件位置和备份方案。
- 部署后真实的 `GET` 和 `PUT` 成功响应示例。
- 与本文档不一致的地方，尤其是错误码、冲突处理和鉴权细节。

## 18. 待确认问题

生产前需要确认：

- settings 服务应该使用哪个 Cwork 接口校验 `xgToken` 并推导 `corpId/userId`？
- VPS 上 settings 数据是否需要每日备份？
- 是否需要管理员/调试接口按用户 key 查看 settings？如果需要，必须单独保护，且不能进入公开前端契约。

---

## 19. docdb document-database 实现说明（2026-06-30）

本仓库 **document-database** 服务已实现 XGKB 双层书架 Phase 1，与上文独立 `xgkb-settings-api` 服务规格的关系如下。

### 19.1 Base URL 与路径

| 环境 | 路径前缀 |
|------|----------|
| 经 Cwork 网关 | `/document-database/xgkb/...` |

| 方法 | 路径 |
|------|------|
| GET | `/document-database/xgkb/health` |
| GET/PUT | `/document-database/xgkb/v1/settings` |
| GET | `/document-database/xgkb/v1/corp-bookshelves?appCode=` |

个人 `GET/PUT /v1/settings` 响应/请求体与 §7 **一致**（不含企业书架字段）。

### 19.2 鉴权

- 走 Cwork 网关：请求头 `access-token`（与知识库其它接口相同）。
- 网关解析后注入 `corpId`、`employeeId`；**不在本服务内二次校验 xgToken**。
- 亦兼容网关对 `Authorization: Bearer` 的处理（由网关消费，本服务只读 header）。

### 19.3 存储（MySQL）

| 表 | 用途 |
|----|------|
| `t_xgkb_personal_bookshelf` | 个人书架入口，多行/人（对应 `spaces[]`） |
| `t_xgkb_personal_bookshelf_profile` | 个人书架状态 1 行/人：`active_space_id`、`preview_mode`、`revision` |
| `t_xgkb_personal_bookshelf_star` | 个人书架置顶，多行/人（对应 `xgkb:starred_projects`） |
| `t_xgkb_corp_bookshelf` | 企业书架（Phase 1 仅 DDL；读接口返回空列表） |

- 个人 **不按 `appCode` 分表**：同一企业同一用户跨应用共用一份配置。
- 主键：`IdWorker` 雪花 ID（`star` 表同）。
- Flyway：`V1.11`（初版）→ `V1.13` 替换个人单表 JSON 为三表；`V1.12` 删 Banner。
- **不上云**：`apiMode`、`serverUrl`、`appKey` 仍仅浏览器 localStorage。

### 19.3.1 本地存储与云端映射

| localStorage | 云端 |
|--------------|------|
| `xgkb_explorer_config.spaces[]` | `t_xgkb_personal_bookshelf` |
| `xgkb_explorer_config.activeSpaceId` | `t_xgkb_personal_bookshelf_profile.active_space_id` |
| `xgkb_explorer_config.previewMode` | `t_xgkb_personal_bookshelf_profile.preview_mode` |
| `xgkb:starred_projects[]` | `t_xgkb_personal_bookshelf_star` |

`GET/PUT /v1/settings` 对外仍为聚合的 `UserSettingsV1`。

### 19.4 企业书架（Phase 2 已实现）

- 用户读：`GET /v1/corp-bookshelves?appCode=` → 按可见性过滤的 `bookshelves[]`。
- 管理端：`/xgkb/admin/corp-bookshelves` CRUD（见 §22）。
- 企业与个人 JSON 同构（`BookshelfConfigV1`）；企业额外字段：`visibility_scope`（`all`|`dept`）、`visibility_dept_ids`。

### 19.5 xgkb-explorer 接入（分两期）

完整步骤见 **§23**。摘要：

- **一期（本期）**：仅个人 `GET/PUT /v1/settings`（及 §21 局部 API）；`settingsApiBaseUrl` → `.../document-database/xgkb/v1`。
- **二期（后续）**：`GET /v1/corp-bookshelves?appCode=` + 双栏 merge；**本期可不实现**。

### 19.6 与原文档差异摘要

| 项 | 原规格 | docdb 实现 |
|----|--------|------------|
| 部署 | 独立 SQLite 服务 | document-database + MySQL |
| 路径 | `/xgkb-settings-api/v1` | `/document-database/xgkb/v1` |
| 鉴权 | 服务自校验 Bearer | 网关注入 header |
| 企业书架 | 无 | 独立 GET，Phase 2 填数据 |
| Banner | 无 | 已移除未上线 Banner 功能 |

## 20. Phase 1 交付清单（docdb，2026-06-30）

Phase 1 已完成并可交付 xgkb-explorer 联调。

### 20.1 Base URL

| 环境 | Base URL |
|------|----------|
| 本地直连后端 | `http://localhost:8100/xgkb` |
| 经 Cwork 网关 | `https://<网关域名>/document-database/xgkb` |

前端 `settingsApiBaseUrl` 建议设为：`{base}/v1`（即 `.../xgkb/v1`）。

### 20.2 请求头

| Header | 说明 |
|--------|------|
| `access-token` | 与知识库一致，由 Cwork 网关校验 |
| `corpId` | 网关解析 token 后注入（本地联调可手动传） |
| `employeeId` | 同上 |

本地冒烟示例：

```bash
# 健康检查（无需鉴权）
curl http://localhost:8100/xgkb/health

# 获取个人书架（缺 header → 401）
curl http://localhost:8100/xgkb/v1/settings

# 带身份
curl -H "corpId: 100" -H "employeeId: 200" \
  http://localhost:8100/xgkb/v1/settings

# 企业书架（Phase 1 恒为空列表）
curl -H "corpId: 100" -H "employeeId: 200" \
  "http://localhost:8100/xgkb/v1/corp-bookshelves?appCode=kz_doc"
```

### 20.3 成功响应示例

`GET /v1/settings`（已有数据）：

```json
{
  "exists": true,
  "settings": {
    "version": 1,
    "spaces": [
      { "id": "directory-abc", "name": "研发知识库", "directoryId": "abc" }
    ],
    "activeSpaceId": "directory-abc",
    "previewMode": "self",
    "starredProjectIds": ["10001"]
  },
  "revision": "2026-06-30T06:17:35.127Z",
  "createdAt": "2026-06-30T06:17:35.000Z",
  "updatedAt": "2026-06-30T06:17:35.000Z"
}
```

`GET /v1/corp-bookshelves?appCode=kz_doc`（Phase 1）：

```json
{ "bookshelves": [] }
```

### 20.4 Phase 1 验收结果

| # | 场景 | 状态 |
|---|------|------|
| 1 | `GET/PUT /v1/settings` 字段与 §7 一致 | ✅ |
| 2 | `GET corp-bookshelves` 返回空列表 | ✅ |
| 3 | `/banner/list` 404 | ✅ |
| 4 | 不同 `employeeId` 数据隔离 | ✅ |
| 5 | `baseRevision` 过期返回 409 + `details.current` | ✅ |
| 6 | 单测：Validator / Service / Controller | ✅ |

### 20.5 与 xgkb-explorer 的分工

| 项 | 后端 | xgkb-explorer 一期 | xgkb-explorer 二期 |
|----|------|-------------------|-------------------|
| 个人书架 API | ✅ | **接入** | 沿用 |
| 局部 API（§21） | ✅ | 可选 | 沿用 |
| 企业书架读 API | ✅ | **不接入** | 接入 |
| 企业书架管理 UI | ✅ admin API | 不做 | 可选（或由知识库管理端） |
| 双栏 merge UI | — | **不做** | 接入 |

## 21. 局部 API（Phase 2 已实现）

Phase 1 聚合 `GET/PUT /v1/settings` 仍可用。以下局部接口已上线（路径前缀 `/document-database/xgkb`）：

| 方法 | 路径 | 用途 |
|------|------|------|
| PATCH | `/v1/profile` | 仅更新 `activeSpaceId` / `previewMode`（body 含 `baseRevision`） |
| POST | `/v1/bookshelves` | 新增一条 `spaces[]` |
| PUT | `/v1/bookshelves/{spaceId}` | 修改书架入口 |
| DELETE | `/v1/bookshelves/{spaceId}?baseRevision=` | 删除书架入口 |
| POST | `/v1/stars` | 新增置顶 |
| DELETE | `/v1/stars/{projectId}?baseRevision=` | 取消置顶 |

所有局部写操作要求 **已有个人 profile** 且 `baseRevision` 与当前一致；冲突返回 `409`。

## 22. Phase 2 后端交付（企业书架 + 局部 API，2026-06-30）

### 22.1 用户读企业书架

```
GET /document-database/xgkb/v1/corp-bookshelves?appCode=kz_doc
Header: corpId, employeeId
```

- 仅返回 `status=1`、未软删、且对当前用户可见的书架。
- 可见性：`visibility_scope=all` 全企业；`dept` 时用户部门链与 `visibility_dept_ids` 有交集才可见。

### 22.2 管理员 CRUD

鉴权：`AdminService.isAdmin(employeeId, corpId, appCode)`（与知识库管理员一致）。

| 方法 | 路径 |
|------|------|
| GET | `/document-database/xgkb/admin/corp-bookshelves?appCode=` |
| POST | `/document-database/xgkb/admin/corp-bookshelves` |
| PUT | `/document-database/xgkb/admin/corp-bookshelves/{id}` |
| DELETE | `/document-database/xgkb/admin/corp-bookshelves/{id}` |

POST body 示例：

```json
{
  "appCode": "kz_doc",
  "name": "全公司推荐",
  "visibilityScope": "all",
  "visibilityDeptIds": [],
  "sort": 0,
  "status": 1,
  "settings": {
    "version": 1,
    "spaces": [
      { "id": "corp-1001-abc", "name": "研发知识库", "directoryId": "abc" }
    ]
  }
}
```

PUT 需带 `baseRevision`；冲突返回 `409` + `details.current`。DELETE 为软删（`is_deleted=1`）。

管理员列表项含 `visibilityScope`、`visibilityDeptIds`、`status`、`sort`；用户读接口 **不暴露** 可见性字段。

### 22.3 本地冒烟

```bash
# 用户读（需先有管理员创建的数据）
curl -H "corpId: 100" -H "employeeId: 200" \
  "http://localhost:8100/xgkb/v1/corp-bookshelves?appCode=kz_doc"

# 管理员列表（需 isAdmin）
curl -H "corpId: 100" -H "employeeId: 200" \
  "http://localhost:8100/xgkb/admin/corp-bookshelves?appCode=kz_doc"

# 局部 PATCH profile
curl -X PATCH -H "corpId: 100" -H "employeeId: 200" \
  -H "Content-Type: application/json" \
  http://localhost:8100/xgkb/v1/profile \
  -d '{"activeSpaceId":"directory-abc","baseRevision":"<当前revision>"}'
```

### 22.4 前端分工（相对 xgkb-explorer）

- **一期（当前）**：个人书架 — 见 §23.1；**不必**调用 `corp-bookshelves`。
- **二期（后续）**：企业书架读 + 双栏 merge — 见 §23.2。
- 知识库 PC/H5 **企业书架管理 UI**（调 admin API）为另一路线，与 xgkb-explorer 二期可并行。

## 23. xgkb-explorer 对接指南（分两期）

> **给 xgkb-explorer 同事**：后端已就绪；**当前只需做一期（个人书架）**。二期企业书架 API 已上线，但前端可延后，互不阻塞。

### 23.1 一期：个人书架云同步（本期必做）

#### 配置

```text
settingsApiBaseUrl = {网关或本地}/document-database/xgkb/v1
```

鉴权与知识库一致：请求带 `access-token`，经网关注入 `corpId`、`employeeId`。

#### 启动流程（server-first）

```
登录成功
  → GET /v1/settings
  → exists=true  → 用 settings 渲染 UI，保存 revision
  → exists=false → 若 localStorage 有旧数据 → 用户确认 → PUT /v1/settings（baseRevision=null）
                  → 若无旧数据 → 空书架或引导添加
```

#### 需要同步的字段

| 云端 `settings` | 原 localStorage |
|-----------------|-----------------|
| `spaces[]` | `xgkb_explorer_config.spaces` |
| `activeSpaceId` | `xgkb_explorer_config.activeSpaceId` |
| `previewMode` | `xgkb_explorer_config.previewMode` |
| `starredProjectIds` | `xgkb:starred_projects` |

#### 写操作（二选一）

| 方式 | 适用 |
|------|------|
| 全量 `PUT /v1/settings` | 首次迁移、批量替换；body 含 `settings` + `baseRevision` |
| 局部 API（§21） | 日常：改选中书架、增删入口、置顶/取消 |

每次写成功后更新本地缓存的 `revision`；收到 `409` 时用 `details.current` 覆盖 UI。

#### 本期明确不做

- 不调用 `GET /v1/corp-bookshelves`
- 不做企业/个人双栏 merge
- 不把 `apiMode` / `serverUrl` / `appKey` 上传云端

#### 一期验收清单

- [ ] 登录后 `GET settings` 能拉到个人配置或 `exists: false`
- [ ] `PUT` 后换浏览器/设备能读到同一份数据
- [ ] 本地历史数据可一次性迁入
- [ ] `409` 冲突能恢复服务端状态
- [ ] `apiMode` 等仍只存 localStorage

---

### 23.2 二期：企业推荐书架（后续，本期跳过）

后端已提供读接口；xgkb-explorer **待产品需要「企业推荐区」时再接入**。

#### 额外调用

```
GET /v1/corp-bookshelves?appCode={与登录一致的 appCode}
```

响应 `bookshelves[]`：每项含 `id`、`name`、`settings.spaces[]`、`revision`（无个人侧的 `activeSpaceId` / 置顶）。

#### UI 建议

- 分区展示：**企业推荐**（只读，来自 corp） + **我的书架**（可编辑，来自 settings）
- `starredProjectIds` **仅**来自个人 `GET settings`，不与 enterprise 合并
- 企业区 `space.id` 可能与个人 `directory-{id}` 不同，合并展示时勿混用 id

#### 与一期的关系

- 一期上线 **不依赖** 二期；可先全站只有「我的书架」
- 二期上线时在一期流程上 **增加** 并行 `GET corp-bookshelves`，无需改个人同步逻辑
