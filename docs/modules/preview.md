---
module: preview
related_files:
  - src/lib/preview.ts
  - src/components/FilePreview.tsx
  - src/components/FileViewerModal.tsx
---

# preview

## 1. 职责（Responsibilities）

- 文件新标签页预览入口。
- Markdown / Mermaid / 代码 / HTML / 图片自渲染。
- KB 预览服务 iframe 模式。
- 新标签页打开、复制预览链接。

## 2. 目录结构（Files）

- `FileViewerModal.tsx`：预览状态机和工具栏动作。
- `src/lib/preview.ts`：文件新标签页打开策略。
- `FilePreview.tsx`：历史自渲染内容展示；当前弹窗预览优先使用服务端返回的预览地址。

## 3. 不可破坏原则（Invariants）

- 文件点击和“新标签页打开”必须使用同一种预览方案。
- 自渲染模式先取 `getDownloadInfo(fileId).downloadUrl`；Markdown 会 fetch 后渲染成带阅读样式的 HTML，新标签页打开；其他文件优先转 Blob URL 预览。
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
- Markdown self 模式 → `getDownloadInfo(fileId).downloadUrl` → `fetch` → styled HTML → 新标签页。
- 其他 self 模式 → `getDownloadInfo(fileId).downloadUrl` → `fetch` → Blob URL → 新标签页。
- `getFullFileContent` 只用于 README/index 摘要等文本提取场景，不用于文件弹窗预览。

## 6. 历史行为（History）

- 2026-06-22：修复新标签打开从下载链接改为与当前预览方案一致。
- 2026-06-24：自渲染预览从 `getFullFileContent` 调整为 `getDownloadInfo(fileId).downloadUrl`。
- 2026-06-24：文件点击不再弹出预览层，直接复用新标签页打开策略。
- 2026-06-24：为避免存储地址 `downloadUrl` 直接触发下载，新标签页预览改为先 fetch 文件内容并打开 Blob URL；CORS 失败时显示错误和下载链接。
- 2026-06-24：Markdown 新标签页预览增加排版样式，支持标题、列表、引用、表格、代码块、链接和图片。
