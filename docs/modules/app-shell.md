---
module: app-shell
related_files:
  - src/App.tsx
  - src/main.tsx
---

# app-shell

## 1. 职责（Responsibilities）

- 初始化 React SPA。
- 协调认证门禁、API client、个人 projectId、目录配置切换、页面视图和设置弹窗。
- 在 hub 视图和 project detail 视图之间切换。

## 2. 目录结构（Files）

- `src/main.tsx`：React bootstrap。
- `src/App.tsx`：顶层状态、认证门禁和布局。

## 3. 不可破坏原则（Invariants）

- AppKey/serverUrl 切换后必须重置旧 `projectId`。
- `activeSpaceId` 必须和 `spaces` 配置保持一致。
- 未登录时必须显示认证入口，不得加载知识库主界面。
- 未配置 AppKey 时必须打开配置弹窗或显示可操作错误。

## 4. 依赖关系（Dependencies）

### 上游
- `auth`
- `config`
- `api-client`
- `data-hooks`

### 下游
- `project-ui`
- `preview`

## 5. 常见流程说明（Workflows）

1. 检查/处理认证 session。
2. 加载 localStorage 配置。
3. 初始化 `KbApiClient`。
3. 对个人空间调用 `getPersonalProjectId`。
4. 加载项目列表并渲染 ProjectsHub。
5. 选择项目后进入 ProjectDetail。

## 6. 历史行为（History）

- 2026-06-22：修复 AppKey 切换时 projectId 未重置的问题。
