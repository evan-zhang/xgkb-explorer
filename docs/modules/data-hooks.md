---
module: data-hooks
related_files:
  - src/lib/hooks.ts
---

# data-hooks

## 1. 职责（Responsibilities）

- 维护 API client、文件树、空间/项目列表和 README 摘要等数据状态。
- 把默认入口和配置目录解析为空间/项目列表。

## 2. 目录结构（Files）

- `src/lib/hooks.ts`：`useApiClient`、`useProject`、`useProjectsHub`、`useFileTree`、`useFileContent`、`useReadmePreview`。

## 3. 不可破坏原则（Invariants）

- 空 `directoryId` 必须调用 `findAllProjects` 获取当前用户可见空间。
- 非空 `directoryId` 必须直接调用 `getChildFiles(directoryId)`。
- `projectId` 只对当前 client/AppKey 有效，切换 AppKey 必须重置。

## 4. 依赖关系（Dependencies）

### 上游
- `api-client`
- `config`

### 下游
- `app-shell`
- `project-ui`

## 5. 常见流程说明（Workflows）

1. `useApiClient` 初始化 client。
2. `useProjectsHub` 在空 `directoryId` 时调用 `findAllProjects` 加载当前用户可见空间。
3. `useProjectsHub.loadSpaceProjects` 在选择空间后调用 `getLevel1Folders(projectId)` 加载该空间下级目录，作为可放入书架的候选项。
4. `useProjectsHub` 在非空 `directoryId` 时调用 `getChildFiles(directoryId)` 加载目录下项目文件夹。
5. `useReadmePreview` 查找 README/index 文件作为卡片摘要。

## 6. 历史行为（History）

- 2026-06-23：主线引入 `directoryId` 书架入口解析。
- 2026-06-24：默认入口改为 `findAllProjects` 返回的可见空间列表。
