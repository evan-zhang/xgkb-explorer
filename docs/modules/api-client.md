---
module: api-client
related_files:
  - src/lib/api.ts
  - src/lib/types.ts
---

# api-client

## 1. 职责（Responsibilities）

- 封装玄关知识库 Open API。
- 统一 appKey header、GET/POST 参数、resultCode 错误映射。
- 提供项目、文件、内容、预览和分享相关调用。

## 2. 目录结构（Files）

- `src/lib/api.ts`：`KbApiClient`。
- `src/lib/types.ts`：API 路径、响应类型、文件类型。

## 3. 不可破坏原则（Invariants）

- `resultCode === 1` 才是成功。
- 所有 ID 在 UI/hooks 层使用时应字符串化。
- `getPreviewTicket` 用于 KB 预览服务；`downloadUrl` 可能触发浏览器下载，不能无条件作为预览链接。

## 4. 依赖关系（Dependencies）

### 上游
- 玄关知识库 Open API
- Caddy `/xgkb-api/` 同源代理（可选）

### 下游
- `data-hooks`
- `project-ui`
- `preview`

## 5. 常见流程说明（Workflows）

- `getPersonalProjectId` → `getLevel1Folders` / `getChildFiles` → 文件详情/预览 API。

## 6. 历史行为（History）

- 2026-06-22：确认切换 AppKey 后需要重新获取 personal project id。
