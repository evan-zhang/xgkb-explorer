---
module: project-ui
related_files:
  - src/components/ProjectsHub.tsx
  - src/components/ProjectDetail.tsx
  - src/components/FileTree.tsx
  - src/components/FileExplorer.tsx
  - src/components/ContextMenu.tsx
---

# project-ui

## 1. 职责（Responsibilities）

- 展示项目/书架卡片。
- 展示项目详情页的目录树和文件卡片网格。
- 处理目录刷新、列表刷新、右键菜单、新标签打开、复制链接和分享。

## 2. 目录结构（Files）

- `ProjectsHub.tsx`：项目卡片首页。
- `ProjectDetail.tsx`：左右分栏详情页。
- `FileTree.tsx`：左侧目录树。
- `FileExplorer.tsx`：右侧文件/文件夹列表。
- `ContextMenu.tsx`：上下文菜单。

## 3. 不可破坏原则（Invariants）

- 刷新按钮只应重新拉取对应范围数据，不应重置 AppKey 或 active space。
- 文件夹点击应导航；文件点击应打开预览。
- 右键菜单对文件夹和文件的动作差异必须保留。

## 4. 依赖关系（Dependencies）

### 上游
- `data-hooks`
- `api-client`

### 下游
- `preview`

## 5. 常见流程说明（Workflows）

- Hub 选择项目 → ProjectDetail 载入根目录树和当前目录列表 → 点击文件打开 FileViewerModal。

## 6. 历史行为（History）

- 2026-06-23：新增左侧目录树刷新和右侧文件列表刷新。
