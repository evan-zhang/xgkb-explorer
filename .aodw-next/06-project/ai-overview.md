# xgkb-explorer AI System Overview

> ⚠️ **项目特化文件**：本文件描述当前项目的技术栈、架构、模块边界与不可破坏原则。修改架构、认证、配置 schema、API 合约、预览策略或部署方式时，必须同步更新本文件和 `.aodw-next/06-project/modules-index.yaml`。

Last updated: 2026-06-23

---

## 1. 技术栈

<!-- AUTO-DETECTED: 以下内容由 AI 自动检测 -->
- **前端**：React 19.2、TypeScript 6、Vite 8、Tailwind CSS 4、lucide-react。
- **文档渲染**：react-markdown、remark-gfm、rehype-raw、react-syntax-highlighter、mermaid。
- **认证**：钉钉登录 / Cwork 登录桥接，浏览器端保存 `xgkb_auth_session`、`xg_token`、`corp_id`、`user`。
- **后端**：无自建应用后端；浏览器端通过 `KbApiClient` 调玄关知识库 Open API，并通过 `src/lib/auth.ts` 调 Cwork/钉钉登录相关接口。
- **数据库**：无本项目数据库；数据来自玄关知识库服务和 Cwork 认证服务。
- **消息系统 / 缓存**：无自建消息系统；浏览器端使用 React state + localStorage 保存认证与配置。
- **运维 / 部署**：构建产物为 `dist/`；生产部署到 TPR VPS `/var/www/xgkb-explorer`；由 Caddy 托管 `https://tpr.20100706.xyz/xgkb/` 并提供 `/xgkb-api/` 同源 API 代理。
- **CI/CD**：GitHub Actions `.github/workflows/deploy.yml` 构建并上传静态文件；Caddy 配置不由 workflow 修改。
- **其他**：AODW-Next 规则已安装在 `.aodw-next/`；项目协作入口见 `CLAUDE.md` / `AGENTS.md`。
<!-- END AUTO-DETECTED -->

---

## 2. 整体架构概览

<!-- AI-ENHANCED: 以下内容由 AI 基于真实代码完善 -->

xgkb-explorer 是一个 React/Vite 浏览器应用，用于通过钉钉/Cwork 登录后浏览用户的玄关知识库。当前配置模型已经从 `spaceId + path` 简化为 **目录 ID（directoryId）入口**：

1. 用户先通过 `DingTalkLogin` 完成钉钉登录，`auth.ts` 将 Cwork 登录结果保存为本地认证 session。
2. 登录后用户在设置中保存 AppKey、serverUrl、previewMode 和一个或多个目录配置。
3. `useApiClient` 创建 `KbApiClient`。
4. 默认个人书架：`directoryId` 为空，`useProject` 调 `getPersonalProjectId`，再调 `getLevel1Folders(personalProjectId)` 展示个人空间根目录。
5. 自定义书架：`directoryId` 非空，`useProjectsHub` 直接调用 `getChildFiles(directoryId)`，展示该目录下的一级子文件夹作为项目。
6. 目录名称可通过 `batchGetMeta(directoryId)` 尝试自动读取。
7. 选择项目后进入双栏详情页：左侧目录树，右侧文件/文件夹列表，文件通过弹窗预览。
8. 预览根据 `previewMode` 选择本地渲染或 KB 预览服务。

```text
[ Browser / React SPA ]
        |
        | localStorage: auth session, appKey, serverUrl, previewMode, spaces[{directoryId}]
        v
[ Auth Gate: DingTalkLogin ] ──> [ App Shell ] ──> [ ProjectsHub ] ──> [ ProjectDetail ]
        |                              |                |                    |
        |                              |                |                    ├─ [ FileTree ] folder tree
        |                              |                |                    ├─ [ FileExplorer ] current folder grid
        |                              |                |                    └─ [ FileViewerModal / FilePreview ] preview
        |                              v
        |                       [ KbApiClient ]
        |                              |
        v                              v
[ Cwork / DingTalk Login APIs ]  [ Xuan Guan Knowledge Base Open API ]
```

