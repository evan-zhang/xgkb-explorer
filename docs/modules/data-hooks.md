---
module: data-hooks
related_files:
  - src/lib/hooks.ts
---

# data-hooks

## 1. 职责（Responsibilities）

- 维护 API client、项目 ID、文件树、项目列表和 README 摘要等数据状态。
- 把配置中的空间/路径解析为项目列表。

## 2. 目录结构（Files）

- `src/lib/hooks.ts`：`useApiClient`、`useProject`、`useProjectsHub`、`useFileTree`、`useFileContent`、`useReadmePreview`。

## 3. 不可破坏原则（Invariants）

- `projectId` 只对当前 client/AppKey 有效。
- 空 `directoryId` 表示个人空间根目录。
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
2. `useProject` 获取 personal project id。
3. `useProjectsHub` 根据 `directoryId` 加载个人根目录或指定目录下的项目文件夹。
4. `useReadmePreview` 查找 README/index 文件作为卡片摘要。

## 6. 历史行为（History）

- 2026-06-23：主线引入 `directoryId` 书架入口解析。
