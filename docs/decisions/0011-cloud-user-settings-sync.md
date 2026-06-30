# 0011 - 按登录身份同步用户设置

日期：2026-06-29

## 状态

已接受，等待实现。

## 背景

xgkb-explorer 目前把书架入口、当前书架选择、预览偏好和收藏项目保存在浏览器 `localStorage` 中。

这种方式让首次加载和本地缓存比较简单，但数据只属于当前浏览器 profile。同一个钉钉/Cwork 用户换浏览器或换设备后，已配置的项目和收藏不会自动出现。

应用已经要求用户先通过钉钉/Cwork 登录再进入知识库浏览器。登录结果包含 `xgToken`，也包含用户和企业相关元数据。

## 决策

新增服务端用户 settings API，并按登录身份同步设置。当前后端实现承载在 `document-database` 服务中。

- settings API 暴露在 `/document-database/xgkb/v1/settings` 下；前端通过 `VITE_SETTINGS_API_BASE_URL` 可覆盖默认网关地址。
- API 使用从登录 token 推导出的 `corpId:userId` 作为稳定用户 key。
- 后端必须从 token 推导身份，不能信任请求 body 里的用户 id。
- 前端继续保留 `localStorage`，作为快速缓存和离线兜底。
- 登录后，前端拉取服务端 settings，并写回本地缓存和 React state。
- 如果服务端没有当前用户的 settings，前端上传当前本地 settings 作为第一份云端记录。
- 后续用户修改配置时，前端先更新本地 state，再异步同步到服务端。

第一版同步字段：

- `spaces`
- `activeSpaceId`
- `previewMode`
- `starredProjectIds`

第一版不同步字段：

- `xgToken`
- 登录 session 数据
- `appKey`
- `apiMode`
- `serverUrl`

API 对接契约见 `docs/settings-sync-api.md`。

## 影响

- 用户换浏览器或设备后，可以恢复书架和收藏数据。
- settings API 临时不可用时，本地缓存仍然可用。
- 前端需要新增 settings API client，并把收藏状态从 `ProjectsHub` 内部提升到上层统一管理。
- 后端会引入有状态存储，因此生产部署前需要明确备份和运维要求。
- token 校验会成为 settings API 的安全边界。