Production traffic goes to `https://tpr.20100706.xyz/xgkb/`. API calls can use the upstream Open API URL directly or the Caddy same-origin proxy `/xgkb-api/` when CORS/proxy behavior requires it.

<!-- END AI-ENHANCED -->

---

## 3. 目录结构

<!-- AUTO-DETECTED: 以下内容由 AI 自动检测 -->

```text
src/
  App.tsx                         # top-level shell, auth gate, config modal lifecycle, view routing
  main.tsx                        # React app bootstrap
  components/
    DingTalkLogin.tsx             # Cwork company selection and DingTalk login UI
    ConfigModal.tsx               # app key/server/preview mode/directory entry config UI
    ProjectsHub.tsx               # project/bookshelf card grid and project selection
    ProjectDetail.tsx             # two-pane project view, tree + file list + modal
    FileTree.tsx                  # expandable folder tree
    FileExplorer.tsx              # folder/file cards, context menu actions
    FileViewerModal.tsx           # full-screen preview modal and new-window behavior
    FilePreview.tsx               # markdown/code/html/mermaid self-renderer
    ContextMenu.tsx               # reusable context menu
  lib/
    auth.ts                       # DingTalk/Cwork auth session, callbacks, SDK loading
    api.ts                        # KbApiClient and Open API request wrapper
    config.ts                     # localStorage config schema and migration
    hooks.ts                      # API client, project loading, tree/content hooks
    types.ts                      # Open API path constants and response types
  assets/                         # static images/icons
.aodw-next/                       # AODW-Next rules and project knowledge
.github/workflows/deploy.yml      # GitHub Actions deployment
DEPLOYMENT.md                     # deployment notes
README.md                         # project overview and setup
AGENTS.md / CLAUDE.md             # AI-agent project instructions
docs/modules/                     # module knowledge files
docs/decisions/                   # ADR-style decisions
docs/rt/                          # RT specifications and discovery notes
```

<!-- END AUTO-DETECTED -->

---

## 4. 核心业务模块职责

<!-- AI-ENHANCED: 以下内容由 AI 基于真实代码完善 -->

### app-shell
- Coordinates authentication gate, API client initialization, personal project ID loading, directory entry switching, view routing, and config modal lifecycle.
- Key files: `src/App.tsx`, `src/main.tsx`.

### auth
- Owns DingTalk/Cwork login flow, auth callback parsing, SDK loading, session persistence, and logout/clear behavior.
- Key files: `src/lib/auth.ts`, `src/components/DingTalkLogin.tsx`.

### config
- Owns persisted localStorage schema: appKey, serverUrl, previewMode, spaces, activeSpaceId.
- Current `SpaceEntry` model: `{ id, name, directoryId }`; empty `directoryId` means personal root.
- Owns UI for creating/editing directory entries.
- Key files: `src/lib/config.ts`, `src/components/ConfigModal.tsx`.

### api-client
- Wraps Xuan Guan Open API calls and maps result envelopes into `ApiResult<T>`.
- Key files: `src/lib/api.ts`, `src/lib/types.ts`.

### data-hooks
- Owns project ID state, directoryId loading, root project list loading, folder tree child loading, and README/index preview lookup.
- Key file: `src/lib/hooks.ts`.

### project-ui
- Owns project hub, project detail layout, folder tree, file grid, refresh controls, context menu, and navigation interaction.
- Key files: `src/components/ProjectsHub.tsx`, `ProjectDetail.tsx`, `FileTree.tsx`, `FileExplorer.tsx`, `ContextMenu.tsx`.

### preview
- Owns local markdown/code/html/image rendering, KB preview mode, preview ticket behavior, copy/open/share actions.
- Key files: `src/components/FilePreview.tsx`, `src/components/FileViewerModal.tsx`.

