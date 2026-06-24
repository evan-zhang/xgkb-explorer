---
module: preview
related_files:
  - src/components/FilePreview.tsx
  - src/components/FileViewerModal.tsx
---

# preview

## 1. 职责（Responsibilities）

- 文件预览弹窗。
- Markdown / Mermaid / 代码 / HTML / 图片自渲染。
- KB 预览服务 iframe 模式。
- 新标签页打开、复制预览链接。

## 2. 目录结构（Files）

- `FileViewerModal.tsx`：预览状态机和工具栏动作。
- `FilePreview.tsx`：自渲染内容展示。

## 3. 不可破坏原则（Invariants）

- “新标签页打开”必须与当前弹窗使用同一种预览方案。
- 不能无条件用 `downloadUrl` 作为预览链接，因为可能触发下载。
- KB 预览模式使用 `getPreviewTicket`；图片始终自渲染。

## 4. 依赖关系（Dependencies）

### 上游
- `api-client`
- `config.previewMode`

### 下游
- 浏览器 iframe / window.open

## 5. 常见流程说明（Workflows）

- 图片 → `getDownloadInfo` + image。
- MD/HTML + KB 模式 → `getPreviewTicket` + iframe。
- HTML + self 模式 → `downloadUrl` + iframe。
- 文本/代码 → `getFullFileContent` + `FilePreview`。

## 6. 历史行为（History）

- 2026-06-22：修复新标签打开从下载链接改为与当前预览方案一致。
