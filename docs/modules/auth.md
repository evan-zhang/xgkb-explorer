---
module: auth
related_files:
  - src/lib/auth.ts
  - src/components/DingTalkLogin.tsx
---

# auth

## 1. 职责（Responsibilities）

- 提供钉钉/Cwork 登录入口。
- 获取可选企业列表、钉钉 appKey、构建 OAuth URL、处理扫码/跳转回调。
- 保存和清理浏览器端认证 session。
- 在用户未登录时阻止进入知识库主界面。

## 2. 目录结构（Files）

- `src/lib/auth.ts`：认证 API、SDK 加载、回调解析、session localStorage。
- `src/components/DingTalkLogin.tsx`：登录 UI、企业选择、扫码/跳转入口。

## 3. 不可破坏原则（Invariants）

- `VITE_CWORK_APP_CODE` 缺失时必须给用户明确错误。
- 不得提交真实 token、corp secret 或长期认证信息。
- 登录成功后应保存 `xgkb_auth_session`、`xg_token`、`corp_id`、`user`，以兼容既有系统读取。
- 登出/清理必须同步移除上述认证缓存。
- 回调 URL 清理后不能破坏 `/xgkb/` SPA 路由。

## 4. 依赖关系（Dependencies）

### 上游
- Cwork login API
- DingTalk OAuth / H5 login SDK
- browser localStorage

### 下游
- `app-shell`
- `api-client`（间接受登录结果/配置影响）

## 5. 常见流程说明（Workflows）

1. 加载企业列表。
2. 用户选择企业并发起扫码或跳转登录。
3. 钉钉回调带 code/state 回到应用。
4. `exchangeDingTalkCode` 换取 xgToken/corp/user。
5. 保存 auth session，进入 App 主界面。

## 6. 历史行为（History）

- 2026-06-23：主线引入钉钉登录门禁。
