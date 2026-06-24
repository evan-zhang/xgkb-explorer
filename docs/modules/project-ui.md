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

- 展示空间卡片、可加入书架的目录卡片、项目卡片和书架卡片。
- 展示项目详情页的目录树和文件卡片网格。
- 处理目录刷新、列表刷新、右键菜单、新标签打开、复制链接和分享。

## 2. 目录结构（Files）

- `ProjectsHub.tsx`：空间/项目卡片首页。
- `ProjectDetail.tsx`：左右分栏详情页。
- `FileTree.tsx`：左侧目录树。
- `FileExplorer.tsx`：右侧文件/文件夹列表。
- `ContextMenu.tsx`：上下文菜单。

## 3. 不可破坏原则（Invariants）

- 刷新按钮只应重新拉取对应范围数据，不应重置 AppKey 或 active space。
- 文件夹点击应导航；文件点击应直接按“在新标签页打开”的同一逻辑打开。
- 右键菜单对文件夹和文件的动作差异必须保留。

## 4. 依赖关系（Dependencies）

### 上游
- `data-hooks`
- `api-client`

### 下游
- `preview`

## 5. 常见流程说明（Workflows）

- Hub 默认展示空间卡片 → 选择空间后展示该空间下级目录 → 点击目录将其放入书架 → 选择书架项目后 ProjectDetail 载入目录树和当前目录列表 → 点击文件在新标签页打开。

## 6. 历史行为（History）

- 2026-06-23：新增左侧目录树刷新和右侧文件列表刷新。
- 2026-06-24：空间卡片使用独立 UI，仅用于导航，不显示收藏或分享。
- 2026-06-24：空间下级目录改为“放入书架”入口，不再直接当项目进入详情。
- 2026-06-24：文件点击不再弹出预览层，改为直接复用新标签页打开逻辑。
