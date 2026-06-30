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

前端后续会按以下流程接入：

1. 页面启动时先读取本地 `localStorage`，保证应用快速可用。
2. 完成钉钉/Cwork 登录，拿到 `xgToken`。
3. 调用 `GET /xgkb-settings-api/v1/settings`。
4. 如果 `exists: true`，用服务端 settings 覆盖本地缓存和 React state。
5. 如果 `exists: false`，把当前本地 settings 通过 `PUT` 上传，完成首次迁移。
6. 用户修改书架、当前书架、预览方式或收藏时，先更新本地 state，再 debounce 调用 `PUT`。
7. 如果云同步失败，本地变更仍保留，前端显示非阻塞同步失败提示。
8. 如果出现 `409`，第一版可以提示用户刷新，或用服务端 `current` 记录覆盖本地。细粒度合并后续再做。

建议前端保存 debounce：

```text
500 ms 到 1,000 ms
```

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
