---
module: config
related_files:
  - src/lib/config.ts
  - src/components/ConfigModal.tsx
---

# config

## 1. 职责（Responsibilities）

- 管理 xgkb-explorer 的持久配置。
- 提供设置弹窗，配置 AppKey、serverUrl、previewMode 和空间入口。
- 维护 localStorage schema 和迁移逻辑。

## 2. 目录结构（Files）

- `src/lib/config.ts`：配置类型、默认值、读写和清理。
- `src/components/ConfigModal.tsx`：配置 UI。

## 3. 不可破坏原则（Invariants）

- 不得提交真实 AppKey。
- schema 变更必须迁移已有 localStorage 用户。
- 当前 `SpaceEntry` 使用 `{ id, name, directoryId }`。
- 空 `directoryId` 表示当前登录用户可见空间列表；非空 `directoryId` 表示目录型入口。
- 旧版 `spaceId/path/rootFileId` 等配置必须尽量迁移或保持可读。

## 4. 依赖关系（Dependencies）

### 上游
- 浏览器 localStorage

### 下游
- `app-shell`
- `data-hooks`

## 5. 常见流程说明（Workflows）

- 用户打开设置 → 修改配置 → 保存到 localStorage → App 重新初始化 client 和 active space。

## 6. 历史行为（History）

- 2026-06-23：主线已引入 `directoryId` 书架配置模型，降低空间 ID + 路径配置复杂度。
- 2026-06-24：空 `directoryId` 默认入口改为当前用户可见空间列表。