### deployment
- Owns build/upload path and production deployment documentation.
- Key files: `deploy.sh`, `.github/workflows/deploy.yml`, `DEPLOYMENT.md`, `docs/runbook.md`.

<!-- END AI-ENHANCED -->

---

## 5. 系统级 Invariants（不可破坏原则）

<!-- USER-ADDED: 以下内容由用户或 AI 引导添加 -->

- **认证边界**：未登录时必须停留在 `DingTalkLogin`，不得加载知识库主界面。
- **认证配置**：`VITE_CWORK_APP_CODE` 是钉钉/Cwork 登录必要配置；缺失时必须给出明确错误。
- **AppKey 边界**：`projectId` 必须绑定当前 `KbApiClient` / AppKey；AppKey 或 serverUrl 变化时必须丢弃旧 `projectId`。
- **配置兼容**：localStorage schema 变更必须迁移旧配置，不能让已有用户目录配置丢失。
- **书架加载语义**：空 `directoryId` 表示个人空间根目录；非空 `directoryId` 表示直接以该目录 ID 调 `getChildFiles(directoryId)`。
- **旧配置迁移**：旧 `spaceId/path/rootFileId` 等字段必须尽量迁移为新的 `directoryId` 模型或保持可读。
- **预览一致性**：弹窗预览和“新标签页打开”应使用同一种方案；不能无条件改成 `downloadUrl` 导致浏览器下载。
- **安全**：禁止提交真实 AppKey、VPS 密码或长期 token。部署凭据必须使用 GitHub Secrets 或本地环境变量。
- **部署边界**：GitHub Actions / `deploy.sh` 只更新静态文件，不修改 Caddy/nginx/web server 配置。
- **生产路径**：生产访问路径保持 `https://tpr.20100706.xyz/xgkb/`；API 代理保持 `/xgkb-api/` 语义。
- **验证门槛**：涉及认证、API、配置、预览、部署的变更至少执行 `npm run build`，并做浏览器冒烟验证。

<!-- END USER-ADDED -->

---

## 6. 模块 README 映射表

<!-- AUTO-DETECTED: 以下内容由 AI 自动生成 -->

| Module | README | Primary files |
| --- | --- | --- |
| app-shell | `docs/modules/app-shell.md` | `src/App.tsx`, `src/main.tsx` |
| auth | `docs/modules/auth.md` | `src/lib/auth.ts`, `src/components/DingTalkLogin.tsx` |
| config | `docs/modules/config.md` | `src/lib/config.ts`, `src/components/ConfigModal.tsx` |
| api-client | `docs/modules/api-client.md` | `src/lib/api.ts`, `src/lib/types.ts` |
| data-hooks | `docs/modules/data-hooks.md` | `src/lib/hooks.ts` |
| project-ui | `docs/modules/project-ui.md` | `src/components/ProjectsHub.tsx`, `ProjectDetail.tsx`, `FileTree.tsx`, `FileExplorer.tsx`, `ContextMenu.tsx` |
| preview | `docs/modules/preview.md` | `src/components/FilePreview.tsx`, `FileViewerModal.tsx` |
| deployment | `docs/modules/deployment.md` | `deploy.sh`, `.github/workflows/deploy.yml`, `DEPLOYMENT.md`, `docs/runbook.md` |

<!-- END AUTO-DETECTED -->

---

## 7. 历史关键变更

<!-- USER-ADDED: 以下内容由用户或 AI 引导添加 -->

- 2026-06-21：从单文件 HTML 原型推进到 React/Vite 项目，加入 Projects Hub、文件树、文件预览弹窗、多空间配置。
- 2026-06-22：修复 AppKey 切换后旧 `projectId` 未失效导致空列表的问题。
- 2026-06-23：主线引入 `directoryId` 书架配置模型，用一个目录 ID 定位书架根目录。
- 2026-06-23：主线引入钉钉登录门禁，未登录时不加载知识库主界面。
- 2026-06-23：安装 AODW-Next，建立项目级规范、模块索引与 RT 文档。

<!-- END USER-ADDED -->
